import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import stripe from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();

    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, tipo, stripe_account_id')
      .eq('id', session.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.tipo !== 'motorista' || !profile.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      });
    }

    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);

      return NextResponse.json({
        connected: true,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || []
        }
      });
    } catch (stripeError: any) {
      if (stripeError.code === 'account_invalid') {
        return NextResponse.json({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false
        });
      }
      return safeErrorResponse(stripeError, 'Failed to fetch Stripe status');
    }
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Internal server error');
  }
}
