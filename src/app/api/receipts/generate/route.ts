// src/app/api/receipts/generate/route.ts
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { supabaseServer } from '@/lib/supabase/client';
import { generateReceiptHTML, ReceiptData } from '@/lib/receipts/template';

/**
 * Generate PDF receipt for a payment
 * POST /api/receipts/generate
 *
 * Body: { paymentId: string } OR { receiptNumber: string }
 */
export async function POST(request: Request) {
  try {
    const { paymentId, receiptNumber } = await request.json();

    if (!paymentId && !receiptNumber) {
      return NextResponse.json(
        { error: 'Either paymentId or receiptNumber is required' },
        { status: 400 }
      );
    }

    // Fetch payment from database
    let query = supabaseServer
      .from('pagamentos')
      .select(`
        *,
        motorista:profiles!motorista_id (
          nome,
          celular,
          email,
          stripe_account_id
        ),
        cliente:profiles!cliente_id (
          nome,
          email
        )
      `);

    if (paymentId) {
      query = query.eq('stripe_payment_id', paymentId);
    } else {
      query = query.eq('receipt_number', receiptNumber);
    }

    const { data: payment, error: fetchError } = await query.single();

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if PDF already exists
    if (payment.receipt_pdf_url) {
      return NextResponse.json({
        success: true,
        receiptUrl: payment.receipt_pdf_url,
        receiptNumber: payment.receipt_number,
        cached: true,
      });
    }

    // Get vendor address from Stripe (if available)
    let vendorAddress = '';
    if (payment.motorista?.stripe_account_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const account = await stripe.accounts.retrieve(payment.motorista.stripe_account_id);

        if (account.business_profile?.support_address) {
          const addr = account.business_profile.support_address;
          vendorAddress = [
            addr.line1,
            addr.line2,
            [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
            addr.country,
          ]
            .filter(Boolean)
            .join('\n');
        }
      } catch (e) {
        console.error('Error fetching Stripe account:', e);
      }
    }

    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: payment.receipt_number,
      date: new Date(payment.created_at),
      vendorName: payment.motorista?.nome || 'Vendedor',
      vendorAddress,
      vendorPhone: payment.motorista?.celular,
      vendorEmail: payment.motorista?.email,
      payerName: payment.cliente?.nome || null,
      amount: parseFloat(payment.valor),
      currency: payment.moeda,
      paymentMethod: payment.metodo,
      cardLast4: payment.metadata?.cardLast4,
      authCode: payment.stripe_charge_id?.substring(0, 10),
    };

    // Generate HTML
    const html = generateReceiptHTML(receiptData);

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Upload PDF to Supabase Storage
    const fileName = `${payment.receipt_number}.pdf`;
    const filePath = `receipts/${payment.motorista_id}/${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from('receipts')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload receipt' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('receipts')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // Update payment record with PDF URL
    const { error: updateError } = await supabaseServer
      .from('pagamentos')
      .update({ receipt_pdf_url: pdfUrl })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment with PDF URL:', updateError);
    }

    return NextResponse.json({
      success: true,
      receiptUrl: pdfUrl,
      receiptNumber: payment.receipt_number,
    });
  } catch (error: any) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
