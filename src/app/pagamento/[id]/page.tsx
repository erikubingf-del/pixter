"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  loadStripe,
  StripeElementsOptions,
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js"
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import Link from "next/link"
import Image from "next/image"
import '../../../styles/amopagar-theme.css'
import { buildPathWithSearch } from "@/lib/utils/navigation"

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

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function IconShield({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function IconCheck({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconCopy({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function IconPhone({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  )
}

function IconCreditCard({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}

function IconArrowLeft({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

function IconAlert({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconQrCode({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="3" height="3"/>
      <line x1="21" y1="14" x2="21" y2="21"/>
      <line x1="17" y1="21" x2="21" y2="21"/>
    </svg>
  )
}

function IconList({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function IconSpin() {
  return (
    <span style={{
      width: '18px',
      height: '18px',
      border: '2px solid rgba(255,255,255,0.35)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'amo-spin 0.65s linear infinite',
      flexShrink: 0
    }} aria-hidden="true" />
  )
}

// ─── Logo ────────────────────────────────────────────────────────────────────

function AmoPagarLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #6C5DD3 0%, #00C9A7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(108, 93, 211, 0.30)'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F1824', letterSpacing: '-0.02em' }}>
        Amo<span style={{ color: '#6C5DD3' }}>Pagar</span>
      </span>
    </div>
  )
}

// ─── Page-level styles ───────────────────────────────────────────────────────

const PAGE_BG = '#F4F6FA'

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  border: '1px solid #E8EAF0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function PaginaPagamento() {
  const { id: driverIdentifier } = useParams() as { id: string }
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  // Fetch driver info
  useEffect(() => {
    async function fetchDriver() {
      if (!driverIdentifier) {
        setError("Identificador do motorista não encontrado na URL.")
        setLoadingIntent(false)
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
        setLoadingIntent(false)
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
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        <AmoPagarLogo />
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E8EAF0',
          borderTop: '3px solid #6C5DD3',
          borderRadius: '50%',
          animation: 'amo-spin 0.8s linear infinite'
        }} aria-label="Carregando..." role="status" />
        <style jsx>{`
          @keyframes amo-spin {
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
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{ ...cardStyle, maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', background: '#FEF3C7',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem'
          }}>
            <IconAlert size={24} color="#D97706" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F1824', marginBottom: '0.5rem' }}>
            Perfil não encontrado
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {error || "Não foi possível carregar o perfil do motorista."}
          </p>
          <Link href="/" className="amo-btn amo-btn-primary" style={{ width: '100%' }}>
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
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{ ...cardStyle, maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', background: '#FEE2E2',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem'
          }}>
            <IconAlert size={24} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F1824', marginBottom: '0.5rem' }}>
            Erro no pagamento
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>{error}</p>
          <Link href="/" className="amo-btn amo-btn-primary" style={{ width: '100%' }}>
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
      background: PAGE_BG,
      padding: '2rem 1rem 3rem'
    }}>
      <style jsx>{`
        @keyframes amo-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: '540px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <AmoPagarLogo />
          </Link>
        </div>

        {/* Driver Info Card */}
        <div className="amo-fade-in" style={{ ...cardStyle, marginBottom: '1rem', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Pagando para
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Avatar */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C5DD3 0%, #00C9A7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white',
              fontWeight: '700',
              flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 0 0 2px #E8EAF0'
            }}>
              {profile.avatar_url ? (
                <div
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${profile.avatar_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              ) : (
                profile.nome?.charAt(0).toUpperCase() || 'M'
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F1824', margin: 0 }}>
                  {profile.nome || "Motorista"}
                </h2>
                {/* Verified badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: '#EEF2FF', color: '#4F46E5',
                  fontSize: '0.7rem', fontWeight: '600', padding: '2px 7px',
                  borderRadius: '99px', letterSpacing: '0.02em'
                }}>
                  <IconCheck size={10} color="#4F46E5" />
                  Verificado
                </span>
              </div>
              {profile.company_name && (
                <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.15rem 0 0' }}>
                  {profile.company_name}
                </p>
              )}
              {profile.celular && (
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <IconPhone size={12} color="#9CA3AF" />
                  {formatDisplayPhoneNumber(profile.celular)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form Card */}
        <div
          className="amo-fade-in"
          style={{
            ...cardStyle,
            borderTop: '3px solid #6C5DD3',
            borderRadius: '0 0 16px 16px',
            padding: '2rem',
          }}
        >
          <Elements stripe={stripePromise} options={options}>
            {paymentForm}
          </Elements>
        </div>

        {/* Trust footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
            <IconShield size={13} color="#9CA3AF" />
            Pagamento seguro
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
            <IconShield size={13} color="#9CA3AF" />
            Banco Central do Brasil
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
            <IconShield size={13} color="#9CA3AF" />
            Stripe
          </span>
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
  const pathname = usePathname() || `/pagamento/${driverIdentifier}`
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletsAvailable, setWalletsAvailable] = useState(false)
  const [walletsChecked, setWalletsChecked] = useState(false)

  // Determine available payment methods
  const hasPixKey = !!profile.has_pix
  const hasStripe = !!profile.has_stripe

  // Prefer card first so Apple Pay / Google Pay appear immediately when available.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    hasStripe ? 'card' : 'pix'
  )

  // Pix-specific state
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [showPixCode, setShowPixCode] = useState(false)
  const callbackUrl = buildPathWithSearch(pathname, searchParams)
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const signupHref = `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}`

  useEffect(() => {
    if (!hasStripe && paymentMethod === 'card') {
      setPaymentMethod('pix')
      return
    }

    if (hasStripe && !hasPixKey && paymentMethod !== 'card') {
      setPaymentMethod('card')
    }
  }, [hasPixKey, hasStripe, paymentMethod])

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

  const getSuccessUrl = (amountInCents: number, intentId?: string | null) => {
    const url = new URL('/pagamento/sucesso', window.location.origin)
    url.searchParams.set('amount', amountInCents.toString())
    url.searchParams.set('vendor', encodeURIComponent(profile.nome || 'Vendedor'))

    if (intentId || paymentIntentId) {
      url.searchParams.set('payment_intent', intentId || paymentIntentId || '')
    }

    return url.toString()
  }

  const pushSuccessPage = (amountInCents: number, intentId?: string | null) => {
    const successUrl = new URL(getSuccessUrl(amountInCents, intentId))
    router.push(`${successUrl.pathname}${successUrl.search}`)
  }

  const updatePaymentIntentAmount = async (amountInCents: number) => {
    const updateRes = await fetch("/api/stripe/update-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId, amount: amountInCents }),
    })
    const updateData = await updateRes.json()

    if (!updateRes.ok) {
      throw new Error(updateData.error || "Erro ao atualizar valor do pagamento.")
    }
  }

  const confirmCardPayment = async (amountInCents: number) => {
    if (!stripe || !elements) {
      throw new Error('Stripe não carregado')
    }

    await updatePaymentIntentAmount(amountInCents)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: getSuccessUrl(amountInCents, paymentIntentId),
      },
      redirect: 'if_required',
    })

    if (result.error) {
      throw new Error(
        result.error.message || "Ocorreu um erro durante a confirmação do pagamento."
      )
    }

    if (result.paymentIntent) {
      pushSuccessPage(amountInCents, result.paymentIntent.id)
    }
  }

  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    const amountInCents = parseInt(amount, 10)

    if (!amount || amountInCents <= 0) {
      setAmountError("Digite um valor antes de confirmar o pagamento.")
      event.paymentFailed({ reason: 'fail' })
      return
    }

    setSubmitting(true)
    setError(null)
    setAmountError(null)

    try {
      await confirmCardPayment(amountInCents)
    } catch (err: any) {
      console.error("Express checkout error:", err)
      setError(err.message || "Ocorreu um erro ao iniciar o pagamento.")
      event.paymentFailed({ reason: 'fail' })
      setSubmitting(false)
      return
    }

    setSubmitting(false)
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
        await confirmCardPayment(amountInCents)
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

  // ─── Pix QR Code screen ────────────────────────────────────────────────────
  if (showPixCode && pixPayload) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F0F2F5' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Pague com Pix
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0F1824', letterSpacing: '-0.03em', margin: 0 }}>
            {formatAmount(amount)}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
            para {profile.nome || 'Motorista'}
          </p>
        </div>

        {/* QR Code */}
        {pixQrCode && (
          <div style={{
            background: '#FAFBFC',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            border: '1px solid #E8EAF0'
          }}>
            <Image
              src={pixQrCode}
              alt="QR Code Pix"
              width={260}
              height={260}
              unoptimized
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
              }}
            />
            <p style={{
              fontSize: '0.8rem',
              color: '#9CA3AF',
              marginTop: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}>
              <IconPhone size={13} color="#9CA3AF" />
              Escaneie com o app do seu banco
            </p>
          </div>
        )}

        {/* Copia e Cola */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem'
          }}>
            Ou copie o código Pix
          </label>
          <div style={{
            background: '#F8F9FB',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            border: '1px solid #E8EAF0',
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            color: '#4B5563',
            maxHeight: '96px',
            overflow: 'auto',
            lineHeight: 1.7
          }}>
            {pixPayload}
          </div>
        </div>

        {/* How to pay */}
        <div style={{
          background: '#F5F7FF',
          borderRadius: '10px',
          padding: '1.125rem 1.25rem',
          border: '1px solid #E0E4F5'
        }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#3730A3',
            marginBottom: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <IconList size={14} color="#3730A3" />
            Como pagar:
          </p>
          <ol style={{
            fontSize: '0.8rem',
            color: '#4338CA',
            paddingLeft: '1.125rem',
            margin: 0,
            lineHeight: '1.75'
          }}>
            <li>Abra o app do seu banco</li>
            <li>Escaneie o QR Code ou copie o código</li>
            <li>Confirme o pagamento de {formatAmount(amount)}</li>
            <li>Guarde o comprovante após concluir</li>
          </ol>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopyPix}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '10px',
            border: '1.5px solid #6C5DD3',
            background: 'white',
            color: '#6C5DD3',
            fontWeight: '600',
            fontSize: '0.925rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background 0.18s ease, color 0.18s ease'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6C5DD3'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#6C5DD3' }}
        >
          <IconCopy size={16} />
          Copiar código Pix
        </button>

        {/* Back button */}
        <button
          type="button"
          onClick={() => {
            setShowPixCode(false)
            setPixPayload(null)
            setPixQrCode(null)
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: '#9CA3AF',
            fontWeight: '500',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4B5563' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
        >
          <IconArrowLeft size={15} />
          Voltar
        </button>

        {/* Security badge */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          color: '#9CA3AF',
          fontSize: '0.75rem'
        }}>
          <IconShield size={13} color="#9CA3AF" />
          <span>Pagamento seguro via Pix · Banco Central do Brasil</span>
        </div>
      </div>
    )
  }

  // ─── Main checkout form ────────────────────────────────────────────────────
  const isDisabled = (
    submitting ||
    !!amountError ||
    !amount ||
    parseInt(amount, 10) <= 0 ||
    (paymentMethod === 'card' && (!stripe || !elements))
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Amount Input */}
      <div>
        <label htmlFor="amount" style={{
          display: 'block',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.625rem',
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
            fontSize: '2.25rem',
            fontWeight: '700',
            textAlign: 'center',
            color: '#0F1824',
            letterSpacing: '-0.02em',
            border: amountError ? '2px solid #FCA5A5' : '2px solid #E8EAF0',
            background: amountError ? '#FFF5F5' : '#FAFBFC',
            padding: '1rem',
            borderRadius: '12px'
          }}
          autoFocus
        />
        {amountError && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#DC2626',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}>
            <IconAlert size={14} color="#DC2626" />
            {amountError}
          </p>
        )}
        {paymentMethod === 'card' && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#9CA3AF',
            marginTop: '0.375rem'
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
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.625rem',
            textAlign: 'center'
          }}>
            Forma de Pagamento
          </label>
          <div style={{
            display: 'flex',
            gap: '0',
            background: '#F4F6FA',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #E8EAF0'
          }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: '9px',
                border: 'none',
                background: paymentMethod === 'pix' ? 'white' : 'transparent',
                color: paymentMethod === 'pix' ? '#0F1824' : '#9CA3AF',
                fontWeight: paymentMethod === 'pix' ? '600' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: paymentMethod === 'pix' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <IconPhone size={15} color={paymentMethod === 'pix' ? '#00C9A7' : '#9CA3AF'} />
              Pix
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: '9px',
                border: 'none',
                background: paymentMethod === 'card' ? 'white' : 'transparent',
                color: paymentMethod === 'card' ? '#0F1824' : '#9CA3AF',
                fontWeight: paymentMethod === 'card' ? '600' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: paymentMethod === 'card' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <IconCreditCard size={15} color={paymentMethod === 'card' ? '#6C5DD3' : '#9CA3AF'} />
              Cartão
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Details */}
      {paymentMethod === 'card' ? (
        <div>
          {status !== 'authenticated' && (
            <div style={{
              background: '#F5F7FF',
              borderRadius: '10px',
              padding: '1rem 1.125rem',
              border: '1px solid #E0E4F5',
              marginBottom: '0.75rem'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3730A3', marginBottom: '0.25rem' }}>
                Entre para pagar mais rápido
              </p>
              <p style={{ fontSize: '0.8rem', color: '#4338CA', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Voltamos você para esta cobrança e seus cartões ficam salvos com mais facilidade.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <Link href={loginHref} className="amo-btn amo-btn-outline" style={{ flex: 1, minWidth: '140px', textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  Entrar
                </Link>
                <Link href={signupHref} className="amo-btn amo-btn-primary" style={{ flex: 1, minWidth: '140px', textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  Criar conta
                </Link>
              </div>
            </div>
          )}

          {status === 'authenticated' && (
            <div style={{
              background: '#F8F9FB',
              borderRadius: '10px',
              padding: '1rem 1.125rem',
              border: '1px solid #E8EAF0',
              marginBottom: '0.75rem'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F1824', marginBottom: '0.25rem' }}>
                Conta conectada
              </p>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Use sua carteira para salvar e revisar cartões sempre com o mesmo login.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <Link href="/cliente/payment-methods" className="amo-btn amo-btn-outline" style={{ flex: 1, minWidth: '140px', textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  Meus cartões
                </Link>
                <Link href="/cliente/dashboard/historico" className="amo-btn amo-btn-outline" style={{ flex: 1, minWidth: '140px', textAlign: 'center', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  Histórico
                </Link>
              </div>
            </div>
          )}

          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.625rem'
          }}>
            {hasPixKey && hasStripe ? 'Cartão, Apple Pay ou Google Pay' : 'Forma de Pagamento'}
          </label>

          <div style={{
            background: '#F5F7FF',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            border: '1px solid #E0E4F5',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '36px', height: '36px', background: '#6C5DD3',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <IconShield size={16} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#3730A3', fontWeight: '600', margin: 0 }}>
                Pagamento seguro via Stripe
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6366F1', margin: '0.1rem 0 0' }}>
                Apple Pay, Google Pay ou cartão de crédito/débito
              </p>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '10px',
            padding: '1rem',
            border: '1px solid #E8EAF0',
            marginBottom: '0.75rem'
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.625rem'
            }}>
              Pague com um toque
            </p>
            <ExpressCheckoutElement
              options={{
                buttonHeight: 48,
                layout: { maxColumns: 2, maxRows: 1, overflow: 'auto' },
                paymentMethodOrder: ['apple_pay', 'google_pay'],
                wallets: { applePay: 'auto', googlePay: 'auto' },
              }}
              onClick={(event) =>
                event.resolve({
                  business: { name: 'AmoPagar' },
                  emailRequired: !session?.user?.email,
                })
              }
              onReady={(event: StripeExpressCheckoutElementReadyEvent) => {
                setWalletsChecked(true)
                setWalletsAvailable(
                  Boolean(
                    event.availablePaymentMethods?.applePay ||
                      event.availablePaymentMethods?.googlePay
                  )
                )
              }}
              onConfirm={handleExpressCheckoutConfirm}
            />
            <p style={{
              fontSize: '0.75rem',
              color: walletsChecked && walletsAvailable ? '#059669' : '#9CA3AF',
              marginTop: '0.625rem'
            }}>
              {walletsChecked && walletsAvailable
                ? 'Apple Pay e Google Pay estão prontos neste dispositivo.'
                : 'Apple Pay e Google Pay aparecem automaticamente em dispositivos e navegadores compatíveis.'}
            </p>
          </div>
          <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
        </div>
      ) : (
        <div style={{
          background: '#F0FDF9',
          borderRadius: '10px',
          padding: '1.125rem 1.25rem',
          border: '1px solid #A7F3D0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.625rem'
          }}>
            <div style={{
              width: '36px', height: '36px', background: '#00C9A7',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <IconPhone size={18} color="white" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#065F46', margin: 0 }}>
                Pagamento via Pix
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#059669', margin: '0.1rem 0 0' }}>
                Rápido, seguro e sem taxas
              </p>
            </div>
          </div>
          <ul style={{
            fontSize: '0.8rem',
            color: '#047857',
            paddingLeft: '1.125rem',
            margin: 0,
            lineHeight: '1.75'
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
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderLeft: '3px solid #DC2626',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          color: '#991B1B',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <IconAlert size={16} color="#DC2626" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '12px',
          border: 'none',
          background: isDisabled
            ? '#E8EAF0'
            : paymentMethod === 'pix'
              ? '#00C9A7'
              : '#6C5DD3',
          color: isDisabled ? '#9CA3AF' : 'white',
          fontWeight: '700',
          fontSize: '1rem',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease',
          boxShadow: isDisabled
            ? 'none'
            : paymentMethod === 'pix'
              ? '0 4px 14px rgba(0, 201, 167, 0.35)'
              : '0 4px 14px rgba(108, 93, 211, 0.35)',
          letterSpacing: '-0.01em'
        }}
        onMouseEnter={e => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = paymentMethod === 'pix'
              ? '0 6px 20px rgba(0, 201, 167, 0.40)'
              : '0 6px 20px rgba(108, 93, 211, 0.40)'
          }
        }}
        onMouseLeave={e => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = paymentMethod === 'pix'
              ? '0 4px 14px rgba(0, 201, 167, 0.35)'
              : '0 4px 14px rgba(108, 93, 211, 0.35)'
          }
        }}
      >
        {submitting ? (
          <>
            <IconSpin />
            Processando...
          </>
        ) : (
          <>
            {paymentMethod === 'pix'
              ? <><IconQrCode size={18} /> Gerar Pix</>
              : <><IconCreditCard size={18} /> Pagar</>
            }
            {amount ? ` · ${formatAmount(amount)}` : ""}
          </>
        )}
      </button>

      {/* Security Badge */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        color: '#9CA3AF',
        fontSize: '0.75rem'
      }}>
        <IconShield size={13} color="#9CA3AF" />
        <span>
          {paymentMethod === 'pix'
            ? 'Pagamento seguro · Pix pelo Banco Central'
            : 'Pagamento criptografado · Stripe'}
        </span>
      </div>

    </form>
  )
}
