import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic';


/**
 * Confirm a Pix payment (driver confirms they received the payment)
 * This is a manual confirmation flow since Pix doesn't have automatic webhooks
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

    const body = await request.json()
    const { receipt_number } = body

    if (!receipt_number) {
      return NextResponse.json(
        { error: 'receipt_number is required' },
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

    // Only drivers can confirm payments
    if (profile.tipo !== 'motorista') {
      return NextResponse.json(
        { error: 'Only drivers can confirm payments' },
        { status: 403 }
      )
    }

    // Find the payment
    const { data: payment, error: paymentError } = await supabaseServer
      .from('pagamentos')
      .select('*')
      .eq('receipt_number', receipt_number)
      .eq('motorista_id', profile.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    if (payment.status === 'succeeded') {
      return NextResponse.json(
        { message: 'Payment already confirmed', payment },
        { status: 200 }
      )
    }

    // Update payment status to succeeded
    const { data: updatedPayment, error: updateError } = await supabaseServer
      .from('pagamentos')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error confirming payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Payment confirmed successfully',
      payment: updatedPayment
    })
  } catch (error: any) {
    console.error('Error in confirm-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
