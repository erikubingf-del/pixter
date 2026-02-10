import { NextRequest, NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import stripe from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function POST(request: NextRequest) {
  try {
    const session = await requireCliente();
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token do cartão é obrigatório' }, { status: 400 });
    }

    // Get or create Stripe customer
    let { data: profile } = await supabaseServer
      .from('profiles')
      .select('stripe_customer_id, email, nome')
      .eq('id', session.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        name: profile?.nome || session.name || undefined,
        metadata: { supabaseUserId: session.id },
      });
      customerId = customer.id;

      await supabaseServer
        .from('profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', session.id);
    }

    // Create payment method from token and attach to customer
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });

    // Set as default if it's the first card
    const existing = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (existing.data.length === 1) {
      await supabaseServer
        .from('profiles')
        .update({ default_payment_method: paymentMethod.id, updated_at: new Date().toISOString() })
        .eq('id', session.id);
    }

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return safeErrorResponse(error, 'Erro ao adicionar cartão');
  }
}

export async function GET() {
  try {
    const session = await requireCliente();

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('stripe_customer_id, default_payment_method')
      .eq('id', session.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
      }
      return safeErrorResponse(profileError, 'Erro ao buscar perfil do usuário');
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const customerId = profile.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const formattedPaymentMethods = paymentMethods.data.map(method => ({
      id: method.id,
      card_brand: method.card?.brand,
      last4: method.card?.last4,
      exp_month: method.card?.exp_month,
      exp_year: method.card?.exp_year,
      is_default: method.id === profile.default_payment_method,
    }));

    return NextResponse.json({ paymentMethods: formattedPaymentMethods });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno no servidor ao buscar métodos de pagamento');
  }
}
