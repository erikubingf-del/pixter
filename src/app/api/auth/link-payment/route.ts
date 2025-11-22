import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Link Payment to User Account
 *
 * Links a guest payment to a newly created user account
 * Called after post-payment signup flow
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - must be logged in' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId' },
        { status: 400 }
      )
    }

    // Use Supabase server client
    const supabase = supabaseServer

    // Find the payment by Stripe payment intent ID
    const { data: payment, error: fetchError } = await supabase
      .from('pagamentos')
      .select('id, cliente_id, motorista_id, valor, receipt_number')
      .eq('stripe_payment_id', paymentIntentId)
      .single()

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment is already linked to another user
    if (payment.cliente_id && payment.cliente_id !== userId) {
      return NextResponse.json(
        { error: 'Payment already linked to another account' },
        { status: 409 }
      )
    }

    // Check if user is trying to link their own payment as driver
    if (payment.motorista_id === userId) {
      return NextResponse.json(
        { error: 'Cannot link payment - you are the driver for this transaction' },
        { status: 400 }
      )
    }

    // Link payment to user
    const { error: updateError } = await supabase
      .from('pagamentos')
      .update({
        cliente_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Error linking payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to link payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment linked successfully',
      payment: {
        id: payment.id,
        valor: payment.valor,
        receipt_number: payment.receipt_number
      }
    })

  } catch (error: any) {
    console.error('Error in link-payment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
