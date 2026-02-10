'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  created_at: string
  valor: number
  metodo: string
  status: string
  motorista_nome?: string
  receipt_number?: string
}

export default function HistoricoPage() {
  const { status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchPayments()
    }
  }, [status])

  const fetchPayments = async (params?: { start?: string; end?: string; q?: string }) => {
    setLoading(true)
    setError('')
    try {
      const searchParams = new URLSearchParams()
      if (params?.start || startDate) searchParams.set('startDate', params?.start || startDate)
      if (params?.end || endDate) searchParams.set('endDate', params?.end || endDate)
      if (params?.q || search) searchParams.set('search', params?.q || search)

      const url = `/api/client/payments${searchParams.toString() ? `?${searchParams}` : ''}`
      const res = await fetch(url)

      if (!res.ok) throw new Error('Erro ao buscar pagamentos')

      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      setError('Erro ao carregar histórico. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchPayments({ start: startDate, end: endDate, q: search })
  }

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const statusLabel = (s: string) => {
    const map: Record<string, { text: string; color: string }> = {
      succeeded: { text: 'Pago', color: 'text-green-700 bg-green-100' },
      pending: { text: 'Pendente', color: 'text-yellow-700 bg-yellow-100' },
      failed: { text: 'Falhou', color: 'text-red-700 bg-red-100' },
      refunded: { text: 'Reembolsado', color: 'text-blue-700 bg-blue-100' },
    }
    return map[s] || { text: s, color: 'text-gray-700 bg-gray-100' }
  }

  const handleShare = async (payment: Payment) => {
    const text = `Comprovante AmoPagar\nValor: ${formatAmount(payment.valor)}\nPara: ${payment.motorista_nome || 'Vendedor'}\nData: ${formatDate(payment.created_at)}\nRef: ${payment.receipt_number || payment.id}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Comprovante - AmoPagar', text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Detalhes copiados!')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Histórico de Pagamentos</h1>
        <Link
          href="/cliente/dashboard/add-invoice"
          className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Vincular Pagamento
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por vendedor..."
          className="flex-1 min-w-[150px] text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
        />
        <span className="text-gray-400 text-sm">até</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
        />
        <button
          onClick={handleFilter}
          className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-md hover:bg-purple-700 transition"
        >
          Filtrar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando pagamentos...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhum pagamento encontrado.</p>
          <p className="text-sm text-gray-400">
            Já fez um pagamento sem estar logado?{' '}
            <Link href="/cliente/dashboard/add-invoice" className="text-purple-600 hover:underline">
              Vincule usando o número da transação
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const status = statusLabel(payment.status)
            return (
              <div
                key={payment.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {payment.motorista_nome || 'Vendedor'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(payment.created_at)}
                    {payment.metodo && (
                      <span className="ml-2 capitalize">{payment.metodo}</span>
                    )}
                  </div>
                  {payment.receipt_number && (
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      Ref: {payment.receipt_number}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatAmount(payment.valor)}
                  </span>
                  <button
                    onClick={() => handleShare(payment)}
                    className="p-2 text-gray-400 hover:text-purple-600 transition"
                    title="Compartilhar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
