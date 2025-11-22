// src/app/api/receipts/[receiptNumber]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/client';

/**
 * Get receipt by receipt number
 * GET /api/receipts/[receiptNumber]
 *
 * Returns receipt PDF URL or generates it if doesn't exist
 */
export async function GET(
  request: Request,
  { params }: { params: { receiptNumber: string } }
) {
  try {
    const { receiptNumber } = params;

    if (!receiptNumber) {
      return NextResponse.json(
        { error: 'Receipt number is required' },
        { status: 400 }
      );
    }

    // Fetch payment by receipt number
    const { data: payment, error: fetchError } = await supabaseServer
      .from('pagamentos')
      .select('id, receipt_number, receipt_pdf_url, receipt_url, valor, created_at, motorista:profiles!motorista_id(nome)')
      .eq('receipt_number', receiptNumber)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // If PDF already exists, return it
    if (payment.receipt_pdf_url) {
      return NextResponse.json({
        success: true,
        receiptNumber: payment.receipt_number,
        receiptUrl: payment.receipt_pdf_url,
        stripeReceiptUrl: payment.receipt_url,
        amount: payment.valor,
        date: payment.created_at,
        vendorName: payment.motorista?.nome,
      });
    }

    // If PDF doesn't exist, trigger generation
    const generateUrl = new URL('/api/receipts/generate', request.url);
    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptNumber }),
    });

    const generateData = await generateResponse.json();

    if (!generateResponse.ok) {
      return NextResponse.json(
        { error: generateData.error || 'Failed to generate receipt' },
        { status: generateResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      receiptNumber: payment.receipt_number,
      receiptUrl: generateData.receiptUrl,
      stripeReceiptUrl: payment.receipt_url,
      amount: payment.valor,
      date: payment.created_at,
      vendorName: payment.motorista?.nome,
    });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
