import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireCliente();
    const { id } = params;

    const body = await request.json();
    const { categoria, client_tags } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (categoria !== undefined) updates.categoria = categoria;
    if (client_tags !== undefined) updates.client_tags = client_tags;

    const { data, error } = await supabaseServer
      .from('pagamentos')
      .update(updates)
      .eq('id', id)
      .eq('cliente_id', session.id)
      .select('id, categoria, client_tags')
      .single();

    if (error) return safeErrorResponse(error, 'Erro ao atualizar pagamento');
    if (!data) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });

    return NextResponse.json({ success: true, payment: data });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno');
  }
}
