import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { escapeHtml } from '@/lib/utils/html-escape';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const fmtMethod = (m: string) => {
  const map: Record<string, string> = {
    card: 'Cartão', pix: 'Pix', apple_pay: 'Apple Pay', google_pay: 'Google Pay',
  };
  return map[m] || m;
};

const fmtStatus = (s: string) => {
  const map: Record<string, string> = {
    succeeded: 'Aprovado', pending: 'Pendente', failed: 'Falhou', refunded: 'Reembolsado',
  };
  return map[s] || s;
};

export async function GET(request: Request) {
  try {
    const session = await requireCliente();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tag = searchParams.get('tag');

    let query = supabaseServer
      .from('pagamentos')
      .select(`id, created_at, valor, metodo, status, receipt_number, categoria, client_tags, descricao,
        motorista:profiles!motorista_id ( nome, profissao )`)
      .eq('cliente_id', session.id)
      .order('created_at', { ascending: false });

    if (ids.length > 0) query = query.in('id', ids);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data: payments, error } = await query;
    if (error) return safeErrorResponse(error, 'Erro ao buscar pagamentos');

    const filtered = (payments || []).filter((p: any) => {
      if (!tag) return true;
      const tags: string[] = Array.isArray(p.client_tags) ? p.client_tags : [];
      return tags.includes(tag);
    });

    const receiptPages = filtered.map((p: any) => {
      const driver = Array.isArray(p.motorista) ? p.motorista[0] : p.motorista;
      const driverName = escapeHtml(driver?.nome || 'Não especificado');
      const driverProf = escapeHtml(driver?.profissao || 'Prestador');
      const tags: string[] = Array.isArray(p.client_tags) ? p.client_tags : [];

      return `
        <div class="receipt">
          <div class="header">
            <div class="logo"><span style="color:#8B7DD8">Amo</span><span style="color:#81C995">Pagar</span></div>
            <p>Comprovante de Pagamento</p>
          </div>
          <div class="info">
            <div class="row"><span class="label">Ref:</span><span class="value">${escapeHtml(p.receipt_number || p.id)}</span></div>
            <div class="row"><span class="label">Data:</span><span class="value">${escapeHtml(fmtDate(p.created_at))}</span></div>
            <div class="row"><span class="label">Recebedor:</span><span class="value">${driverName} — ${driverProf}</span></div>
            <div class="row"><span class="label">Valor:</span><span class="value total">${escapeHtml(fmt(p.valor))}</span></div>
            <div class="row"><span class="label">Forma de pagamento:</span><span class="value">${escapeHtml(fmtMethod(p.metodo))}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value">${escapeHtml(fmtStatus(p.status))}</span></div>
            ${p.categoria ? `<div class="row"><span class="label">Categoria:</span><span class="value">${escapeHtml(p.categoria)}</span></div>` : ''}
            ${tags.length > 0 ? `<div class="row"><span class="label">Tags:</span><span class="value">${tags.map(escapeHtml).join(', ')}</span></div>` : ''}
            ${p.descricao ? `<div class="row"><span class="label">Descrição:</span><span class="value">${escapeHtml(p.descricao)}</span></div>` : ''}
          </div>
          <div class="footer">Comprovante eletrônico AmoPagar · ID: ${escapeHtml(p.id)}</div>
        </div>`;
    }).join('<div class="page-break"></div>');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovantes AmoPagar</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7fafc; color: #2d3748; padding: 20px; }
    .receipt { max-width: 600px; margin: 20px auto; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
    .logo { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .header p { color: #718096; font-size: 14px; }
    .info { margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #4a5568; font-size: 14px; }
    .value { color: #2d3748; font-size: 14px; text-align: right; }
    .total { font-weight: 700; font-size: 18px; color: #1a202c; }
    .footer { text-align: center; font-size: 11px; color: #a0aec0; margin-top: 20px; }
    .page-break { page-break-after: always; height: 0; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border: 1px solid #ccc; margin: 0 auto; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
${receiptPages || '<p style="text-align:center;padding:40px;color:#718096">Nenhum comprovante encontrado.</p>'}
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro ao gerar comprovantes');
  }
}
