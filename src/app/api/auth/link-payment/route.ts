import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'
import stripe from '@/lib/stripe/server'
import { safeErrorResponse } from '@/lib/utils/api-error'

export const dynamic = 'force-dynamic';

/**
 * Link Payment to User Account
 *
 * Links a guest payment to a newly created user account.
 * Also auto-saves the payment method (card) to the user's profile for faster future payments.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'ID do pagamento não informado' },
        { status: 400 }
      )
    }

    // Find the payment by Stripe payment intent ID
    const { data: payment, error: fetchError } = await supabaseServer
      .from('pagamentos')
      .select('id, cliente_id, motorista_id, valor, receipt_number, stripe_payment_id')
      .eq('stripe_payment_id', paymentIntentId)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Check if payment is already linked to another user
    if (payment.cliente_id && payment.cliente_id !== userId) {
      return NextResponse.json(
        { error: 'Pagamento já vinculado a outra conta' },
        { status: 409 }
      )
    }

    // Check if user is trying to link their own payment as driver
    if (payment.motorista_id === userId) {
      return NextResponse.json(
        { error: 'Você não pode vincular um pagamento que recebeu' },
        { status: 400 }
      )
    }

    // Link payment to user
    const { error: updateError } = await supabaseServer
      .from('pagamentos')
      .update({
        cliente_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      return safeErrorResponse(updateError, 'Erro ao vincular pagamento')
    }

    // Auto-save the payment method (card) from this PaymentIntent
    let cardSaved = false
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (pi.payment_method && typeof pi.payment_method === 'string') {
        const pm = await stripe.paymentMethods.retrieve(pi.payment_method)

        // Only save card-type payment methods (not Apple Pay wallets which are device-bound)
        if (pm.type === 'card' && pm.card) {
          // Get or create Stripe customer for this user
          const { data: profile } = await supabaseServer
            .from('profiles')
            .select('stripe_customer_id, email, nome')
            .eq('id', userId)
            .single()

          let customerId = profile?.stripe_customer_id

          if (!customerId) {
            const customer = await stripe.customers.create({
              email: session.user.email || undefined,
              name: profile?.nome || session.user.name || undefined,
              metadata: { supabaseUserId: userId },
            })
            customerId = customer.id

            await supabaseServer
              .from('profiles')
              .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
              .eq('id', userId)
          }

          // Clone the payment method and attach to customer
          // (original PM from PaymentIntent may not be reusable)
          const clonedPM = await stripe.paymentMethods.create({
            customer: customerId,
            payment_method: pi.payment_method,
          })

          await stripe.paymentMethods.attach(clonedPM.id, {
            customer: customerId,
          })

          // Set as default payment method
          await supabaseServer
            .from('profiles')
            .update({
              default_payment_method: clonedPM.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          cardSaved = true
        }
      }
    } catch (cardError) {
      // Don't fail the whole flow if card saving fails
      console.error('Failed to auto-save card:', cardError)
    }

    return NextResponse.json({
      success: true,
      cardSaved,
      payment: {
        id: payment.id,
        valor: payment.valor,
        receipt_number: payment.receipt_number
      }
    })

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Erro ao vincular pagamento')
  }
}
