import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/get-session";
import { supabaseServer, formatPhoneNumber } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.id;

    const formData = await req.formData();

    const phone = formData.get("phone") as string;
    const countryCode = formData.get("countryCode") as string;
    const nome = formData.get("nome") as string;
    const cpf = formData.get("cpf") as string;
    const profissao = formData.get("profissao") as string;
    const dataNascimento = formData.get("dataNascimento") as string;
    const avatarIndex = formData.get("avatarIndex") as string;
    const email = formData.get("email") as string | null;
    const selfieFile = formData.get("selfie") as File | null;

    if (!phone || !nome || !cpf || !profissao || !dataNascimento || !avatarIndex) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    let selfieUrl: string | null = null;
    let avatarUrl: string | null = null;

    if (selfieFile) {
      const selfiePath = `public/selfies/${userId}/${selfieFile.name || "selfie.jpg"}`;
      const { error: uploadError } = await supabaseServer.storage
        .from("selfies")
        .upload(selfiePath, selfieFile, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabaseServer.storage.from("selfies").getPublicUrl(selfiePath);
        selfieUrl = urlData?.publicUrl;
      }
    }

    const index = Number(avatarIndex);
    if (!isNaN(index) && index >= 0 && index < 9) {
      avatarUrl = `/images/avatars/avatar_${index + 1}.png`;
    }

    const profilePayload: any = {
      id: userId,
      celular: formattedPhone,
      tipo: 'motorista',
      nome,
      cpf,
      profissao,
      data_nascimento: dataNascimento,
      verified: true,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (email && email.trim() !== "") profilePayload.email = email.trim();
    if (selfieUrl) profilePayload.selfie_url = selfieUrl;
    if (avatarUrl) profilePayload.avatar_url = avatarUrl;

    const { error: profileError } = await supabaseServer
      .from("profiles")
      .upsert(profilePayload);

    if (profileError) {
      return safeErrorResponse(profileError, "Erro ao salvar perfil do motorista.");
    }

    const { data: stripeCheck } = await supabaseServer
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    const needsStripeOnboarding = !stripeCheck?.stripe_account_id;

    return NextResponse.json({
      userId,
      needsStripeOnboarding,
      redirectTo: needsStripeOnboarding ? '/motorista/stripe-onboarding' : '/motorista/dashboard'
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno do servidor.");
  }
}
