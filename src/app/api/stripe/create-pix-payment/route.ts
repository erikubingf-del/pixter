import { NextResponse } from "next/server";
import stripe, { calculateFee, validateAmount } from "@/lib/stripe/server";
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

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, stripe_account_id, stripe_account_charges_enabled, stripe_account_payouts_enabled")
      .eq("celular", formattedPhone)
      .eq("tipo", "motorista")
      .maybeSingle();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar motorista.");
    }

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: "Motorista não encontrado ou não habilitado para pagamentos." }, { status: 404 });
    }

    const stripeReady = Boolean(
      profile.stripe_account_charges_enabled &&
        profile.stripe_account_payouts_enabled
    );

    if (!stripeReady) {
      return NextResponse.json(
        { error: "Conta do motorista ainda não está totalmente verificada para receber pagamentos." },
        { status: 400 }
      );
    }

    const applicationFee = calculateFee(amountInCents);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      payment_method_types: ["pix"],
      payment_method_options: { pix: { expires_after_seconds: 600 } },
      transfer_data: { destination: profile.stripe_account_id },
      application_fee_amount: applicationFee,
      metadata: {
        driverId: profile.id,
        driverPhoneNumber: formattedPhone,
        payingPhoneNumber: driverPhoneNumber,
        applicationFee: applicationFee.toString(),
        paymentMethod: 'pix',
      },
    });

    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: { type: 'pix' },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pagamento/sucesso`,
    });

    const pixCode = confirmedPaymentIntent.next_action?.pix_display_qr_code?.data;
    if (!pixCode) {
      return NextResponse.json({ error: 'Falha ao gerar código Pix' }, { status: 500 });
    }

    return NextResponse.json({
      paymentIntentId: confirmedPaymentIntent.id,
      pixCode,
      clientSecret: confirmedPaymentIntent.client_secret,
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Falha ao criar pagamento Pix.");
  }
}
