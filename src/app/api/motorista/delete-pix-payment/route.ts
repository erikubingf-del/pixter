import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Driver deletes a pending Pix payment (customer didn't pay)
 * Only pending payments can be deleted
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
        { error: 'Only drivers can delete payments' },
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
        { error: `Cannot delete payment with status: ${payment.status}` },
        { status: 400 }
      )
    }

    // Delete the payment
    const { error: deleteError } = await supabaseServer
      .from('pagamentos')
      .delete()
      .eq('id', payment_id)

    if (deleteError) {
      console.error('Error deleting payment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Payment deleted successfully'
    })
  } catch (error: any) {
    console.error('Error in delete-pix-payment route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
