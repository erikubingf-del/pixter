'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession, signOut } from 'next-auth/react'
import '../../styles/amopagar-theme.css'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/cliente/dashboard"
  const { data: session, status } = useSession()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      setError("")

      if (status === "authenticated" && session?.user?.tipo === "motorista") {
        await signOut({ redirect: false })
      }

      const result = await signIn("email-password", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl
      })

      if (result?.error) {
        if (result.error.includes("CredentialsSignin") || result.error.includes("inválidos")) {
          setError("Email ou senha incorretos")
        } else {
          setError(result.error || "Falha ao fazer login")
        }
        setLoading(false)
        return
      }

      if (result?.url) {
        router.push(result.url)
      } else {
        router.push(callbackUrl)
      }

    } catch (err) {
      console.error("Erro ao fazer login:", err)
      setError("Ocorreu um erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError("")

      if (status === "authenticated" && session?.user?.tipo === "motorista") {
        await signOut({ redirect: false })
      }

      await signIn("google", { callbackUrl })

    } catch (err) {
      console.error("Erro ao fazer login com Google:", err)
      setError("Ocorreu um erro ao fazer login com Google. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="amo-card amo-fade-in" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '3rem'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#8B7DD8' }}>Amo</span>
              <span style={{ color: '#81C995' }}>Pagar</span>
            </h1>
          </Link>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '0.5rem'
          }}>
            Bem-vindo de volta!
          </h2>
          <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
            Entre na sua conta de cliente
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="amo-btn amo-btn-primary"
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
            <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="white"/>
            <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="white"/>
            <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="white"/>
            <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="white"/>
          </svg>
          Continuar com Google
        </button>

        {/* Divider */}
        <div style={{
          position: 'relative',
          margin: '2rem 0',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            background: '#E4E7EB'
          }}></div>
          <span style={{
            position: 'relative',
            background: 'white',
            padding: '0 1rem',
            color: '#9AA5B1',
            fontSize: '0.875rem'
          }}>
            ou entre com email
          </span>
        </div>

        {/* Error Message */}
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
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}></span>
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #E4E7EB',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center',
          fontSize: '0.875rem'
        }}>
          <p style={{ color: '#52606D' }}>
            Não tem uma conta?{' '}
            <Link href="/cadastro" style={{
              color: '#8B7DD8',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Criar conta
            </Link>
          </p>
          <p style={{ color: '#52606D' }}>
            É motorista?{' '}
            <Link href="/motorista/login" style={{
              color: '#81C995',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Acesse aqui
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
