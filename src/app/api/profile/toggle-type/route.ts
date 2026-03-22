import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
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

    const { data: currentProfile, error: currentProfileError } = await supabaseServer
      .from('profiles')
      .select('id, tipo, stripe_account_id, onboarding_completed')
      .eq('id', session.user.id)
      .single()

    if (currentProfileError || !currentProfile) {
      return NextResponse.json(
        { error: 'Failed to load current profile' },
        { status: 500 }
      )
    }

    if (
      tipo === 'cliente' &&
      (currentProfile.tipo === 'motorista' ||
        currentProfile.onboarding_completed ||
        currentProfile.stripe_account_id)
    ) {
      return NextResponse.json(
        {
          error:
            'A conta de motorista permanece ativa. Use a navegação para alternar entre a área do cliente e a área do motorista.',
        },
        { status: 400 }
      )
    }

    const updateData: any = {
      tipo,
      updated_at: new Date().toISOString()
    }

    // Update profile
    const { data: profile, error } = await supabaseServer
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
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
