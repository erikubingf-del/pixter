import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function POST(request: Request) {
  try {
    const session = await requireCliente();

    let currentPassword: string, newPassword: string;
    try {
      const body = await request.json();
      currentPassword = body.currentPassword;
      newPassword = body.newPassword;
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    // Verify current password by signing in
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('email')
      .eq('id', session.id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseServer.auth.admin.updateUserById(session.id, {
      password: newPassword,
    });

    if (updateError) {
      return safeErrorResponse(updateError, 'Erro ao atualizar senha.');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno ao alterar senha.');
  }
}
