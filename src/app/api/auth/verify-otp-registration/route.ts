import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";
import { formatPhoneNumber } from "@/lib/supabase/client";
import { safeErrorResponse } from "@/lib/utils/api-error";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Dados inválidos enviados" }, { status: 400 });
    }

    const { phone, code, countryCode = "55" } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: "Número de telefone e código são obrigatórios" }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    const { data, error } = await supabaseServer.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: "sms",
    });

    if (error) {
      let errorMessage = "Código inválido ou expirado";
      if (error.message.includes("expired")) {
        errorMessage = "Código expirado. Por favor, solicite um novo.";
      }
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: "Falha ao verificar o código. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
      userId: data.user.id,
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Erro interno no servidor");
  }
}
