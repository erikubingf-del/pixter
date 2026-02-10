import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/get-session";
import stripe from "@/lib/stripe/server";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const stripeCustomerId = (session as any)?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "Usuário não possui conta de cliente Stripe." }, { status: 404 });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    const formattedPaymentMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
    }));

    return NextResponse.json(formattedPaymentMethods);
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Falha ao buscar métodos de pagamento.");
  }
}
