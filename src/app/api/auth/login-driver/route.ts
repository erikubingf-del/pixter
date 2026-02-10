import { NextResponse } from 'next/server';
import { formatPhoneNumber, supabaseAdmin } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

/**
 * POST /api/auth/login-driver
 * Sends OTP to driver's phone via Supabase Auth.
 * The actual session is created via NextAuth's phone-otp credentials provider
 * after the OTP is verified on the client side.
 *
 * This route is public (no auth required) since the driver is logging in.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, countryCode = '55' } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    // Verify this phone belongs to a motorista before sending OTP
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tipo')
      .eq('celular', formattedPhone)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Nenhum motorista encontrado com este número.' },
        { status: 404 }
      );
    }

    if (profileData.tipo?.toLowerCase() !== 'motorista') {
      return NextResponse.json(
        { error: 'Este número não pertence a um motorista.' },
        { status: 403 }
      );
    }

    // Send OTP via Supabase Auth
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (otpError) {
      console.error('Supabase OTP send error:', otpError.message);
      return NextResponse.json(
        { error: 'Falha ao enviar código de verificação. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificação enviado!',
    });
  } catch (error) {
    return safeErrorResponse(error, 'Erro ao processar login do motorista');
  }
}
