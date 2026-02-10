import { NextRequest, NextResponse } from 'next/server';
import { requireMotorista } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

/**
 * Poll for new payments since a given timestamp.
 * Used by the dashboard to show real-time payment notifications.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireMotorista();

    const since = request.nextUrl.searchParams.get('since');
    if (!since) {
      return NextResponse.json({ payments: [] });
    }

    const { data: payments, error } = await supabaseServer
      .from('pagamentos')
      .select('id, valor, metodo, created_at, status')
      .eq('motorista_id', session.id)
      .eq('status', 'succeeded')
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return safeErrorResponse(error, 'Erro ao buscar notificações');
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return safeErrorResponse(error, 'Erro ao buscar notificações');
  }
}
