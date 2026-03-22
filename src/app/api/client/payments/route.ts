import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await requireCliente();
    const userId = session.id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    let query = supabaseServer
      .from('pagamentos')
      .select(`
        id, created_at, valor, metodo, receipt_number, receipt_pdf_url, receipt_url, status,
        categoria, client_tags, descricao,
        motorista:profiles!motorista_id ( nome )
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateObj.toISOString());
    }

    const { data: payments, error } = await query;

    if (error) {
      return safeErrorResponse(error, 'Erro ao buscar histórico de pagamentos');
    }

    const normalizedPayments = (payments || []).map((payment: any) => ({
      ...payment,
      motorista: Array.isArray(payment.motorista) ? payment.motorista[0] || null : payment.motorista
    }));

    let filteredPayments = normalizedPayments;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter((p: any) => {
        const motoristaNome = Array.isArray(p.motorista) ? p.motorista[0]?.nome : p.motorista?.nome;
        return motoristaNome?.toLowerCase().includes(searchLower);
      });
    }
    if (tag && tag.trim()) {
      filteredPayments = filteredPayments.filter((p: any) => {
        const tags: string[] = Array.isArray(p.client_tags) ? p.client_tags : [];
        return tags.includes(tag.trim());
      });
    }

    return NextResponse.json({ payments: filteredPayments, total: filteredPayments.length });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno no servidor');
  }
}
