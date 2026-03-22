'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import '../../styles/amopagar-theme.css'
import { sanitizeInternalCallbackUrl } from '@/lib/utils/navigation'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = sanitizeInternalCallbackUrl(
    searchParams.get('callbackUrl'),
    '/auth/post-login'
  )
  const callbackUrlParam = `?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const driverSignupHref = `/cadastro?mode=driver&callbackUrl=${encodeURIComponent(callbackUrl)}`

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const completeLogin = (url?: string | null) => {
    router.push(url || callbackUrl)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      setError('')

      const result = await signIn('email-password', {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      })

      if (result?.error) {
        if (
          result.error.includes('CredentialsSignin') ||
          result.error.includes('inválidos')
        ) {
          setError('Email ou senha incorretos')
        } else {
          setError(result.error || 'Falha ao fazer login')
        }
        setLoading(false)
        return
      }

      completeLogin(result?.url)
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setError('Ocorreu um erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      await signIn('google', { callbackUrl })
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err)
      setError('Ocorreu um erro ao fazer login com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="amo-auth-page">
      <div className="amo-auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/"
            className="amopagar-logo"
            style={{ justifyContent: 'center', marginBottom: '1.5rem', display: 'flex' }}
          >
            <div className="amopagar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="amopagar-logo-text">AmoPagar</span>
          </Link>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1F2933',
              marginBottom: '0.5rem',
            }}
          >
            Bem-vindo de volta
          </h2>
          <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
            Clientes e comerciantes usam o mesmo login. Se sua conta tiver acesso de
            comerciante, vamos te levar direto para a área certa.
          </p>
        </div>

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
            gap: '0.75rem',
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

        <div className="amo-divider" style={{ margin: '1.5rem 0' }}>
          <span>ou entre com email</span>
        </div>

        {error && (
          <div
            style={{
              background: '#FEE2E2',
              border: '2px solid #FCA5A5',
              borderRadius: 'var(--amo-radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#991B1B',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleEmailLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem',
              }}
            >
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
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem',
              }}
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="amo-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="amo-btn amo-btn-secondary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #E4E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
            fontSize: '0.875rem',
          }}
        >
          <p style={{ color: '#52606D' }}>
            Nao tem uma conta?{' '}
            <Link
              href={`/cadastro${callbackUrlParam}`}
              style={{
                color: '#6C5DD3',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Criar conta
            </Link>
          </p>
          <p style={{ color: '#52606D' }}>
            Vai receber pagamentos?{' '}
            <Link
              href={driverSignupHref}
              style={{
                color: '#00C9A7',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Criar conta de comerciante
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
