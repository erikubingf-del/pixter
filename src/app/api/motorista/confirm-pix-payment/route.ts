import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Driver confirms a pending Pix payment was received
 * Changes status from 'pending' to 'succeeded'
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
    const { payment_id } = body

    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id is required' },
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

    if (profile.tipo !== 'motorista') {
      return NextResponse.json(
        { error: 'Only drivers can confirm payments' },
        { status: 403 }
      )
    }

    // Verify the payment belongs to this driver and is pending
    const { data: payment, error: paymentError } = await supabaseServer
      .from('pagamentos')
      .select('*')
      .eq('id', payment_id)
      .eq('motorista_id', profile.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: `Payment is already ${payment.status}` },
        { status: 400 }
      )
    }

    // Update payment status to succeeded
    const { data: updatedPayment, error: updateError } = await supabaseServer
      .from('pagamentos')
      .update({
        status: 'succeeded',
        descricao: 'Pagamento via Pix - Confirmado',
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.id
        }
      })
      .eq('id', payment_id)
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
      payment: updatedPayment,
      message: 'Payment confirmed successfully'
    })
  } catch (error: any) {
    console.error('Error in confirm-pix-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
