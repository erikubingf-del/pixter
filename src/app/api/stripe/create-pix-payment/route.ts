// src/app/api/stripe/create-pix-payment/route.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { supabaseServer } from "@/lib/supabase/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_YOUR_KEY", {
  apiVersion: "2022-11-15",
});

// Helper function to calculate application fee (4% for MVP)
const calculateApplicationFeeAmount = (amount: number): number => {
  return Math.floor(amount * 0.04); // 4% fee, rounded down
};

export async function POST(request: Request) {
  try {
    const { amount, driverPhoneNumber } = await request.json();

    // Basic validation
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }
    if (!driverPhoneNumber || typeof driverPhoneNumber !== "string") {
      return NextResponse.json({ error: "Identificação do motorista inválida." }, { status: 400 });
    }

    // Amount is already in cents from the frontend
    const amountInCents = Math.round(amount);

    // 1. Find the driver's profile using the phone number
    const formattedPhone = `+${driverPhoneNumber.replace(/\D/g, "")}`;

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, stripe_account_id")
      .eq("celular", formattedPhone)
      .eq("tipo", "motorista")
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching driver profile:", profileError.message);
      return NextResponse.json({ error: "Erro ao buscar motorista." }, { status: 500 });
    }

    if (!profile || !profile.stripe_account_id) {
      console.log("Driver not found or Stripe not connected for phone:", formattedPhone);
      return NextResponse.json({ error: "Motorista não encontrado ou não habilitado para pagamentos." }, { status: 404 });
    }

    const stripeAccountId = profile.stripe_account_id;

    // 2. Create a Payment Intent with Pix
    const applicationFee = calculateApplicationFeeAmount(amountInCents);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      payment_method_types: ["pix"], // Pix only
      // Pix requires a return URL even though we poll
      payment_method_options: {
        pix: {
          expires_after_seconds: 600, // 10 minutes
        },
      },
      // Destination charge (Stripe Connect)
      transfer_data: {
        destination: stripeAccountId,
      },
      // Application Fee (AmoPagar's 4% commission)
      application_fee_amount: applicationFee,
      metadata: {
        driverId: profile.id,
        driverPhoneNumber: formattedPhone,
        payingPhoneNumber: driverPhoneNumber,
        applicationFee: applicationFee.toString(),
        paymentMethod: 'pix',
      },
    });

    // 3. Get the Pix QR code from the payment intent
    // For Pix, we need to confirm the payment intent to get the QR code
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: 'pix',
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pagamento/sucesso`,
    });

    // Extract Pix code from next_action
    const pixCode = confirmedPaymentIntent.next_action?.pix_display_qr_code?.data;

    if (!pixCode) {
      console.error('Failed to generate Pix code:', confirmedPaymentIntent);
      return NextResponse.json({ error: 'Failed to generate Pix code' }, { status: 500 });
    }

    // 4. Return the Pix code and payment intent ID to the frontend
    return NextResponse.json({
      paymentIntentId: confirmedPaymentIntent.id,
      pixCode: pixCode,
      clientSecret: confirmedPaymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error("Create Pix Payment error:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao criar pagamento Pix." },
      { status: 500 }
    );
  }
}
