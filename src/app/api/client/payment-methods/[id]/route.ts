import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import stripe from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireCliente();
    const paymentMethodId = params.id;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'ID do método de pagamento é obrigatório' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const customerId = profile.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json({ error: 'Cliente Stripe não encontrado para este usuário' }, { status: 404 });
    }

    let paymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (retrieveError: any) {
      if (retrieveError.code === 'resource_missing') {
        return NextResponse.json({ error: 'Método de pagamento não encontrado no Stripe' }, { status: 404 });
      }
      return safeErrorResponse(retrieveError, 'Erro ao buscar método de pagamento');
    }

    if (paymentMethod.customer !== customerId) {
      return NextResponse.json({ error: 'Método de pagamento não pertence a este cliente' }, { status: 403 });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    const { data: currentProfile } = await supabaseServer
      .from('profiles')
      .select('default_payment_method')
      .eq('id', session.id)
      .single();

    if (currentProfile?.default_payment_method === paymentMethodId) {
      await supabaseServer
        .from('profiles')
        .update({ default_payment_method: null })
        .eq('id', session.id);
    }

    return NextResponse.json({ success: true, message: 'Método de pagamento removido com sucesso' });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno no servidor ao remover método de pagamento');
  }
}
