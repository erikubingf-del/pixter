'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getStripe } from '@/lib/stripe/client-side'
import { useSession } from 'next-auth/react'
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'

export default function AddPaymentMethod() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stripeReady, setStripeReady] = useState(false)
  const cardElementRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<Stripe | null>(null)
  const cardRef = useRef<StripeCardElement | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Mount Stripe Card Element
  useEffect(() => {
    let mounted = true

    async function setupStripe() {
      const stripe = await getStripe()
      if (!stripe || !mounted || !cardElementRef.current) return

      stripeRef.current = stripe
      const elements = stripe.elements()
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#374151',
            '::placeholder': { color: '#9CA3AF' },
          },
          invalid: { color: '#EF4444' },
        },
      })
      card.mount(cardElementRef.current)
      cardRef.current = card
      setStripeReady(true)
    }

    if (status === 'authenticated') {
      setupStripe()
    }

    return () => {
      mounted = false
      cardRef.current?.destroy()
    }
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripeRef.current || !cardRef.current) return

    setLoading(true)
    setError('')

    try {
      const { token, error: stripeError } = await stripeRef.current.createToken(cardRef.current)

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (!token) {
        throw new Error('Falha ao processar cartão')
      }

      const response = await fetch('/api/client/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar cartão')
      }

      router.push('/cliente/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao processar seu cartão.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Adicionar Cartão de Crédito</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dados do Cartão</label>
          <div
            ref={cardElementRef}
            className="border border-gray-300 rounded-md shadow-sm p-3 bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !stripeReady}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Adicionar Cartão'}
        </button>
      </form>
    </div>
  )
}
