'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import '../../styles/amopagar-theme.css'
import { sanitizeInternalCallbackUrl } from '@/lib/utils/navigation'

export default function ClientSignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signupMode = searchParams.get('mode') === 'driver' ? 'motorista' : 'cliente'
  const isDriverSignup = signupMode === 'motorista'
  const callbackUrl = sanitizeInternalCallbackUrl(
    searchParams.get('callbackUrl'),
    '/auth/post-login'
  )
  const callbackUrlParam = `?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const driverSignupHref = `/cadastro?mode=driver&callbackUrl=${encodeURIComponent(callbackUrl)}`

  const pageCopy = useMemo(
    () =>
      isDriverSignup
        ? {
            title: 'Crie sua conta para receber pagamentos',
            subtitle:
              'Use o mesmo login para a área do cliente e para ativar sua operação como motorista ou vendedor.',
            submit: 'Criar conta de motorista',
            alternateCtaLabel: 'Vai apenas pagar?',
            alternateCtaHref: `/cadastro${callbackUrlParam}`,
            alternateCtaText: 'Criar conta de cliente',
          }
        : {
            title: 'Crie sua conta',
            subtitle: 'Comece a pagar de forma simples e segura',
            submit: 'Criar conta',
            alternateCtaLabel: 'Vai receber pagamentos?',
            alternateCtaHref: driverSignupHref,
            alternateCtaText: 'Crie sua conta de motorista',
          },
    [callbackUrlParam, driverSignupHref, isDriverSignup]
  )

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!termsAccepted) {
      setError('Você precisa aceitar os Termos de Uso e Política de Privacidade')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/auth/signup-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          accountType: signupMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta')
      }

      if (data.success === true && data.message && data.message.includes('Um novo email de confirmação foi enviado')) {
        setSuccessMessage(data.message)
      }

      router.push(
        `/cadastro/confirmacao-pendente?email=${encodeURIComponent(formData.email)}&mode=${signupMode}`
      )
    } catch (err: any) {
      console.error('Erro ao criar conta:', err)

      if (err.message.includes('already registered') || err.message.includes('já registrado')) {
        setError('Este email já está cadastrado. Tente fazer login ou use outro email.')
      } else {
        setError(err.message || 'Falha ao criar conta')
      }

      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isDriverSignup) {
      setError('Cadastro de motorista com Google ainda não está habilitado. Use email e senha para ativar a área de motorista.')
      return
    }

    try {
      setLoading(true)
      setError('')
      await signIn('google', { callbackUrl })
    } catch (err: any) {
      console.error('Erro ao fazer login com Google:', err)
      setError('Falha ao fazer login com Google')
      setLoading(false)
    }
  }

  return (
    <main className="amo-auth-page">
      <div className="amo-auth-card" style={{ maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="amopagar-logo" style={{ justifyContent: 'center', marginBottom: '1.5rem', display: 'flex' }}>
            <div className="amopagar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="amopagar-logo-text">AmoPagar</span>
          </Link>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '0.5rem'
          }}>
            {pageCopy.title}
          </h2>
          <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
            {pageCopy.subtitle}
          </p>
        </div>

        {!isDriverSignup && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="amo-btn amo-btn-google"
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="white" />
              <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="white" />
              <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="white" />
              <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="white" />
            </svg>
            Continuar com Google
          </button>
        )}

        {!isDriverSignup && (
          <div className="amo-divider" style={{ margin: '1.5rem 0' }}>
            <span>ou cadastre-se com email</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '2px solid #FCA5A5',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#991B1B',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#DBEAFE',
            border: '2px solid #93C5FD',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#1E40AF',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1F2933',
              marginBottom: '0.5rem'
            }}>
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome completo"
              className="amo-input"
            />
          </div>

          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1F2933',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="amo-input"
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1F2933',
              marginBottom: '0.5rem'
            }}>
              Senha (mínimo 8 caracteres)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="amo-input"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#9AA5B1'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1F2933',
              marginBottom: '0.5rem'
            }}>
              Confirmar senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="amo-input"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#9AA5B1'
                }}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: '0.25rem' }}
            />
            <label htmlFor="terms" style={{ color: '#52606D', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Aceito os{' '}
              <Link href="/termos" style={{ color: '#6C5DD3', textDecoration: 'none', fontWeight: 600 }}>
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" style={{ color: '#6C5DD3', textDecoration: 'none', fontWeight: 600 }}>
                Política de Privacidade
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="amo-btn amo-btn-secondary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Criando conta…' : pageCopy.submit}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#52606D', fontSize: '0.95rem' }}>
          Já tem uma conta?{' '}
          <Link href={`/login${callbackUrlParam}`} style={{ color: '#6C5DD3', textDecoration: 'none', fontWeight: 600 }}>
            Fazer login
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#52606D', fontSize: '0.95rem' }}>
          {pageCopy.alternateCtaLabel}{' '}
          <Link href={pageCopy.alternateCtaHref} style={{ color: '#00C9A7', textDecoration: 'none', fontWeight: 700 }}>
            {pageCopy.alternateCtaText}
          </Link>
        </div>
      </div>
    </main>
  )
}
