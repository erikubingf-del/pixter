// src/app/api/auth/verify-otp-registration/route.ts
// Verifies OTP for new driver registration (before profile exists)
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatPhoneNumber } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log("=== verify-otp-registration route called ===");
  try {
    console.log("1. Getting cookies...");
    const cookieStore = await cookies();
    console.log("2. Creating Supabase client...");
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    console.log("3. Parsing request body...");
    let body;
    try {
      body = await request.json();
      console.log("4. Body parsed successfully:", { phone: body.phone, countryCode: body.countryCode });
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Dados inválidos enviados" },
        { status: 400 }
      );
    }

    const { phone, code, countryCode = "55" } = body;

    // Validation
    console.log("5. Validating input...");
    if (!phone || !code) {
      console.log("Validation failed - missing phone or code");
      return NextResponse.json(
        { error: "Número de telefone e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Format Phone Number
    console.log("6. Formatting phone number...");
    const formattedPhone = formatPhoneNumber(phone, countryCode);
    console.log("7. Formatted phone:", formattedPhone);

    // Verify OTP using Supabase Auth
    console.log("8. Verifying OTP with Supabase...");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: "sms",
    });

    if (error) {
      console.error("Supabase verifyOtp error:", error.message);
      let errorMessage = "Código inválido ou expirado";
      if (error.message.includes("expired")) {
        errorMessage = "Código expirado. Por favor, solicite um novo.";
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    // Check if session and user are returned
    if (!data.session || !data.user) {
      console.error("Supabase verifyOtp succeeded but did not return session/user.");
      return NextResponse.json(
        { error: "Falha ao verificar o código. Tente novamente." },
        { status: 500 }
      );
    }

    console.log("9. OTP verified successfully for user:", data.user.id);

    // For registration, we just verify the OTP and create a session
    // The user profile will be created later in the complete-registration endpoint
    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
      userId: data.user.id,
    });

  } catch (error: any) {
    console.error("Erro geral em verify-otp-registration:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
