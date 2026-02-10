import { NextResponse } from 'next/server';
import { requireCliente } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { escapeHtml } from '@/lib/utils/html-escape';
import { safeErrorResponse } from '@/lib/utils/api-error';

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatStatus = (status: string | null | undefined) => {
  switch (status) {
    case 'succeeded': return 'Aprovado';
    case 'pending': return 'Pendente';
    case 'failed': return 'Falhou';
    default: return status || 'Desconhecido';
  }
};

const formatPaymentMethod = (method: string | null | undefined, details: any) => {
  if (details?.brand && details?.last4) {
    return `Cartão ${details.brand} final ${details.last4}`;
  }
  switch (method) {
    case 'card': return 'Cartão';
    case 'pix': return 'Pix';
    case 'apple_pay': return 'Apple Pay';
    default: return method || 'Não especificado';
  }
};

export async function GET(request: Request) {
  try {
    const session = await requireCliente();
    const userId = session.id;

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'ID do pagamento não fornecido' }, { status: 400 });
    }

    const { data: payment, error } = await supabaseServer
      .from('pagamentos')
      .select(`*, driver_profile:motorista_id ( nome, profissao )`)
      .eq('id', paymentId)
      .eq('cliente_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pagamento não encontrado ou acesso negado' }, { status: 404 });
      }
      return safeErrorResponse(error, 'Erro ao buscar detalhes do pagamento');
    }

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const driverName = escapeHtml(payment.driver_profile?.nome || 'Não especificado');
    const driverProf = escapeHtml(payment.driver_profile?.profissao || 'Motorista');
    const paymentIdEsc = escapeHtml(payment.id);
    const dateStr = escapeHtml(new Date(payment.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    const userIdEsc = escapeHtml(userId);

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprovante de Pagamento - Pixter</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; background-color: #f7fafc; color: #2d3748; line-height: 1.6; }
          .receipt { max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
          .header p { font-size: 16px; color: #4a5568; margin: 0; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #4a5568; flex-basis: 40%; }
          .info-value { color: #2d3748; flex-basis: 60%; text-align: right; }
          .total-row .info-label, .total-row .info-value { font-weight: bold; font-size: 1.1em; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">PIXTER</div>
            <p>Comprovante de Pagamento</p>
          </div>
          <div class="info">
            <div class="info-row"><span class="info-label">ID da Transação:</span><span class="info-value">${paymentIdEsc}</span></div>
            <div class="info-row"><span class="info-label">Data e Hora:</span><span class="info-value">${dateStr}</span></div>
            <div class="info-row"><span class="info-label">Recebedor:</span><span class="info-value">${driverName} (${driverProf})</span></div>
            <div class="info-row"><span class="info-label">Valor:</span><span class="info-value">${formatCurrency(payment.valor)}</span></div>
            <div class="info-row"><span class="info-label">Forma de Pagamento:</span><span class="info-value">${escapeHtml(formatPaymentMethod(payment.metodo, payment.payment_method_details))}</span></div>
            <div class="info-row"><span class="info-label">Status:</span><span class="info-value">${escapeHtml(formatStatus(payment.status))}</span></div>
          </div>
          <div class="footer">
            <p>Este é um comprovante eletrônico gerado pelo sistema Pixter.</p>
            <p>ID do Pagador: ${userIdEsc}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Erro interno no servidor ao gerar comprovante');
  }
}
