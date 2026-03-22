import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { supabaseServer } from '@/lib/supabase/client';
import { generateReceiptHTML, ReceiptData } from '@/lib/receipts/template';
import { requireAuth } from '@/lib/auth/get-session';
import stripe from '@/lib/stripe/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { paymentId, receiptNumber } = await request.json();

    if (!paymentId && !receiptNumber) {
      return NextResponse.json({ error: 'Either paymentId or receiptNumber is required' }, { status: 400 });
    }

    let query = supabaseServer
      .from('pagamentos')
      .select(`
        *,
        motorista:profiles!motorista_id ( nome, celular, email, stripe_account_id ),
        cliente:profiles!cliente_id ( nome, email )
      `);

    if (paymentId) {
      query = query.eq('stripe_payment_id', paymentId);
    } else {
      query = query.eq('receipt_number', receiptNumber);
    }

    const { data: payment, error: fetchError } = await query.single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify ownership: user must be the motorista or cliente
    if (payment.motorista_id !== session.id && payment.cliente_id !== session.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (payment.receipt_pdf_url) {
      return NextResponse.json({
        success: true,
        receiptUrl: payment.receipt_pdf_url,
        receiptNumber: payment.receipt_number,
        cached: true,
      });
    }

    let vendorAddress = '';
    if (payment.motorista?.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(payment.motorista.stripe_account_id);
        if (account.business_profile?.support_address) {
          const addr = account.business_profile.support_address;
          vendorAddress = [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '), addr.country].filter(Boolean).join('\n');
        }
      } catch (e) {
        console.error('Error fetching Stripe account for receipt:', e);
      }
    }

    // Amount is in cents, convert for display
    const amountForDisplay = Number(payment.valor) / 100;

    const receiptData: ReceiptData = {
      receiptNumber: payment.receipt_number,
      date: new Date(payment.created_at),
      vendorName: payment.motorista?.nome || 'Vendedor',
      vendorAddress,
      vendorPhone: payment.motorista?.celular,
      vendorEmail: payment.motorista?.email,
      payerName: payment.cliente?.nome || null,
      amount: amountForDisplay,
      currency: payment.moeda,
      paymentMethod: payment.metodo,
      cardLast4: payment.metadata?.cardLast4,
      authCode: payment.stripe_charge_id?.substring(0, 10),
    };

    const html = generateReceiptHTML(receiptData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    await browser.close();

    const fileName = `${payment.receipt_number}.pdf`;
    const filePath = `receipts/${payment.motorista_id}/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('receipts')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      return safeErrorResponse(uploadError, 'Failed to upload receipt');
    }

    const { data: urlData } = supabaseServer.storage.from('receipts').getPublicUrl(filePath);
    const pdfUrl = urlData.publicUrl;

    await supabaseServer
      .from('pagamentos')
      .update({ receipt_pdf_url: pdfUrl })
      .eq('id', payment.id);

    return NextResponse.json({
      success: true,
      receiptUrl: pdfUrl,
      receiptNumber: payment.receipt_number,
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return safeErrorResponse(error, 'Failed to generate receipt');
  }
}
