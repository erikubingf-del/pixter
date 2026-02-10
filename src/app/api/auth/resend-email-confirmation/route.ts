import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/resend-email-confirmation
 * Resends the email confirmation. Public route.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${appUrl}/auth/callback`;

    // Resend confirmation email
    const { error } = await supabaseServer.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      if (error.message.includes('Email rate limit')) {
        return NextResponse.json(
          { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
          { status: 429 }
        );
      }

      if (error.message.includes('User not found') || error.message.includes('Invalid user')) {
        return NextResponse.json(
          { error: 'Email não encontrado. Por favor, crie uma conta.' },
          { status: 404 }
        );
      }

      console.error('Resend confirmation error:', error.message);
      return NextResponse.json(
        { error: 'Falha ao reenviar email de confirmação' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada e pasta de spam.',
    });
  } catch (error) {
    return safeErrorResponse(error, 'Erro ao reenviar confirmação');
  }
}
