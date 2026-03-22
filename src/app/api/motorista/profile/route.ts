import { NextResponse } from "next/server";
import { hasDriverCapability, requireMotorista } from "@/lib/auth/get-session";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";
import { validatePixKey } from "@/lib/pix/generator";

export const dynamic = 'force-dynamic';

const VALID_AVATAR_PATHS = Array.from({ length: 9 }, (_, i) => `/images/avatars/avatar_${i + 1}.png`);

export async function GET() {
  try {
    const session = await requireMotorista();
    const userId = session.id;

    const { data: profile, error } = await supabaseServer
      .from("profiles")
      .select("id, nome, email, celular, tipo, profissao, stripe_account_id, stripe_account_status, stripe_account_charges_enabled, stripe_account_payouts_enabled, avatar_url, pix_key")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Check by phone or email
        let existingProfile = null;

        if (session.email) {
          const { data: emailProfile } = await supabaseServer
            .from("profiles")
            .select("*")
            .eq("email", session.email)
            .maybeSingle();
          if (emailProfile) existingProfile = emailProfile;
        }

        if (!existingProfile && session.phone) {
          const phoneWithPlus = session.phone.startsWith("+") ? session.phone : `+${session.phone}`;
          const phoneWithoutPlus = session.phone.startsWith("+") ? session.phone.substring(1) : session.phone;

          const { data: phoneProfile } = await supabaseServer
            .from("profiles")
            .select("*")
            .in("celular", [phoneWithPlus, phoneWithoutPlus])
            .maybeSingle();
          if (phoneProfile) existingProfile = phoneProfile;
        }

        if (existingProfile) {
          return NextResponse.json(existingProfile);
        }

        // Create new profile
        const { data: newProfile, error: createError } = await supabaseServer
          .from("profiles")
          .insert({
            id: userId,
            tipo: "motorista",
            nome: session.name || "Motorista",
            email: session.email,
            celular: session.phone || '',
            stripe_account_status: "unconnected"
          })
          .select()
          .single();

        if (createError) {
          return safeErrorResponse(createError, "Erro ao criar perfil do motorista");
        }

        return NextResponse.json(newProfile);
      }

      return safeErrorResponse(error, "Erro ao buscar perfil do motorista");
    }

    const canUseDriverView = await hasDriverCapability(userId);
    const stripeReady = Boolean(
      profile.stripe_account_id &&
        profile.stripe_account_charges_enabled &&
        profile.stripe_account_payouts_enabled
    );

    return NextResponse.json({
      ...profile,
      can_use_driver_view: canUseDriverView,
      stripe_ready: stripeReady,
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireMotorista();
    const userId = session.id;

    let updates: { [key: string]: any };
    try {
      updates = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const allowedUpdates: { [key: string]: any } = {};

    if (updates.hasOwnProperty("nome")) {
      allowedUpdates.nome = updates.nome;
    }
    if (updates.hasOwnProperty("profissao")) {
      allowedUpdates.profissao = updates.profissao;
    }
    if (updates.hasOwnProperty("avatar_url")) {
      if (updates.avatar_url === null || VALID_AVATAR_PATHS.includes(updates.avatar_url)) {
        allowedUpdates.avatar_url = updates.avatar_url;
      } else if (typeof updates.avatar_url === 'string' && updates.avatar_url.startsWith('http')) {
        // Accept Supabase storage URLs (uploaded avatars)
        allowedUpdates.avatar_url = updates.avatar_url;
      } else {
        return NextResponse.json({ error: "URL de avatar inválida." }, { status: 400 });
      }
    }
    if (updates.hasOwnProperty("pix_key")) {
      if (updates.pix_key === null || updates.pix_key === '') {
        allowedUpdates.pix_key = null;
      } else if (typeof updates.pix_key === 'string' && validatePixKey(updates.pix_key.trim())) {
        allowedUpdates.pix_key = updates.pix_key.trim();
      } else {
        return NextResponse.json({ error: "Chave Pix inválida. Verifique o formato e tente novamente." }, { status: 400 });
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização fornecido." }, { status: 400 });
    }

    allowedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from("profiles")
      .update(allowedUpdates)
      .eq("id", userId)
      .select("id, nome, email, celular, tipo, profissao, stripe_account_id, stripe_account_status, stripe_account_charges_enabled, stripe_account_payouts_enabled, avatar_url, pix_key")
      .single();

    if (error) {
      return safeErrorResponse(error, "Erro ao atualizar perfil do motorista");
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      profile: {
        ...data,
        can_use_driver_view: await hasDriverCapability(userId),
        stripe_ready: Boolean(
          data.stripe_account_id &&
            data.stripe_account_charges_enabled &&
            data.stripe_account_payouts_enabled
        ),
      },
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, "Erro interno");
  }
}
