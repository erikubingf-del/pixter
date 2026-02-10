import { NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { safeErrorResponse } from "@/lib/utils/api-error";

export async function GET(
  request: Request,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = params;

    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ error: "ID do pagamento inválido" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({ status: paymentIntent.status });
  } catch (error: any) {
    return safeErrorResponse(error, "Falha ao verificar status do pagamento");
  }
}
