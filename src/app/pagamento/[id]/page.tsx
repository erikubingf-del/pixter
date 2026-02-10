"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  loadStripe,
  StripeElementsOptions,
} from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import Link from "next/link"
import '../../../styles/amopagar-theme.css'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

type Profile = {
  id: string
  nome?: string
  avatar_url?: string
  celular?: string
  company_name?: string
  city?: string
  pix_key?: string
  has_stripe?: boolean
  has_pix?: boolean
}

function formatDisplayPhoneNumber(e164Phone?: string): string {
  if (!e164Phone) return ""
  const digits = e164Phone.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length === 13) {
    return `(${digits.substring(2, 4)}) ${digits.substring(4, 9)}-${digits.substring(9)}`
  }
  if (digits.startsWith("55") && digits.length === 12) {
    return `(${digits.substring(2, 4)}) ${digits.substring(4, 8)}-${digits.substring(8)}`
  }
  return e164Phone
}

export default function PaginaPagamento() {
  const { data: session } = useSession()
  const { id: driverIdentifier } = useParams() as { id: string }
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [ephemeralKeySecret, setEphemeralKeySecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(true)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  // Fetch driver info
  useEffect(() => {
    async function fetchDriver() {
      if (!driverIdentifier) {
        setError("Identificador do motorista não encontrado na URL.")
        setLoadingProfile(false)
        return
      }
      try {
        setLoadingProfile(true)
        const res = await fetch(`/api/public/driver-info/${driverIdentifier}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Erro ${res.status}: ${res.statusText}`)
        setProfile(json.profile)
      } catch (err: any) {
        console.error("Erro ao buscar motorista:", err)
        setError(err.message)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchDriver()
  }, [driverIdentifier])

  // Create PaymentIntent with minimum amount (will be updated before confirmation)
  // Only needed when driver accepts card payments via Stripe
  useEffect(() => {
    async function createIntent() {
      if (!profile?.id || !profile?.celular) return
      if (!profile.has_stripe) {
        // Driver only accepts Pix — no Stripe PaymentIntent needed
        setLoadingIntent(false)
        return
      }
      try {
        setLoadingIntent(true)
        setError(null)
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 200, // R$2.00 minimum, will be updated before confirmation
            driverPhoneNumber: profile.celular.replace(/\D/g, ""),
          }),
          credentials: "include",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Erro ${res.status}: ${res.statusText}`)
        setClientSecret(json.clientSecret)
        setPaymentIntentId(json.paymentIntentId)
      } catch (err: any) {
        console.error("Erro criando PaymentIntent:", err)
        setError(err.message)
      } finally {
        setLoadingIntent(false)
      }
    }
    if (profile?.id) {
      createIntent()
    }
  }, [profile])

  // Loading States
  if (loadingProfile || loadingIntent) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(139, 125, 216, 0.2)',
          borderTop: '4px solid #8B7DD8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    )
  }

  // Error States
  if (!profile && !loadingProfile) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="amo-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>⚠️</span>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1rem'
          }}>
            Erro ao carregar
          </h2>
          <p style={{ color: '#52606D', marginBottom: '2rem' }}>
            {error || "Não foi possível carregar o perfil."}
          </p>
          <Link href="/" className="amo-btn amo-btn-primary">
            Voltar ao Início
          </Link>
        </div>
      </main>
    )
  }

  if (error && !clientSecret) {
    return (
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="amo-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>⚠️</span>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1rem'
          }}>
            Erro no pagamento
          </h2>
          <p style={{ color: '#52606D', marginBottom: '2rem' }}>{error}</p>
          <Link href="/" className="amo-btn amo-btn-primary">
            Voltar ao Início
          </Link>
        </div>
      </main>
    )
  }

  if (!profile) {
    return null
  }

  // For Stripe card payments we need clientSecret; for Pix-only we don't
  const needsStripe = profile.has_stripe
  if (needsStripe && (!clientSecret || !paymentIntentId)) {
    return null
  }

  const options: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: { theme: "stripe" },
        ...(ephemeralKeySecret && { customerId: session?.user?.id, ephemeralKeySecret }),
      }
    : undefined

  const paymentForm = (
    <CheckoutForm
      paymentIntentId={paymentIntentId}
      profile={profile}
    />
  )

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* AmoPagar Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800'
            }}>
              <span style={{ color: '#8B7DD8' }}>Amo</span>
              <span style={{ color: '#81C995' }}>Pagar</span>
            </h1>
          </Link>
        </div>

        {/* Driver Info Card */}
        <div className="amo-card amo-fade-in" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B7DD8 0%, #81C995 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'white',
              fontWeight: '800',
              flexShrink: 0
            }}>
              {profile.nome?.charAt(0).toUpperCase() || '💳'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#52606D',
                marginBottom: '0.25rem'
              }}>
                Pagando para
              </p>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1F2933',
                marginBottom: '0.25rem'
              }}>
                {profile.nome || "Motorista"}
              </h2>
              {profile.company_name && (
                <p style={{ fontSize: '0.875rem', color: '#52606D', marginBottom: '0.25rem' }}>
                  {profile.company_name}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', color: '#9AA5B1' }}>
                {profile.celular && (
                  <span>{formatDisplayPhoneNumber(profile.celular)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form Card */}
        <div className="amo-card amo-fade-in">
          {options ? (
            <Elements stripe={stripePromise} options={options}>
              {paymentForm}
            </Elements>
          ) : (
            paymentForm
          )}
        </div>
      </div>
    </main>
  )
}

type PaymentMethod = 'pix' | 'card'

function CheckoutForm({
  paymentIntentId,
  profile
}: {
  paymentIntentId: string | null
  profile: Profile
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { id: driverIdentifier } = useParams() as { id: string }

  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine available payment methods
  const hasPixKey = !!profile.has_pix
  const hasStripe = !!profile.has_stripe

  // Default to Pix if available, otherwise Card
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    hasPixKey ? 'pix' : 'card'
  )

  // Pix-specific state
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [showPixCode, setShowPixCode] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")

    if (value === "") {
      setAmount("")
      setAmountError(null)
      return
    }

    const numValue = parseInt(value, 10)
    if (numValue > 0) {
      setAmount(value)
      setAmountError(null)
    } else {
      setAmountError("Valor deve ser maior que zero")
    }
  }

  const formatAmount = (value: string) => {
    if (!value) return ""
    const num = parseInt(value, 10) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    const amountInCents = parseInt(amount, 10)

    if (amountInCents <= 0) {
      setAmountError("Por favor, insira um valor maior que zero.")
      return
    }

    setSubmitting(true)
    setError(null)
    setAmountError(null)

    try {
      if (paymentMethod === 'pix') {
        // Generate Pix payload
        const { generatePixPayload } = await import('@/lib/pix/generator')
        const QRCode = (await import('qrcode')).default

        // Use driver's city or default to SAO PAULO
        const merchantCity = (profile.city || 'SAO PAULO')
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .substring(0, 15) // Max 15 chars for BR Code

        const payload = generatePixPayload({
          pixKey: profile.pix_key!,
          merchantName: profile.nome || 'Motorista',
          merchantCity,
          amount: amountInCents / 100, // Convert cents to BRL
          description: profile.company_name || undefined,
        })

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1F2933',
            light: '#FFFFFF'
          }
        })

        // Create pending payment record (driver will confirm later in Lucro page)
        const pendingPaymentRes = await fetch('/api/pix/create-pending-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valor: amountInCents / 100, // Convert cents to BRL
            motorista_id: profile.id,
            pagador_info: null // Could add payer phone/email if collected
          })
        })

        if (!pendingPaymentRes.ok) {
          const errorData = await pendingPaymentRes.json()
          throw new Error(errorData.error || 'Falha ao criar registro de pagamento')
        }

        // Show the Pix code - driver will manually confirm payment later
        setPixPayload(payload)
        setPixQrCode(qrCodeDataUrl)
        setShowPixCode(true)
        setSubmitting(false)
      } else {
        // Card payment via Stripe
        if (!stripe || !elements) {
          throw new Error('Stripe não carregado')
        }

        // Update the Payment Intent with the final amount
        const updateRes = await fetch("/api/stripe/update-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId, amount: amountInCents }),
        })
        const updateData = await updateRes.json()
        if (!updateRes.ok) {
          throw new Error(updateData.error || "Erro ao atualizar valor do pagamento.")
        }

        // Confirm the payment
        const vendorName = encodeURIComponent(profile.nome || 'Vendedor')
        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url:
              typeof window !== "undefined"
                ? `${window.location.origin}/pagamento/sucesso?amount=${amountInCents}&vendor=${vendorName}`
                : undefined,
          },
        })

        if (stripeError) {
          console.error("Stripe confirmation error:", stripeError)
          throw new Error(stripeError.message || "Ocorreu um erro durante a confirmação do pagamento.")
        }
      }
    } catch (err: any) {
      console.error("Payment submission error:", err)
      setError(err.message || "Ocorreu um erro.")
      setSubmitting(false)
    }
  }

  const handleCopyPix = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload)
      alert('Código Pix copiado!')
    }
  }

  // If showing Pix code, render the Pix payment screen
  if (showPixCode && pixPayload) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '0.5rem'
          }}>
            📱 Pague com Pix
          </h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#81C995'
          }}>
            {formatAmount(amount)}
          </p>
        </div>

        {/* QR Code */}
        {pixQrCode && (
          <div style={{
            background: 'white',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            border: '2px solid #E4E7EB'
          }}>
            <img
              src={pixQrCode}
              alt="QR Code Pix"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--amo-radius-sm)'
              }}
            />
            <p style={{
              fontSize: '0.875rem',
              color: '#52606D',
              marginTop: '1rem'
            }}>
              Escaneie o QR Code com seu app do banco
            </p>
          </div>
        )}

        {/* Copia e Cola */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#1F2933',
            marginBottom: '0.5rem'
          }}>
            Ou copie o código Pix:
          </label>
          <div style={{
            background: '#F9FAFB',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            border: '2px solid #E4E7EB',
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: '#52606D',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {pixPayload}
          </div>
        </div>

        {/* Payment Instructions */}
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderRadius: 'var(--amo-radius-md)',
          padding: '1.5rem',
          border: '2px solid #93C5FD'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#1E40AF',
            marginBottom: '0.75rem'
          }}>
            📝 Como pagar:
          </h4>
          <ol style={{
            fontSize: '0.875rem',
            color: '#1E40AF',
            paddingLeft: '1.25rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            <li>Abra o app do seu banco</li>
            <li>Escaneie o QR Code ou copie o código</li>
            <li>Confirme o pagamento de {formatAmount(amount)}</li>
            <li>O recebedor será notificado automaticamente</li>
          </ol>
        </div>

        <button
          type="button"
          onClick={handleCopyPix}
          className="amo-btn amo-btn-secondary"
          style={{ width: '100%' }}
        >
          📋 Copiar Código Pix
        </button>

        <button
          type="button"
          onClick={() => {
            setShowPixCode(false)
            setPixPayload(null)
            setPixQrCode(null)
          }}
          className="amo-btn amo-btn-outline"
          style={{ width: '100%' }}
        >
          ← Voltar
        </button>

        {/* Security Badge */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: '#9AA5B1',
          fontSize: '0.875rem'
        }}>
          <span>🔒</span>
          <span>Pagamento seguro via Pix</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#1F2933',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Valor do Pagamento
        </label>
        <input
          id="amount"
          type="text"
          inputMode="numeric"
          value={formatAmount(amount)}
          onChange={handleAmountChange}
          placeholder="R$ 0,00"
          className="amo-input"
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            textAlign: 'center',
            color: '#1F2933',
            border: amountError ? '2px solid #FCA5A5' : '2px solid #E4E7EB'
          }}
          autoFocus
        />
        {amountError && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#DC2626',
            marginTop: '0.5rem'
          }}>
            ⚠️ {amountError}
          </p>
        )}
        {paymentMethod === 'card' && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9AA5B1',
            marginTop: '0.25rem'
          }}>
            Mínimo R$ 2,00 · Máximo R$ 400,00
          </p>
        )}
      </div>

      {/* Payment Method Toggle - Only show if both methods available */}
      {hasPixKey && hasStripe && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#1F2933',
            marginBottom: '0.75rem',
            textAlign: 'center'
          }}>
            Forma de Pagamento
          </label>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: '#F9FAFB',
            padding: '0.25rem',
            borderRadius: 'var(--amo-radius-md)',
            border: '2px solid #E4E7EB'
          }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--amo-radius-sm)',
                border: 'none',
                background: paymentMethod === 'pix'
                  ? 'linear-gradient(135deg, #81C995 0%, #6EE7B7 100%)'
                  : 'transparent',
                color: paymentMethod === 'pix' ? 'white' : '#52606D',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              📱 Pix
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 'var(--amo-radius-sm)',
                border: 'none',
                background: paymentMethod === 'card'
                  ? 'linear-gradient(135deg, #8B7DD8 0%, #A78BFA 100%)'
                  : 'transparent',
                color: paymentMethod === 'card' ? 'white' : '#52606D',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              💳 Cartão
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Details */}
      {paymentMethod === 'card' ? (
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#1F2933',
            marginBottom: '0.75rem'
          }}>
            {hasPixKey && hasStripe ? 'Cartão, Apple Pay ou Google Pay' : 'Forma de Pagamento'}
          </label>
          <div style={{
            background: '#F5F3FF',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            border: '2px solid #DDD6FE',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#5B21B6', fontWeight: '600', marginBottom: '0.15rem' }}>
                Pagamento seguro via Stripe
              </p>
              <p style={{ fontSize: '0.75rem', color: '#7C3AED' }}>
                Apple Pay, Google Pay ou cartão de crédito/débito
              </p>
            </div>
          </div>
          <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #D1FAE5 0%, #E8F5E9 100%)',
          borderRadius: 'var(--amo-radius-md)',
          padding: '1.5rem',
          border: '2px solid #6EE7B7'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <span style={{ fontSize: '2rem' }}>📱</span>
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#065F46',
                marginBottom: '0.25rem'
              }}>
                Pagamento via Pix
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                Rápido, seguro e sem taxas
              </p>
            </div>
          </div>
          <ul style={{
            fontSize: '0.875rem',
            color: '#047857',
            paddingLeft: '1.25rem',
            margin: 0
          }}>
            <li>Dinheiro cai na hora</li>
            <li>Disponível 24/7</li>
            <li>100% seguro pelo Banco Central</li>
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '2px solid #FCA5A5',
          borderRadius: 'var(--amo-radius-md)',
          padding: '1rem',
          color: '#991B1B',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          submitting ||
          !!amountError ||
          !amount ||
          parseInt(amount, 10) <= 0 ||
          (paymentMethod === 'card' && (!stripe || !elements))
        }
        className={paymentMethod === 'pix' ? 'amo-btn amo-btn-secondary' : 'amo-btn amo-btn-primary'}
        style={{
          width: '100%',
          fontSize: '1.125rem',
          padding: '1rem',
          opacity: (
            submitting ||
            !!amountError ||
            !amount ||
            parseInt(amount, 10) <= 0 ||
            (paymentMethod === 'card' && (!stripe || !elements))
          ) ? 0.5 : 1
        }}
      >
        {submitting ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite'
            }}></span>
            Processando...
          </span>
        ) : (
          <>
            {paymentMethod === 'pix' ? '📱 Gerar Pix' : '💳 Pagar'} {amount ? formatAmount(amount) : ""}
          </>
        )}
      </button>

      {/* Security Badge */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: '#9AA5B1',
        fontSize: '0.875rem'
      }}>
        <span>🔒</span>
        <span>
          {paymentMethod === 'pix'
            ? 'Pagamento seguro via Pix'
            : 'Pagamento seguro via Stripe'}
        </span>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  )
}
