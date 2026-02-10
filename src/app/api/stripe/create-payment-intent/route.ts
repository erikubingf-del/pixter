import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import stripe, { calculateFee, validateAmount, getCardPaymentOptions } from "@/lib/stripe/server";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export async function POST(request: Request) {
  try {
    const { amount, driverPhoneNumber } = await request.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }
    if (!driverPhoneNumber || typeof driverPhoneNumber !== "string") {
      return NextResponse.json({ error: "Identificação do motorista inválida." }, { status: 400 });
    }

    const amountInCents = Math.round(amount);

    const amountError = validateAmount(amountInCents);
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    const formattedPhone = `+${driverPhoneNumber.replace(/\D/g, "")}`;

    const { data: driverProfile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, stripe_account_id, stripe_account_charges_enabled")
      .eq("celular", formattedPhone)
      .eq("tipo", "motorista")
      .maybeSingle();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar motorista.");
    }

    if (!driverProfile || !driverProfile.stripe_account_id) {
      return NextResponse.json({ error: "Motorista não encontrado ou não habilitado para pagamentos." }, { status: 404 });
    }

    if (driverProfile.stripe_account_charges_enabled === false) {
      return NextResponse.json({ error: "Conta do motorista ainda não está ativa para receber pagamentos." }, { status: 400 });
    }

    const applicationFee = calculateFee(amountInCents);

    // Check if user is logged in and has a saved Stripe customer
    let customerId: string | undefined;
    let ephemeralKey: string | undefined;
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const { data: userProfile } = await supabaseServer
        .from("profiles")
        .select("stripe_customer_id, default_payment_method")
        .eq("id", session.user.id)
        .single();

      if (userProfile?.stripe_customer_id) {
        customerId = userProfile.stripe_customer_id;
        // Create ephemeral key for the customer so Stripe Elements can show saved cards
        try {
          const ek = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: "2022-11-15" }
          );
          ephemeralKey = ek.secret;
        } catch {
          // Non-critical: proceed without saved cards
        }
      }
    }

    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: "brl",
      automatic_payment_methods: { enabled: true },
      transfer_data: { destination: driverProfile.stripe_account_id },
      application_fee_amount: applicationFee,
      payment_method_options: getCardPaymentOptions(amountInCents),
      metadata: {
        driverId: driverProfile.id,
        driverPhoneNumber: formattedPhone,
        payingPhoneNumber: driverPhoneNumber,
        applicationFee: applicationFee.toString(),
        ...(session?.user?.id ? { clienteId: session.user.id } : {}),
      },
      ...(customerId ? { customer: customerId } : {}),
    };

    const paymentIntent = await stripe.paymentIntents.create(piParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ...(ephemeralKey ? { ephemeralKeySecret: ephemeralKey } : {}),
      ...(customerId ? { customerId } : {}),
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Falha ao iniciar pagamento.");
  }
}
