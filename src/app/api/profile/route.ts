import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'
import { safeErrorResponse } from '@/lib/utils/api-error'
import {
  hasDriverCapabilityFromProfile,
  isDriverOnboardingComplete,
} from '@/lib/auth/driver-profile'

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch profile from database
    const { data: profile, error } = await supabaseServer
      .from('profiles')
      .select('id, nome, email, celular, cpf, tipo, stripe_account_id, stripe_account_status, stripe_account_charges_enabled, stripe_account_payouts_enabled, onboarding_completed, profissao, data_nascimento, pix_key, avatar_url, company_name, city, address')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    const canUseDriverView = hasDriverCapabilityFromProfile(profile)

    const stripeReady = Boolean(
      profile.stripe_account_id &&
        profile.stripe_account_charges_enabled &&
        profile.stripe_account_payouts_enabled
    )

    return NextResponse.json({
      profile: {
        ...profile,
        can_use_driver_view: canUseDriverView,
        driver_onboarding_complete: isDriverOnboardingComplete(profile),
        stripe_ready: stripeReady,
      },
    })
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Erro ao buscar perfil')
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, company_name, city, address, avatar_url, pix_key } = body

    // Update profile
    const { data: profile, error } = await supabaseServer
      .from('profiles')
      .update({
        nome,
        company_name,
        city,
        address,
        avatar_url,
        pix_key,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Erro ao atualizar perfil')
  }
}
