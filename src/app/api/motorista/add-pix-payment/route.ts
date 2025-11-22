import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'
import { rateLimit } from '@/middleware/rate-limit'

export const dynamic = 'force-dynamic';


/**
 * Driver manually adds a Pix payment they received
 * Simple flow: Driver confirms they received payment, we add it to their revenue
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting: Max 10 Pix entries per user per minute (prevents spam/accidents)
    const rateLimitResult = rateLimit(`add-pix:${session.user.email}`, 10, 60000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    const body = await request.json()
    const { valor, descricao } = body

    // Validate required fields
    if (!valor) {
      return NextResponse.json(
        { error: 'valor is required' },
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

    // Get driver profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, tipo')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only drivers can add payments
    if (profile.tipo !== 'motorista') {
      return NextResponse.json(
        { error: 'Only drivers can add payments' },
        { status: 403 }
      )
    }

    // Generate unique receipt number for manual Pix entry
    const timestamp = Date.now().toString().slice(-10)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const receiptNumber = `PIX-${timestamp}-${random}`

    // Create payment record
    // For Pix: no commission, driver gets 100%
    const { data: payment, error } = await supabaseServer
      .from('pagamentos')
      .insert({
        motorista_id: profile.id,
        cliente_id: null, // Guest payment
        valor: amountInBRL,
        moeda: 'brl',
        status: 'succeeded', // Manually confirmed by driver
        metodo: 'pix',
        application_fee_amount: 0, // No fee for Pix
        net_amount: amountInBRL, // Driver gets 100%
        receipt_number: receiptNumber,
        stripe_payment_id: null, // No Stripe for Pix
        descricao: descricao || 'Pagamento via Pix',
        metadata: {
          payment_type: 'pix_manual',
          added_by: 'driver'
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
      message: 'Pix payment added successfully'
    })
  } catch (error: any) {
    console.error('Error in add-pix-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
