'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AddInvoicePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [receiptNumber, setReceiptNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [linkedPayment, setLinkedPayment] = useState<any>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Format receipt number input (auto-uppercase)
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setReceiptNumber(value)
    setError('')
  }

  // Link invoice to account
  const handleLinkInvoice = async () => {
    if (!receiptNumber.trim()) {
      setError('Por favor, insira o número do recibo')
      return
    }

    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/client/link-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber: receiptNumber.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar comprovante')
      }

      setSuccess(true)
      setLinkedPayment(data.payment)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/cliente/dashboard')
      }, 2000)

    } catch (err: any) {
      console.error('Error linking invoice:', err)
      setError(err.message || 'Erro ao adicionar comprovante. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-purple-600 rounded-full"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Link
          href="/cliente/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao painel
        </Link>

        {/* Success State */}
        {success && linkedPayment ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Comprovante Adicionado!
              </h1>
              <p className="text-gray-600 mb-6">
                O pagamento foi vinculado à sua conta com sucesso.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600">Valor</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(linkedPayment.valor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(linkedPayment.created_at)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Vendedor</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {linkedPayment.motorista?.nome || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Recibo</p>
                    <p className="text-lg font-mono text-purple-600">
                      #{linkedPayment.receipt_number}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Redirecionando para o painel...
              </p>
            </div>
          </div>
        ) : (
          /* Input State */
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Adicionar Comprovante
              </h1>
              <p className="text-gray-600">
                Digite o número do recibo para vincular o pagamento à sua conta
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                📸 Como encontrar o número do recibo?
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Abra o print/screenshot do comprovante de pagamento</li>
                <li>• O número está no formato: <strong>PIX-1234567890-ABC123</strong></li>
                <li>• Pode aparecer como "Número do Recibo" ou "Invoice Number"</li>
                <li>• Digite exatamente como aparece no comprovante</li>
              </ul>
            </div>

            {/* Receipt Number Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Recibo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={handleReceiptChange}
                  placeholder="PIX-1234567890-ABC123"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Digite o número exatamente como aparece no comprovante
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Erro ao adicionar comprovante</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleLinkInvoice}
              disabled={loading || !receiptNumber.trim()}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Adicionar Comprovante'
              )}
            </button>

            {/* Help Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Problemas ao adicionar?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <details className="cursor-pointer">
                  <summary className="font-medium text-gray-700 hover:text-purple-600">
                    "Comprovante não encontrado"
                  </summary>
                  <p className="mt-2 pl-4">
                    Verifique se digitou o número corretamente. O número diferencia maiúsculas de minúsculas.
                    Tente copiar e colar diretamente do comprovante.
                  </p>
                </details>

                <details className="cursor-pointer">
                  <summary className="font-medium text-gray-700 hover:text-purple-600">
                    "Comprovante já vinculado"
                  </summary>
                  <p className="mt-2 pl-4">
                    Este comprovante já está vinculado a uma conta. Verifique se você já adicionou este pagamento
                    anteriormente ou se foi adicionado durante o pagamento.
                  </p>
                </details>

                <details className="cursor-pointer">
                  <summary className="font-medium text-gray-700 hover:text-purple-600">
                    "Não consigo encontrar o número"
                  </summary>
                  <p className="mt-2 pl-4">
                    O número do recibo aparece no comprovante de pagamento que você recebeu após pagar.
                    Se você não tem o comprovante, entre em contato com o vendedor.
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
