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

    const { phone, countryCode = "55" } = body;

    if (!phone) {
      return NextResponse.json({ error: "Número de telefone é obrigatório" }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Check rate limits using service role
    const { data: phoneAllowed, error: phoneCheckError } = await supabaseServer.rpc(
      'check_sms_rate_limit_phone',
      { p_phone: formattedPhone, p_max_attempts: 10, p_window_minutes: 60 }
    );

    if (!phoneCheckError && !phoneAllowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações para este número. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    const { data: ipAllowed, error: ipCheckError } = await supabaseServer.rpc(
      'check_sms_rate_limit_ip',
      { p_ip_address: clientIP, p_max_attempts: 10, p_window_minutes: 60 }
    );

    if (!ipCheckError && !ipAllowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações deste dispositivo. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    // Use Supabase Auth to send OTP
    const { error } = await supabaseServer.auth.signInWithOtp({ phone: formattedPhone });

    if (error) {
      console.error("Supabase signInWithOtp error:", error.message);
      return NextResponse.json({ error: "Falha ao enviar o código de verificação." }, { status: 500 });
    }

    // Record SMS send for rate limiting
    await supabaseServer.rpc('record_sms_send', {
      p_phone: formattedPhone,
      p_ip_address: clientIP
    });

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso! Verifique seu WhatsApp/SMS.",
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Erro interno no servidor");
  }
}
