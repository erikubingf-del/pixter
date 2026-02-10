import { NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { requireAuth } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", session.id)
      .single();

    if (profileError || !profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: "Perfil ou conta Stripe não encontrada." }, { status: 404 });
    }

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
    return NextResponse.json({ url: loginLink.url });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao criar link de login Stripe");
  }
}
