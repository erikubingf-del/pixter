// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { supabaseServer } from "@/lib/supabase/client"; // Use Service Role Key

// Initialize Stripe (Use environment variables!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_YOUR_KEY", {
  apiVersion: "2022-11-15",
});

// Get the webhook secret from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_YOUR_SECRET";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    console.log("Webhook event received:", event.type);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Handling payment_intent.succeeded: ${paymentIntent.id}`);
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case "account.updated":
        const account = event.data.object as Stripe.Account;
        console.log(`Handling account.updated: ${account.id}`);
        await handleAccountUpdated(account);
        break;

      // Add other event types you want to handle here
      // e.g., payment_intent.payment_failed, charge.dispute.created, etc.

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Webhook processing error." },
      { status: 500 }
    );
  }
}

// --- Handler Functions ---

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { id, amount, metadata, currency, status, charges } = paymentIntent;
  const driverId = metadata?.driverId;
  const applicationFee = metadata?.applicationFee ? parseInt(metadata.applicationFee) : 0;

  if (!driverId) {
    console.error("Missing driverId in PaymentIntent metadata:", id);
    return; // Cannot link payment without driver ID
  }

  try {
    // Get charge details for payment method and receipt
    const charge = charges?.data?.[0];
    const chargeId = charge?.id || null;
    const paymentMethodType = charge?.payment_method_details?.type || null;
    const receiptUrl = charge?.receipt_url || null;

    // Calculate net amount (amount minus application fee)
    const netAmount = (amount - applicationFee) / 100; // Convert to BRL
    const valorTotal = amount / 100; // Total amount in BRL
    const feeAmount = applicationFee / 100; // Fee in BRL

    // Generate a unique receipt number for manual entry
    const receiptNumber = `AMO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Upsert payment record
    const { error: upsertError } = await supabaseServer
      .from("pagamentos")
      .upsert({
        stripe_payment_id: id,
        stripe_charge_id: chargeId,
        motorista_id: driverId,
        valor: valorTotal,
        moeda: currency,
        status: status,
        metodo: paymentMethodType,
        application_fee_amount: feeAmount,
        net_amount: netAmount,
        receipt_url: receiptUrl,
        receipt_number: receiptNumber,
        metadata: {
          driverPhoneNumber: metadata?.driverPhoneNumber,
          payingPhoneNumber: metadata?.payingPhoneNumber,
        },
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "stripe_payment_id" });

    if (upsertError) {
      console.error("Error upserting payment record:", upsertError.message);
    } else {
      console.log(`Payment recorded: ${id} - Driver: ${driverId} - Amount: R$ ${valorTotal} - Net: R$ ${netAmount}`);

      // Generate receipt PDF asynchronously (don't block webhook response)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/receipts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: id }),
      }).catch(err => console.error('Error triggering receipt generation:', err));

      // TODO: Send notification to driver (email/SMS/push)
      // TODO: Send receipt to client if cliente_id is available
    }

  } catch (error) {
    console.error("Exception in handlePaymentIntentSucceeded:", error);
  }
}


async function handleAccountUpdated(account: Stripe.Account) {
  const { id, metadata, charges_enabled, details_submitted, payouts_enabled } = account;
  const supabaseUserId = metadata?.supabaseUserId; // Get Supabase user ID from metadata

  if (!supabaseUserId) {
    console.error("Missing supabaseUserId in Stripe Account metadata:", id);
    return; // Cannot link account update without the user ID
  }

  try {
    // Determine a simplified status based on Stripe flags
    let accountStatus = "pending";
    if (details_submitted) {
      accountStatus = charges_enabled && payouts_enabled ? "verified" : "restricted";
    }

    // Update the corresponding profile in Supabase
    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update({
        // Store individual flags or a combined status
        stripe_account_charges_enabled: charges_enabled,
        stripe_account_details_submitted: details_submitted,
        stripe_account_payouts_enabled: payouts_enabled,
        stripe_account_status: accountStatus, // Store the simplified status
        updated_at: new Date().toISOString(),
      })
      .eq("id", supabaseUserId); // Use the ID from metadata

    if (updateError) {
      console.error("Error updating profile from account.updated webhook:", updateError.message);
    } else {
      console.log("Profile updated successfully for Stripe account:", id, "User:", supabaseUserId);
    }

  } catch (error) {
    console.error("Exception in handleAccountUpdated:", error);
  }
}