import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe/server';
import { requireMotorista } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function POST() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe customer não encontrado' }, { status: 404 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/dashboard`
    });

    return NextResponse.json({ url: portal.url });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro ao criar portal de pagamentos');
  }
}
