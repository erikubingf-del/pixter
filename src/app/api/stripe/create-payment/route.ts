import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import stripe, { calculateFee, validateAmount } from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

const MIN_AMOUNT_BRL = 2.00;

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.id;

    let driverId: string, amount: number, tipAmount: number | undefined;
    try {
      const body = await request.json();
      driverId = body.driverId;
      amount = parseFloat(body.amount);
      tipAmount = body.tipAmount ? parseFloat(body.tipAmount) : 0;
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
    }

    if (!driverId || isNaN(amount) || amount < MIN_AMOUNT_BRL || (tipAmount !== undefined && (isNaN(tipAmount) || tipAmount < 0))) {
      return NextResponse.json(
        { error: `Dados inválidos. Certifique-se que o valor é pelo menos R$${MIN_AMOUNT_BRL.toFixed(2)}.` },
        { status: 400 }
      );
    }

    const { data: driverProfile, error: driverError } = await supabaseServer
      .from('profiles')
      .select('nome, stripe_account_id')
      .eq('id', driverId)
      .eq('tipo', 'motorista')
      .single();

    if (driverError || !driverProfile) {
      return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 404 });
    }

    if (!driverProfile.stripe_account_id) {
      return NextResponse.json({ error: 'Motorista não está habilitado para receber pagamentos online.' }, { status: 400 });
    }

    const baseAmountCents = Math.round(amount * 100);
    const tipAmountCents = Math.round((tipAmount || 0) * 100);
    const totalAmountCents = baseAmountCents + tipAmountCents;
    const applicationFeeCents = calculateFee(baseAmountCents);

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Pagamento para Motorista',
            description: `Pixter - ${driverProfile.nome || 'Motorista'}`,
          },
          unit_amount: totalAmountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagamento/cancelado?driver_id=${driverId}`,
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: { destination: driverProfile.stripe_account_id },
        metadata: {
          pixter_driver_id: driverId,
          pixter_user_id: userId,
          pixter_base_amount_cents: baseAmountCents.toString(),
          pixter_tip_amount_cents: tipAmountCents.toString(),
          pixter_total_amount_cents: totalAmountCents.toString(),
          pixter_fee_amount_cents: applicationFeeCents.toString(),
        },
      },
      metadata: { pixter_driver_id: driverId, pixter_user_id: userId },
    });

    if (!checkoutSession.url) {
      throw new Error('Falha ao criar URL de checkout do Stripe.');
    }

    const { error: insertError } = await supabaseServer
      .from('pagamentos')
      .insert({
        id: checkoutSession.id,
        motorista_id: driverId,
        cliente_id: userId,
        valor: baseAmountCents,
        moeda: 'brl',
        status: 'pending',
        stripe_payment_intent_id: typeof checkoutSession.payment_intent === 'string' ? checkoutSession.payment_intent : null,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Database insert error after Stripe session creation:', insertError);
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno ao processar pagamento.');
  }
}
