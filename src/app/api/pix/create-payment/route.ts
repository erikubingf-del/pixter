import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Generate a unique receipt number for Pix payments
 * Format: PIX-TIMESTAMP-RANDOM (e.g., PIX-1732234567-A7B3C2)
 */
function generatePixReceiptNumber(): string {
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PIX-${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { motorista_id, valor, pix_payload } = body

    // Validate required fields
    if (!motorista_id || !valor) {
      return NextResponse.json(
        { error: 'motorista_id and valor are required' },
        { status: 400 }
      )
    }

    // Validate amount
    const amountInBRL = parseFloat(valor)
    if (isNaN(amountInBRL) || amountInBRL <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Generate unique receipt number
    const receiptNumber = generatePixReceiptNumber()

    // For Pix, there's no commission - driver gets 100%
    const netAmount = amountInBRL
    const applicationFee = 0

    // Create payment record
    const { data: payment, error } = await supabaseServer
      .from('pagamentos')
      .insert({
        motorista_id,
        cliente_id: null, // Guest payment for now
        valor: amountInBRL,
        moeda: 'brl',
        status: 'pending', // Will be updated to 'succeeded' after manual confirmation
        metodo: 'pix',
        application_fee_amount: applicationFee,
        net_amount: netAmount,
        receipt_number: receiptNumber,
        stripe_payment_id: null,
        descricao: 'Pagamento via Pix',
        metadata: {
          pix_payload,
          payment_type: 'pix_manual'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating Pix payment:', error)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payment,
      receiptNumber,
      message: 'Pix payment created. Awaiting confirmation.'
    })
  } catch (error: any) {
    console.error('Error in create-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
