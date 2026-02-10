'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PostPaymentSignup from '@/components/PostPaymentSignup'

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [amount, setAmount] = useState(0)
  const [vendorName, setVendorName] = useState('')
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [copied, setCopied] = useState(false)

  const formattedAmount = amount > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100)
    : ''

  const paymentDate = new Date().toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  // Transaction reference matching webhook format: AMO-{12 chars from PI ID}
  const transactionRef = paymentIntentId
    ? `AMO-${paymentIntentId.replace('pi_', '').slice(0, 12).toUpperCase()}`
    : ''

  // Extract payment data from URL
  useEffect(() => {
    const paymentId = searchParams.get('payment_intent')
    const amountParam = searchParams.get('amount')
    const vendorParam = searchParams.get('vendor')

    if (paymentId) setPaymentIntentId(paymentId)
    if (amountParam) setAmount(parseInt(amountParam))
    if (vendorParam) setVendorName(decodeURIComponent(vendorParam))
  }, [searchParams])

  // Auto-show modal for guest users after 2 seconds
  useEffect(() => {
    if (status === 'unauthenticated' && paymentIntentId) {
      const timer = setTimeout(() => {
        setShowSignupModal(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, paymentIntentId])

  const copyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transactionRef)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = transactionRef
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailError('Insira um email válido')
      return
    }
    setEmailSending(true)
    setEmailError('')

    try {
      const res = await fetch('/api/receipts/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          paymentIntentId,
          amount,
          vendorName,
        }),
      })

      if (!res.ok) {
        throw new Error('Falha ao enviar email')
      }

      setEmailSent(true)
    } catch {
      setEmailError('Erro ao enviar email. Tente novamente.')
    } finally {
      setEmailSending(false)
    }
  }

  const shareText = `Comprovante de pagamento AmoPagar\nValor: ${formattedAmount}\nPara: ${vendorName}\nRef: ${transactionRef}\nData: ${paymentDate}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprovante de Pagamento - AmoPagar',
          text: shareText,
        })
      } catch {
        // User cancelled share
      }
    }
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pagamento Confirmado!</h2>
          </div>

          {/* Transaction Details Card */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6 space-y-3">
            {formattedAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor</span>
                <span className="text-xl font-bold text-purple-600">{formattedAmount}</span>
              </div>
            )}
            {vendorName && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vendedor</span>
                <span className="font-medium text-gray-900">{vendorName}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data</span>
              <span className="text-sm text-gray-700">{paymentDate}</span>
            </div>
            {transactionRef && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Referência</span>
                <button
                  onClick={copyTransactionId}
                  className="text-sm font-mono text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  title="Copiar código completo"
                >
                  {transactionRef}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
            {copied && (
              <p className="text-xs text-green-600 text-right">Copiado!</p>
            )}
          </div>

          {/* Share Button */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartilhar Comprovante
            </button>
          )}

          {/* Email Receipt - For non-authenticated users */}
          {status === 'unauthenticated' && !emailSent && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Enviar comprovante por email:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {emailSending ? '...' : 'Enviar'}
                </button>
              </div>
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              )}
            </div>
          )}
          {emailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-green-700">Comprovante enviado para {email}</p>
            </div>
          )}

          {/* Create Account CTA - For non-authenticated users */}
          {status === 'unauthenticated' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-4">
              <h3 className="text-lg font-bold text-center text-purple-900 mb-1">
                Salve seus comprovantes
              </h3>
              <p className="text-center text-sm text-purple-700 mb-3">
                Crie sua conta grátis para acessar todos os seus recibos e pagamentos.
              </p>
              <button
                onClick={() => setShowSignupModal(true)}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Criar Conta Grátis
              </button>
              <p className="text-center text-xs text-purple-600 mt-2">
                Use a referência <span className="font-mono font-bold">{transactionRef}</span> para vincular este pagamento depois.
              </p>
            </div>
          )}

          {/* Authenticated user - go to dashboard */}
          {status === 'authenticated' && (
            <button
              onClick={() => router.push('/cliente/dashboard')}
              className="w-full mb-4 py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              Ir para Meu Dashboard
            </button>
          )}

          <div className="text-center text-sm text-gray-500">
            <Link href="/" className="text-purple-600 hover:text-purple-800">
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </main>

      {/* Post-Payment Signup Modal */}
      {showSignupModal && paymentIntentId && (
        <PostPaymentSignup
          paymentIntentId={paymentIntentId}
          amount={amount}
          vendorName={vendorName || 'Vendedor'}
          onClose={() => setShowSignupModal(false)}
          onSuccess={() => {
            setShowSignupModal(false)
          }}
        />
      )}
    </>
  )
}
