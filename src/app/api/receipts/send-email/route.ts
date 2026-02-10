import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit } from '@/middleware/rate-limit';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await rateLimit(`send-email:${ip}`, 5, 60000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, paymentIntentId, amount, vendorName } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'ID do pagamento é obrigatório' }, { status: 400 });
    }

    const formattedAmount = amount > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100)
      : 'N/A';

    const transactionRef = `AMO-${paymentIntentId.replace('pi_', '').slice(0, 12).toUpperCase()}`;
    const paymentDate = new Date().toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@amopagar.com';

    const resend = getResend();

    await resend.emails.send({
      from: `AmoPagar <${fromEmail}>`,
      to: [email],
      subject: `Comprovante de Pagamento - ${formattedAmount}`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f7f7;">
  <div style="max-width:500px;margin:30px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#7c3aed;padding:30px 24px;text-align:center;">
      <h1 style="color:white;font-size:22px;margin:0 0 6px;">Pagamento Confirmado</h1>
      <p style="color:#e9d5ff;font-size:14px;margin:0;">AmoPagar</p>
    </div>
    <div style="padding:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:32px;font-weight:700;color:#1a1a1a;">${formattedAmount}</div>
        <div style="font-size:14px;color:#666;margin-top:4px;">para ${vendorName || 'Vendedor'}</div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#666;font-size:13px;">Data</span>
          <span style="color:#1a1a1a;font-size:13px;">${paymentDate}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#666;font-size:13px;">Referência</span>
          <span style="color:#7c3aed;font-size:13px;font-family:monospace;font-weight:600;">${transactionRef}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#666;font-size:13px;">Status</span>
          <span style="color:#16a34a;font-size:13px;font-weight:600;">Confirmado</span>
        </div>
      </div>
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:14px;text-align:center;">
        <p style="color:#6b21a8;font-size:13px;margin:0 0 4px;">
          Guarde o número de referência <strong>${transactionRef}</strong>
        </p>
        <p style="color:#7c3aed;font-size:12px;margin:0;">
          Você pode usá-lo para vincular este pagamento à sua conta no AmoPagar.
        </p>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">
        Este é um email automático enviado pelo AmoPagar.
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email. Tente novamente.' },
      { status: 500 }
    );
  }
}
