import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

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
    const { tipo } = body

    if (!tipo || !['cliente', 'motorista'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    // If converting to cliente, remove Stripe connection
    const updateData: any = {
      tipo,
      updated_at: new Date().toISOString()
    }

    if (tipo === 'cliente') {
      updateData.stripe_account_id = null
    }

    // Update profile
    const { data: profile, error } = await supabaseServer
      .from('profiles')
      .update(updateData)
      .eq('email', session.user.email)
      .select()
      .single()

    if (error) {
      console.error('Error updating account type:', error)
      return NextResponse.json(
        { error: 'Failed to update account type' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error in toggle-type route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
