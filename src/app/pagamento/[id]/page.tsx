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

  // Create PaymentIntent
  useEffect(() => {
    async function createIntent() {
      if (!profile?.id) return
      try {
        setLoadingIntent(true)
        setError(null)
        const res = await fetch(
          `/api/stripe/create-payment-intent?driverId=${profile.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            credentials: "include",
          }
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Erro ${res.status}: ${res.statusText}`)
        setClientSecret(json.clientSecret)
        setPaymentIntentId(json.paymentIntentId)
        if (json.ephemeralKeySecret) {
          setEphemeralKeySecret(json.ephemeralKeySecret)
        }
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

  if (!profile || !clientSecret || !paymentIntentId) {
    return null
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
    ...(ephemeralKeySecret && { customerId: session?.user?.id, ephemeralKeySecret }),
  }

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
            <div>
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
                color: '#1F2933'
              }}>
                {profile.nome || "Motorista"}
              </h2>
              {profile.celular && (
                <p style={{ fontSize: '0.875rem', color: '#9AA5B1' }}>
                  {formatDisplayPhoneNumber(profile.celular)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form Card */}
        <div className="amo-card amo-fade-in">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              paymentIntentId={paymentIntentId}
              driverName={profile.nome || "Motorista"}
            />
          </Elements>
        </div>

        {/* Security Badge */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: '#9AA5B1',
          fontSize: '0.875rem'
        }}>
          <span>🔒</span>
          <span>Pagamento seguro via Stripe</span>
        </div>
      </div>
    </main>
  )
}

function CheckoutForm({
  paymentIntentId,
  driverName
}: {
  paymentIntentId: string
  driverName: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { id: driverIdentifier } = useParams() as { id: string }

  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!stripe || !elements || !amount) return

    const amountInCents = parseInt(amount, 10)

    if (amountInCents <= 0) {
      setAmountError("Por favor, insira um valor maior que zero.")
      return
    }

    setSubmitting(true)
    setError(null)
    setAmountError(null)

    try {
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
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url:
            typeof window !== "undefined"
              ? `${window.location.origin}/pagamento/sucesso?driverId=${driverIdentifier}`
              : undefined,
        },
      })

      if (stripeError) {
        console.error("Stripe confirmation error:", stripeError)
        throw new Error(stripeError.message || "Ocorreu um erro durante a confirmação do pagamento.")
      }
    } catch (err: any) {
      console.error("Payment submission error:", err)
      setError(err.message || "Ocorreu um erro.")
      setSubmitting(false)
    }
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
      </div>

      {/* Payment Method */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#1F2933',
          marginBottom: '0.75rem'
        }}>
          Forma de Pagamento
        </label>
        <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      </div>

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
        disabled={!stripe || !elements || submitting || !!amountError || !amount || parseInt(amount, 10) <= 0}
        className="amo-btn amo-btn-secondary"
        style={{
          width: '100%',
          fontSize: '1.125rem',
          padding: '1rem',
          opacity: (!stripe || !elements || submitting || !!amountError || !amount || parseInt(amount, 10) <= 0) ? 0.5 : 1
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
          <>💳 Pagar {amount ? formatAmount(amount) : ""}</>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  )
}
