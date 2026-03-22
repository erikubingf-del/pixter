import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import {
  getDisconnectedStripeSummary,
  resetStripeConnectState,
  summarizeStoredStripeAccount,
  syncStripeAccountState,
} from '@/lib/stripe/connect';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select(
        'id, tipo, stripe_account_id, stripe_account_status, stripe_account_charges_enabled, stripe_account_payouts_enabled, stripe_account_details_submitted'
      )
      .eq('id', session.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.tipo !== 'motorista' || !profile.stripe_account_id) {
      return NextResponse.json(getDisconnectedStripeSummary());
    }

    try {
      const { summary } = await syncStripeAccountState(profile.id, profile.stripe_account_id);
      return NextResponse.json(summary);
    } catch (stripeError: any) {
      if (stripeError.code === 'account_invalid') {
        await resetStripeConnectState(profile.id);
        return NextResponse.json(getDisconnectedStripeSummary());
      }

      console.error('Failed to fetch live Stripe status:', stripeError);
      return NextResponse.json(summarizeStoredStripeAccount(profile));
    }
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Internal server error');
  }
}
