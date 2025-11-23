// src/app/api/motorista/check-onboarding/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Check profile onboarding status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed, nome, cpf, data_nascimento")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Erro ao verificar perfil" },
        { status: 500 }
      );
    }

    // Consider onboarding incomplete if:
    // 1. onboarding_completed flag is false
    // 2. OR essential fields are missing (nome is still phone number, no CPF, no birth date)
    const needsOnboarding =
      profile.onboarding_completed === false ||
      !profile.cpf ||
      !profile.data_nascimento ||
      profile.nome?.startsWith('+'); // Nome is still phone number

    return NextResponse.json({
      needsOnboarding,
      profile
    });

  } catch (error: any) {
    console.error("Error in check-onboarding:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
