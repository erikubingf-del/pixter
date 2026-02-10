import { NextResponse } from "next/server";
import stripe from "@/lib/stripe/server";
import { requireAuth } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.id;
    const userEmail = session.email;

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }
    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao buscar perfil.");
    }

    let stripeAccountId = profile?.stripe_account_id;

    if (!stripeAccountId) {
      if (!userEmail) {
        return NextResponse.json({ error: "Email do usuário não encontrado." }, { status: 400 });
      }

      // Double-click protection: re-check before creating
      const { data: recheck } = await supabaseServer
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", userId)
        .single();

      if (recheck?.stripe_account_id) {
        stripeAccountId = recheck.stripe_account_id;
      } else {
        const account = await stripe.accounts.create({
          type: "express",
          email: userEmail,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: { supabaseUserId: userId },
        });
        stripeAccountId = account.id;

        const { error: updateError } = await supabaseServer
          .from("profiles")
          .update({ stripe_account_id: stripeAccountId })
          .eq("id", userId);

        if (updateError) {
          return safeErrorResponse(updateError, "Falha ao salvar informações do Stripe.");
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pixter-mu.vercel.app";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/motorista/stripe-refresh`,
      return_url: `${appUrl}/motorista/stripe-success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro ao conectar com Stripe.");
  }
}
