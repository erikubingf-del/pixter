'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type StripeStatus = {
  connected: boolean
  ready: boolean
  requirements?: {
    currently_due: string[]
    past_due: string[]
    pending_verification?: string[]
  }
}

export default function StripeSuccessPage() {
  const router = useRouter()
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<StripeStatus | null>(null)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/stripe/status')
        const data = (await res.json()) as StripeStatus
        setStatus(data)

        if (data.ready) {
          setVerified(true)
          // Auto-redirect after 3 seconds
          setTimeout(() => router.push('/motorista/dashboard/overview'), 3000)
        } else if (data.connected) {
          setError('Sua conta Stripe foi criada, mas ainda está em análise ou com pendências. Conclua as verificações para liberar a AmoPagar.')
        } else {
          setError('Sua conta Stripe ainda não está totalmente configurada. Volte ao onboarding para concluir o processo.')
        }
      } catch {
        setError('Erro ao verificar status da conta Stripe.')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando sua conta Stripe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        {verified ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-green-600 mb-4">
              Stripe Conectado com Sucesso!
            </h1>
            <p className="text-gray-700 mb-2">
              Sua conta está pronta para receber pagamentos.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecionando para o dashboard...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-semibold text-yellow-600 mb-4">
              Configuração Pendente
            </h1>
            <p className="text-gray-700 mb-6">{error}</p>
            {status?.requirements && (
              <p className="text-sm text-gray-500 mb-6">
                Itens pendentes: {[...(status.requirements.currently_due || []), ...(status.requirements.past_due || [])].slice(0, 3).join(', ') || 'aguardando análise da Stripe'}.
              </p>
            )}
          </>
        )}
        <Link
          href={verified ? "/motorista/dashboard/overview" : "/motorista/stripe-onboarding"}
          className="inline-block bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition"
        >
          {verified ? 'Ir para o Dashboard' : 'Voltar ao Onboarding'}
        </Link>
      </div>
    </div>
  )
}
