import { NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { requireAuth } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await requireAuth();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", session.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    if (profile.stripe_account_id) {
      const accountLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/stripe-onboarding`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/dashboard`,
        type: 'account_onboarding',
      });

      return NextResponse.json({ url: accountLink.url, accountId: profile.stripe_account_id });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email: profile.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: profile.nome?.split(' ')[0] || undefined,
        last_name: profile.nome?.split(' ').slice(1).join(' ') || undefined,
        email: profile.email || undefined,
        phone: profile.celular || undefined,
      },
      metadata: {
        supabaseUserId: session.id,
        user_type: 'motorista',
      },
    });

    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update({ stripe_account_id: account.id, updated_at: new Date().toISOString() })
      .eq("id", session.id);

    if (updateError) {
      console.error("Error updating profile with Stripe account:", updateError);
    }

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/stripe-onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url, accountId: account.id });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao criar conta Stripe");
  }
}
