import { NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { summarizeStripeAccount } from "@/lib/stripe/connect";
import { supabaseServer } from "@/lib/supabase/client";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  // Always return 200 to prevent Stripe retries for non-retryable errors
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as any);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as any);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as any);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as any);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as any);
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    // Still return 200 to prevent retries
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const { id, amount, metadata, currency, status, latest_charge } = paymentIntent;
  const driverId = metadata?.driverId;
  const applicationFee = metadata?.applicationFee ? parseInt(metadata.applicationFee) : 0;

  if (!driverId) {
    console.error("Missing driverId in PaymentIntent metadata:", id);
    return;
  }

  try {
    let chargeId: string | null = null;
    let paymentMethodType: string | null = null;
    let receiptUrl: string | null = null;

    if (latest_charge) {
      if (typeof latest_charge === 'string') {
        const charge = await stripe.charges.retrieve(latest_charge);
        chargeId = charge.id;
        paymentMethodType = charge.payment_method_details?.type || null;
        receiptUrl = charge.receipt_url || null;
      } else {
        chargeId = latest_charge.id;
        paymentMethodType = latest_charge.payment_method_details?.type || null;
        receiptUrl = latest_charge.receipt_url || null;
      }
    }

    // Store amounts in cents (no division by 100)
    const netAmount = amount - applicationFee;

    // Deterministic receipt number from payment ID (idempotent)
    const receiptNumber = `AMO-${id.replace('pi_', '').substring(0, 12).toUpperCase()}`;

    const { error: upsertError } = await supabaseServer
      .from("pagamentos")
      .upsert({
        stripe_payment_id: id,
        stripe_charge_id: chargeId,
        motorista_id: driverId,
        valor: amount,
        moeda: currency,
        status: status,
        metodo: paymentMethodType,
        application_fee_amount: applicationFee,
        net_amount: netAmount,
        receipt_url: receiptUrl,
        receipt_number: receiptNumber,
        metadata: {
          driverPhoneNumber: metadata?.driverPhoneNumber,
          payingPhoneNumber: metadata?.payingPhoneNumber,
        },
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        // Link to authenticated client if available
        ...(metadata?.clienteId ? { cliente_id: metadata.clienteId } : {}),
      }, { onConflict: "stripe_payment_id" });

    if (upsertError) {
      console.error("Error upserting payment record:", upsertError.message);
    }
  } catch (error) {
    console.error("Exception in handlePaymentIntentSucceeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  const { id } = paymentIntent;
  try {
    const { error } = await supabaseServer
      .from("pagamentos")
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq("stripe_payment_id", id);

    if (error) {
      console.error("Error updating failed payment:", error.message);
    }
  } catch (error) {
    console.error("Exception in handlePaymentIntentFailed:", error);
  }
}

async function handleDisputeCreated(dispute: any) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  try {
    // Get existing payment to merge metadata
    const { data: existing } = await supabaseServer
      .from("pagamentos")
      .select("metadata")
      .eq("stripe_charge_id", chargeId)
      .single();

    const existingMeta = existing?.metadata || {};

    const { error } = await supabaseServer
      .from("pagamentos")
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
        metadata: {
          ...existingMeta,
          dispute_id: dispute.id,
          dispute_reason: dispute.reason,
          dispute_amount: dispute.amount,
          dispute_created: new Date(dispute.created * 1000).toISOString(),
          dispute_status: dispute.status,
        },
      })
      .eq("stripe_charge_id", chargeId);

    if (error) {
      console.error("Error updating disputed payment:", error.message);
    }
  } catch (error) {
    console.error("Exception in handleDisputeCreated:", error);
  }
}

async function handleChargeRefunded(charge: any) {
  try {
    const { error } = await supabaseServer
      .from("pagamentos")
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq("stripe_charge_id", charge.id);

    if (error) {
      console.error("Error updating refunded payment:", error.message);
    }
  } catch (error) {
    console.error("Exception in handleChargeRefunded:", error);
  }
}

async function handleAccountUpdated(account: any) {
  const { id, metadata } = account;
  const supabaseUserId = metadata?.supabaseUserId;

  if (!supabaseUserId) {
    console.error("Missing supabaseUserId in Stripe Account metadata:", id);
    return;
  }

  try {
    const summary = summarizeStripeAccount(account);

    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update({
        stripe_account_charges_enabled: summary.charges_enabled,
        stripe_account_details_submitted: summary.details_submitted,
        stripe_account_payouts_enabled: summary.payouts_enabled,
        stripe_account_status: summary.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", supabaseUserId);

    if (updateError) {
      console.error("Error updating profile from account.updated:", updateError.message);
    }
  } catch (error) {
    console.error("Exception in handleAccountUpdated:", error);
  }
}
