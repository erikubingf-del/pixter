import { NextResponse } from "next/server";
import { requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import stripe from "@/lib/stripe/server";
import {
  createStripeOnboardingLink,
  getDisconnectedStripeSummary,
  resetStripeConnectState,
  syncStripeAccountState,
} from "@/lib/stripe/connect";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export { POST } from "../../stripe/connect-account/route";

export async function GET() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, stripe_account_id")
      .eq("id", session.id)
      .single();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar perfil");
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({
        ...getDisconnectedStripeSummary(),
        status: 'unconnected',
        accountLink: null,
        loginLink: null,
        requirements: null,
        details: {
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        },
      });
    }

    try {
      const { summary } = await syncStripeAccountState(profile.id, profile.stripe_account_id);

      let managementUrl: string | null = null;

      if (summary.ready) {
        try {
          const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
          managementUrl = loginLink.url;
        } catch {
          managementUrl = null;
        }
      } else {
        const accountLink = await createStripeOnboardingLink(profile.stripe_account_id);
        managementUrl = accountLink.url;
      }

      return NextResponse.json({
        ...summary,
        accountLink: managementUrl,
        loginLink: managementUrl,
        requirements: summary.requirements,
        details: {
          charges_enabled: summary.charges_enabled,
          payouts_enabled: summary.payouts_enabled,
          details_submitted: summary.details_submitted,
        },
      });
    } catch (error: any) {
      if (error?.code === "account_invalid") {
        await resetStripeConnectState(profile.id);
        return NextResponse.json({
          ...getDisconnectedStripeSummary(),
          status: 'unconnected',
          accountLink: null,
          loginLink: null,
          requirements: null,
          details: {
            charges_enabled: false,
            payouts_enabled: false,
            details_submitted: false,
          },
        });
      }

      throw error;
    }
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao acessar Stripe");
  }
}
