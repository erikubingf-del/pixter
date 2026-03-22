import { NextResponse } from "next/server";
import { requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";
import { isDriverOnboardingComplete } from '@/lib/auth/driver-profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("onboarding_completed, nome, cpf, data_nascimento, celular, stripe_account_id, stripe_account_charges_enabled, stripe_account_payouts_enabled")
      .eq("id", session.id)
      .single();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao verificar perfil");
    }

    const needsOnboarding = !isDriverOnboardingComplete(profile);

    const needsStripeOnboarding =
      !profile.stripe_account_id ||
      !profile.stripe_account_charges_enabled ||
      !profile.stripe_account_payouts_enabled;

    return NextResponse.json({ needsOnboarding, needsStripeOnboarding, profile });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno");
  }
}
