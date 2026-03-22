'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StripeRefreshPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRetry = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/connect-account', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao reiniciar configuração')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de onboarding não recebida')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao tentar novamente')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔄</span>
        </div>
        <h1 className="text-2xl font-semibold text-orange-600 mb-4">
          Link Expirado
        </h1>
        <p className="text-gray-700 mb-6">
          O link para conectar sua conta Stripe expirou. Clique abaixo para gerar um novo link.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Gerando novo link...' : 'Tentar Novamente'}
          </button>

          <Link
            href="/motorista/dashboard/overview"
            className="block w-full text-center py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
