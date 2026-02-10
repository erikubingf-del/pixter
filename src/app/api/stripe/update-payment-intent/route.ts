import { NextResponse } from "next/server";
import stripe, { calculateFee, validateAmount, getCardPaymentOptions } from "@/lib/stripe/server";
import { safeErrorResponse } from "@/lib/utils/api-error";

export async function POST(request: Request) {
  try {
    const { paymentIntentId, amount } = await request.json();

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json({ error: "ID do pagamento inválido." }, { status: 400 });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    const amountError = validateAmount(amount);
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    const applicationFee = calculateFee(amount);

    const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount,
      currency: "brl",
      application_fee_amount: applicationFee,
      payment_method_options: getCardPaymentOptions(amount),
    });

    return NextResponse.json({ clientSecret: updatedIntent.client_secret });
  } catch (error: any) {
    return safeErrorResponse(error, "Falha ao atualizar valor do pagamento.");
  }
}
