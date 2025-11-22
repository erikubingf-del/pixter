import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/client'
import { rateLimit } from '@/middleware/rate-limit'

/**
 * Creates a pending Pix payment record when QR code is generated
 * Driver must confirm payment receipt later in Lucro page
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { valor, motorista_id, pagador_info } = body

    // Rate limiting: Max 20 Pix QR generations per driver per minute
    const rateLimitResult = rateLimit(`pix-pending:${motorista_id}`, 20, 60000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento.' },
        { status: 429 }
      )
    }

    // Validate required fields
    if (!valor || !motorista_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate unique receipt number for pending Pix
    const timestamp = Date.now().toString().slice(-10)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const receiptNumber = `PIX-PENDING-${timestamp}-${random}`

    // Create pending payment record
    const { data: payment, error } = await supabaseServer
      .from('pagamentos')
      .insert({
        motorista_id: motorista_id,
        cliente_id: null, // Guest payment
        valor: amountInBRL,
        moeda: 'brl',
        status: 'pending', // Pending confirmation from driver
        metodo: 'pix',
        application_fee_amount: 0, // No fee for Pix
        net_amount: amountInBRL, // Driver gets 100%
        receipt_number: receiptNumber,
        stripe_payment_id: null, // No Stripe for Pix
        descricao: 'Pagamento via Pix - Aguardando confirmação',
        metadata: {
          payment_type: 'pix_pending',
          pagador_info: pagador_info || null, // Optional payer info
          qr_generated_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pending Pix payment:', error)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payment,
      message: 'Pending payment created successfully'
    })
  } catch (error: any) {
    console.error('Error in create-pending-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
