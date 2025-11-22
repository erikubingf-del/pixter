'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Download, Plus, Trash2, Search } from 'lucide-react'

interface Payment {
  id: string
  created_at: string
  valor: number
  metodo: string | null
  receipt_number: string
  receipt_pdf_url: string | null
  receipt_url: string | null
  motorista: {
    nome: string
  } | null
}

export default function ClienteDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      if (status !== 'authenticated') return

      try {
        setLoading(true)
        setError('')

        // Build query params
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (searchTerm) params.append('search', searchTerm)

        const res = await fetch(`/api/client/payments?${params.toString()}`)

        if (!res.ok) {
          throw new Error('Failed to fetch payments')
        }

        const data = await res.json()
        setPayments(data.payments || [])
      } catch (err: any) {
        console.error('Error fetching payments:', err)
        setError(err.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [status, startDate, endDate, searchTerm])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Format payment method
  const formatPaymentMethod = (method: string | null) => {
    if (!method) return 'N/A'

    const methodMap: Record<string, string> = {
      'card': 'Cartão',
      'pix': 'Pix',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
    }

    return methodMap[method] || method
  }

  // Download receipt
  const downloadReceipt = async (receiptNumber: string) => {
    try {
      window.open(`/api/receipts/${receiptNumber}`, '_blank')
    } catch (err) {
      console.error('Error downloading receipt:', err)
    }
  }

  // Calculate total spent
  const totalSpent = payments.reduce((sum, p) => sum + p.valor, 0)

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-600 rounded-full"></div>
      </main>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Olá, {session.user?.name || 'Cliente'}!
          </h1>
          <p className="text-gray-600 mt-2">Gerencie seus pagamentos e recibos</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Gasto</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Pagamentos</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {payments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Este Mês</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(
                payments
                  .filter(p => new Date(p.created_at).getMonth() === new Date().getMonth())
                  .reduce((sum, p) => sum + p.valor, 0)
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por vendedor
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome do vendedor..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStartDate('')
                setEndDate('')
              }}
              className="mt-4 text-sm text-purple-600 hover:text-purple-800"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Payments Table */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Seus Pagamentos</h2>
              <Link
                href="/cliente/dashboard/historico"
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Ver todos
              </Link>
            </div>

            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {payments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">Nenhum pagamento encontrado</p>
                <Link
                  href="/"
                  className="mt-4 inline-block text-purple-600 hover:text-purple-800"
                >
                  Fazer um pagamento
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Vendedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Recibo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.motorista?.nome || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPaymentMethod(payment.metodo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          #{payment.receipt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <button
                            onClick={() => downloadReceipt(payment.receipt_number)}
                            className="inline-flex items-center text-purple-600 hover:text-purple-900"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Baixar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Manual Invoice Entry */}
        <section className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Pagou sem estar logado?
            </h3>
            <p className="text-blue-700 mb-4">
              Adicione manualmente o comprovante usando o número do recibo
            </p>
            <Link
              href="/cliente/dashboard/add-invoice"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Comprovante
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
