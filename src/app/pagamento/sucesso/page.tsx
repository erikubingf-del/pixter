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

  // Extract payment data from URL
  useEffect(() => {
    const paymentId = searchParams.get('payment_intent')
    const amountParam = searchParams.get('amount')
    const vendorParam = searchParams.get('vendor')

    if (paymentId) setPaymentIntentId(paymentId)
    if (amountParam) setAmount(parseInt(amountParam))
    if (vendorParam) setVendorName(decodeURIComponent(vendorParam))
  }, [searchParams])

  // Auto-show modal for guest users after 1 second
  useEffect(() => {
    if (status === 'unauthenticated' && paymentIntentId) {
      const timer = setTimeout(() => {
        setShowSignupModal(true)
      }, 1000)

      return () => clearTimeout(timer)
    }

    // If authenticated, redirect to dashboard
    if (status === 'authenticated') {
      router.push('/cliente/dashboard')
    }
  }, [status, paymentIntentId, router])
  
  return (
    <>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Pagamento Confirmado!</h2>
            <p className="mt-2 text-lg text-gray-600">
              Seu pagamento foi realizado com sucesso.
            </p>
            {amount > 0 && (
              <p className="mt-4 text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(amount / 100)}
              </p>
            )}
            {vendorName && (
              <p className="mt-1 text-gray-600">
                Para: {vendorName}
              </p>
            )}
          </div>

          {status === 'unauthenticated' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-center text-purple-900 mb-2">
                📱 Salve seu recibo!
              </h3>
              <p className="text-center text-purple-700 mb-4">
                Crie sua conta em 30 segundos e acesse todos os seus recibos a qualquer momento.
              </p>

              <button
                onClick={() => setShowSignupModal(true)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Criar Conta Grátis
              </button>
            </div>
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
            // Will redirect to dashboard in the component
          }}
        />
      )}
    </>
  )
}
