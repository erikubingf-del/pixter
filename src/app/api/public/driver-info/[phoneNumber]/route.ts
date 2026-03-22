import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export async function GET(
  request: Request,
  { params }: { params: { phoneNumber: string } }
) {
  try {
    const raw = params.phoneNumber;
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Número de telefone inválido." }, { status: 400 });
    }

    const digits = raw.replace(/\D/g, "");
    const e164 = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;

    const { data: prof, error } = await supabaseServer
      .from("profiles")
      .select("id, nome, profissao, avatar_url, stripe_account_id, stripe_account_charges_enabled, stripe_account_payouts_enabled, pix_key, company_name, city, tipo")
      .eq("celular", e164)
      .eq("tipo", "motorista")
      .maybeSingle();

    if (error) {
      return safeErrorResponse(error, "Erro ao buscar informações do motorista.");
    }
    if (!prof) {
      return NextResponse.json({ error: "Motorista não encontrado." }, { status: 404 });
    }

    const stripeReady = Boolean(
      prof.stripe_account_id &&
        prof.stripe_account_charges_enabled &&
        prof.stripe_account_payouts_enabled
    );
    const hasPixKey = !!prof.pix_key;

    if (!hasPixKey) {
      return NextResponse.json(
        { error: "Motorista ainda não está pronto para receber pagamentos." },
        { status: 404 }
      );
    }

    // Return public fields - pix_key is intentionally public (like a bank account for receiving)
    // Never expose cpf or stripe_account_id
    const profile = {
      id: prof.id,
      nome: prof.nome,
      profissao: prof.profissao,
      avatar_url: prof.avatar_url,
      company_name: prof.company_name,
      city: prof.city,
      celular: e164,
      has_stripe: stripeReady,
      has_pix: hasPixKey,
      pix_key: prof.pix_key || undefined,
    };

    return NextResponse.json({ profile });
  } catch (err: any) {
    return safeErrorResponse(err, "Erro interno do servidor.");
  }
}
