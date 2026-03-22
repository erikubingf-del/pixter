import { NextResponse } from 'next/server';
import { requireMotorista } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import {
  createStripeOnboardingLink,
  ensureStripeConnectAccount,
  getPendingStripeSummary,
  resetStripeConnectState,
  syncStripeAccountState,
} from '@/lib/stripe/connect';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

async function handleConnectAccount() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, email, nome, celular, stripe_account_id')
      .eq('id', session.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }
    if (profileError) {
      return safeErrorResponse(profileError, 'Erro ao buscar perfil.');
    }

    let stripeAccountId = profile.stripe_account_id;

    if (!stripeAccountId) {
      stripeAccountId = await ensureStripeConnectAccount(profile);
      const accountLink = await createStripeOnboardingLink(stripeAccountId);

      return NextResponse.json({
        ...getPendingStripeSummary(),
        url: accountLink.url,
        accountId: stripeAccountId,
      });
    }

    try {
      const { summary } = await syncStripeAccountState(profile.id, stripeAccountId);

      if (summary.ready) {
        return NextResponse.json({
          ...summary,
          url: null,
          accountId: stripeAccountId,
        });
      }

      const accountLink = await createStripeOnboardingLink(stripeAccountId);

      return NextResponse.json({
        ...summary,
        url: accountLink.url,
        accountId: stripeAccountId,
      });
    } catch (error: any) {
      if (error?.code === 'account_invalid') {
        await resetStripeConnectState(profile.id);

        stripeAccountId = await ensureStripeConnectAccount({
          ...profile,
          stripe_account_id: null,
        });

        const accountLink = await createStripeOnboardingLink(stripeAccountId);

        return NextResponse.json({
          ...getPendingStripeSummary(),
          url: accountLink.url,
          accountId: stripeAccountId,
        });
      }

      throw error;
    }
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro ao conectar com Stripe.');
  }
}

export async function GET() {
  return handleConnectAccount();
}

export async function POST() {
  return handleConnectAccount();
}
