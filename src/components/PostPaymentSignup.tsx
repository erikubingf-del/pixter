'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { X, Phone, Loader2 } from 'lucide-react'

interface PostPaymentSignupProps {
  paymentIntentId: string
  amount: number
  vendorName: string
  onClose: () => void
  onSuccess: () => void
}

export default function PostPaymentSignup({
  paymentIntentId,
  amount,
  vendorName,
  onClose,
  onSuccess
}: PostPaymentSignupProps) {
  const [step, setStep] = useState<'prompt' | 'phone' | 'otp' | 'success'>('prompt')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100)
  }

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
  }

  // Send OTP
  const handleSendOTP = async () => {
    try {
      setLoading(true)
      setError('')

      // Clean phone number to E.164 format
      const cleaned = phoneNumber.replace(/\D/g, '')
      if (cleaned.length !== 11) {
        setError('Por favor, insira um número válido com DDD')
        return
      }

      const e164Phone = `+55${cleaned}`

      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar código')
      }

      setStep('otp')
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      setError(err.message || 'Erro ao enviar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and create account
  const handleVerifyOTP = async () => {
    try {
      setLoading(true)
      setError('')

      // Clean phone number to E.164 format
      const cleaned = phoneNumber.replace(/\D/g, '')
      const e164Phone = `+55${cleaned}`

      // Sign in with credentials (phone + OTP)
      const result = await signIn('credentials', {
        phone: e164Phone,
        code: otp,
        redirect: false
      })

      if (result?.error) {
        throw new Error('Código inválido ou expirado')
      }

      // Link payment to the newly created account
      const linkRes = await fetch('/api/auth/link-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId })
      })

      if (!linkRes.ok) {
        const linkData = await linkRes.json()
        console.error('Failed to link payment:', linkData.error)
        // Don't fail the whole flow - account was created successfully
      }

      setStep('success')

      // Wait 2 seconds then redirect to dashboard
      setTimeout(() => {
        onSuccess()
        window.location.href = '/cliente/dashboard'
      }, 2000)

    } catch (err: any) {
      console.error('Error verifying OTP:', err)
      setError(err.message || 'Erro ao verificar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Prompt Step */}
        {step === 'prompt' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pagamento Confirmado!
              </h2>
              <p className="text-gray-600">
                {formatCurrency(amount)} para {vendorName}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">
                📱 Salve este recibo!
              </h3>
              <p className="text-sm text-purple-700">
                Crie sua conta em 30 segundos e acesse todos os seus recibos a qualquer momento.
              </p>
            </div>

            <button
              onClick={() => setStep('phone')}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-3"
            >
              Criar Conta Grátis
            </button>

            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              Não, obrigado
            </button>
          </div>
        )}

        {/* Phone Number Step */}
        {step === 'phone' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Criar Conta
            </h2>
            <p className="text-gray-600 mb-6">
              Insira seu número de celular para começar
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Celular (com DDD)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value)
                    setPhoneNumber(formatted)
                  }}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phoneNumber.replace(/\D/g, '').length !== 11}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Código'
              )}
            </button>

            <button
              onClick={() => setStep('prompt')}
              className="w-full text-gray-600 hover:text-gray-800 text-sm mt-3"
            >
              Voltar
            </button>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificar Código
            </h2>
            <p className="text-gray-600 mb-6">
              Digite o código de 6 dígitos enviado para {phoneNumber}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificação
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '')
                  setOtp(cleaned)
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar e Criar Conta'
              )}
            </button>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full text-purple-600 hover:text-purple-800 text-sm mt-3"
            >
              Reenviar código
            </button>

            <button
              onClick={() => setStep('phone')}
              className="w-full text-gray-600 hover:text-gray-800 text-sm mt-2"
            >
              Alterar número
            </button>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conta Criada!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecionando para o painel...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
