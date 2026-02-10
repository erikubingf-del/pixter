import { NextResponse } from "next/server";
import { requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import stripe from "@/lib/stripe/server";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: pErr } = await supabaseServer
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", session.id)
      .single();

    if (pErr || !profile?.stripe_account_id) {
      return NextResponse.json({ error: "Conta Stripe não encontrada no perfil" }, { status: 404 });
    }

    const stripeAccount = profile.stripe_account_id;
    const payments = await stripe.charges.list(
      { limit: 10, expand: ['data.balance_transaction'] },
      { stripeAccount }
    );

    const totalPaid = payments.data.reduce((sum, charge) => {
      if (charge.paid && charge.status === 'succeeded') return sum + charge.amount;
      return sum;
    }, 0);

    const formattedPayments = payments.data.map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency,
      status: charge.status,
      paid: charge.paid,
      created: new Date(charge.created * 1000).toISOString(),
      description: charge.description || 'Sem descrição',
      payment_method: charge.payment_method_details?.type || 'unknown',
      receipt_url: charge.receipt_url
    }));

    return NextResponse.json({
      total_paid: totalPaid,
      currency: payments.data[0]?.currency?.toUpperCase() || 'BRL',
      payments: formattedPayments,
      count: payments.data.length
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno ao buscar saldo");
  }
}
