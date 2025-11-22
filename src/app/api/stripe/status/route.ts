import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
      typescript: true,
    })
  : null

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, tipo, stripe_account_id')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // If not a driver or no Stripe account, return not connected
    if (profile.tipo !== 'motorista' || !profile.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      })
    }

    // If Stripe is not configured, return basic info
    if (!stripe) {
      console.error('Stripe not initialized')
      return NextResponse.json({
        connected: true,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        error: 'Stripe not configured'
      })
    }

    // Fetch Stripe account status
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)

      return NextResponse.json({
        connected: true,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        details_submitted: account.details_submitted || false,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || []
        }
      })
    } catch (stripeError: any) {
      console.error('Error fetching Stripe account:', stripeError)

      // If account not found or deleted, return not connected
      if (stripeError.code === 'account_invalid') {
        return NextResponse.json({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch Stripe status' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in stripe status route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
