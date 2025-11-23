// src/app/api/stripe/create-account/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    // Check if user already has a Stripe account
    if (profile.stripe_account_id) {
      // Get account link for existing account
      const accountLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/stripe-onboarding`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/dashboard`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        url: accountLink.url,
        accountId: profile.stripe_account_id,
      });
    }

    // Create new Stripe Connect account
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
        user_id: user.id,
        user_type: 'motorista',
      },
    });

    // Save Stripe account ID to profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile with Stripe account:", updateError);
      // Continue anyway - we can retry later
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/stripe-onboarding`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/motorista/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });

  } catch (error: any) {
    console.error("Error creating Stripe account:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar conta Stripe" },
      { status: 500 }
    );
  }
}
