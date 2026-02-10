import { NextResponse } from "next/server";
import { requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireMotorista();

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("onboarding_completed, nome, cpf, data_nascimento, celular")
      .eq("id", session.id)
      .single();

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao verificar perfil");
    }

    const needsOnboarding =
      profile.onboarding_completed === false ||
      !profile.cpf ||
      !profile.data_nascimento ||
      !profile.nome;

    return NextResponse.json({ needsOnboarding, profile });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno");
  }
}
