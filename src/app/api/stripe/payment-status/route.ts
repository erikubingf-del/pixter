import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import stripe from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    const userId = session?.id;

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'ID da sessão Stripe não fornecido' }, { status: 400 });
    }

    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ error: 'Sessão de pagamento não encontrada' }, { status: 404 });
      }
      return safeErrorResponse(stripeError, 'Erro ao buscar sessão no Stripe');
    }

    const paymentStatus = stripeSession.status;
    const paymentIntent = stripeSession.payment_intent as any;
    const paymentIntentStatus = paymentIntent?.status;
    const paymentIntentId = typeof stripeSession.payment_intent === 'string' ? stripeSession.payment_intent : paymentIntent?.id;

    const { data: paymentRecord, error: dbError } = await supabaseServer
      .from('pagamentos')
      .select('status, cliente_id')
      .eq('id', sessionId)
      .single();

    if (dbError) {
      console.error('Error fetching payment record from DB:', dbError);
    }

    if (userId && paymentRecord && paymentRecord.cliente_id !== userId) {
      return NextResponse.json({ error: 'Acesso negado a este registro de pagamento' }, { status: 403 });
    }

    let definitiveStatus = 'pending';
    if (paymentStatus === 'complete' && paymentIntentStatus === 'succeeded') {
      definitiveStatus = 'succeeded';
    } else if (paymentStatus === 'expired') {
      definitiveStatus = 'failed';
    } else if (paymentIntentStatus === 'requires_payment_method' || paymentIntentStatus === 'canceled') {
      definitiveStatus = 'failed';
    }

    if (paymentRecord && paymentRecord.status !== definitiveStatus) {
      await supabaseServer
        .from('pagamentos')
        .update({
          status: definitiveStatus,
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    return NextResponse.json({
      paymentStatus: definitiveStatus,
      stripeCheckoutStatus: paymentStatus,
      stripePaymentIntentStatus: paymentIntentStatus,
      paymentIntentId,
      amountTotal: stripeSession.amount_total ? stripeSession.amount_total / 100 : null,
      metadata: stripeSession.metadata,
    });
  } catch (error: any) {
    return safeErrorResponse(error, 'Erro interno ao verificar status do pagamento');
  }
}
