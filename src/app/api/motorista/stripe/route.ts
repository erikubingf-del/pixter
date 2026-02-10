import { NextResponse } from "next/server";
import { requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import stripe from "@/lib/stripe/server";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", session.id)
      .single();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar perfil");
    }

    if (!profile.stripe_account_id) {
      return NextResponse.json({
        status: null,
        accountLink: null,
        loginLink: null,
        requirements: null,
      });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    let status: "pending" | "verified" | "restricted" | null = null;
    if (account.charges_enabled && account.payouts_enabled) {
      status = "verified";
    } else if (account.requirements?.disabled_reason) {
      status = "restricted";
    } else {
      status = "pending";
    }

    if (profile.stripe_account_status !== status) {
      await supabaseServer
        .from("profiles")
        .update({ stripe_account_status: status })
        .eq("id", session.id);
    }

    let loginLink = null;
    try {
      loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
    } catch {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixter-mu.vercel.app';
        const accountLink = await stripe.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: `${appUrl}/motorista/dashboard/dados`,
          return_url: `${appUrl}/motorista/dashboard/dados`,
          type: "account_onboarding",
        });
        loginLink = { url: accountLink.url };
      } catch (accountLinkError) {
        console.error("Error creating account link:", accountLinkError);
      }
    }

    return NextResponse.json({
      status,
      accountLink: loginLink?.url || null,
      requirements: account.requirements || null,
      details: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      }
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao acessar Stripe");
  }
}

export async function POST() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", session.id)
      .single();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar perfil");
    }

    if (profile.stripe_account_id) {
      return NextResponse.json({ error: "Conta Stripe já existe" }, { status: 400 });
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: profile.email || undefined,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        supabaseUserId: session.id,
      },
    });

    await supabaseServer
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        stripe_account_status: "pending"
      })
      .eq("id", session.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixter-mu.vercel.app';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/motorista/dashboard/dados`,
      return_url: `${appUrl}/motorista/dashboard/dados`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao criar conta Stripe");
  }
}
