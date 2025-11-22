// src/app/api/auth/send-verification/route.ts (Updated for Supabase Built-in OTP & Auth Helpers)
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatPhoneNumber } from "@/lib/supabase/client"; // Keep formatPhoneNumber helper

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const body = await request.json();
    const { phone, countryCode = "55" } = body;

    // 1. Validation
    if (!phone) {
      return NextResponse.json(
        { error: "Número de telefone é obrigatório" },
        { status: 400 }
      );
    }

    // 2. Format Phone Number
    const formattedPhone = formatPhoneNumber(phone, countryCode);

    // 3. Extract Client IP Address
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 4. Check Rate Limits (Phone-based)
    const { data: phoneAllowed, error: phoneCheckError } = await supabase.rpc(
      'check_sms_rate_limit_phone',
      {
        p_phone: formattedPhone,
        p_max_attempts: 3,
        p_window_minutes: 60
      }
    );

    if (phoneCheckError) {
      console.error('Error checking phone rate limit:', phoneCheckError);
    } else if (!phoneAllowed) {
      return NextResponse.json(
        {
          error: 'Muitas solicitações para este número',
          details: 'Você atingiu o limite de 3 códigos por hora para este número. Tente novamente mais tarde.'
        },
        { status: 429 }
      );
    }

    // 5. Check Rate Limits (IP-based)
    const { data: ipAllowed, error: ipCheckError } = await supabase.rpc(
      'check_sms_rate_limit_ip',
      {
        p_ip_address: clientIP,
        p_max_attempts: 10,
        p_window_minutes: 60
      }
    );

    if (ipCheckError) {
      console.error('Error checking IP rate limit:', ipCheckError);
    } else if (!ipAllowed) {
      return NextResponse.json(
        {
          error: 'Muitas solicitações deste dispositivo',
          details: 'Você atingiu o limite de 10 códigos por hora. Tente novamente mais tarde.'
        },
        { status: 429 }
      );
    }

    // 6. Use Supabase Auth to send OTP via Route Handler Client
    // This tells Supabase to handle code generation and sending via its configured provider (e.g., Twilio)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,

      // options: { shouldCreateUser: false } // Optional: prevent creating new users via OTP if they don't exist
    });
    console.log("response from Supabase SignWithOTP:", data);
    
    if (error) {
      console.error("Supabase signInWithOtp error:", error.message);
      // Provide a more generic error to the client
      return NextResponse.json(
        { error: "Falha ao enviar o código de verificação." },
        { status: 500 }
      );
    }

    // IMPORTANT: Supabase handles the code generation and sending.
    // You NO LONGER need to generate a code manually or store it in `verification_codes`.
    console.log("Supabase OTP initiated for:", formattedPhone);

    // 7. Record SMS Send for Rate Limiting
    const { error: recordError } = await supabase.rpc('record_sms_send', {
      p_phone: formattedPhone,
      p_ip_address: clientIP
    });

    if (recordError) {
      console.error('Error recording SMS send:', recordError);
      // Don't fail the request - SMS was sent successfully
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso! Verifique seu WhatsApp/SMS.",
    });
  } catch (error: any) {
    console.error("Erro geral em send-verification:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
