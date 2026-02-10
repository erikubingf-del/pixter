import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

/**
 * POST /api/auth/signup-client
 * Creates a new client user via Supabase Auth and sets up their profile.
 * This is a public route (user is signing up, not yet authenticated).
 *
 * After signup, the user must verify their email, then log in via NextAuth.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, celular, cpf } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${appUrl}/auth/callback`;

    // Create user via Supabase Admin (service role)
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User must verify email
      user_metadata: {
        nome: name,
        tipo: 'cliente',
        celular: celular || null,
        cpf: cpf || null,
      },
    });

    if (authError) {
      // Handle duplicate user
      if (authError.message.includes('already') || authError.message.includes('duplicate')) {
        // Try to resend confirmation email
        const { error: resendError } = await supabaseServer.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectTo },
        });

        if (resendError) {
          return NextResponse.json(
            { error: 'Usuário já registrado. Tente fazer login ou verifique sua caixa de email.' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Este email já está registrado. Um novo email de confirmação foi enviado.',
        });
      }

      console.error('Signup error:', authError.message);
      return NextResponse.json(
        { error: 'Erro ao criar usuário. Verifique os dados fornecidos.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Falha inesperada ao iniciar o cadastro.' },
        { status: 500 }
      );
    }

    // Ensure profile exists with correct data
    const { error: profileError } = await supabaseServer
      .from('profiles')
      .upsert({
        id: authData.user.id,
        nome: name,
        email,
        tipo: 'cliente',
        celular: celular || null,
        cpf: cpf || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
      // Don't fail the signup, the trigger should handle basic profile creation
    }

    // Send confirmation email
    await supabaseServer.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });

    return NextResponse.json({
      success: true,
      message: 'Cadastro iniciado! Verifique seu email para confirmar sua conta.',
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      );
    }
    return safeErrorResponse(error, 'Erro ao criar usuário');
  }
}
