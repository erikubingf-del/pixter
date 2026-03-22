'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import '../../styles/amopagar-theme.css'

interface Profile {
  id: string
  nome: string
  email: string | null
  celular: string | null
  cpf: string | null
  tipo: 'cliente' | 'motorista'
  stripe_account_id: string | null
  pix_key: string | null
  avatar_url: string | null
  company_name: string | null
  address: string | null
  city: string | null
  stripe_account_status: string | null
  can_use_driver_view?: boolean
  stripe_ready?: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    company_name: '',
    address: '',
    city: '',
    pix_key: '',
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== 'authenticated') return

      try {
        setLoading(true)
        const res = await fetch('/api/profile')

        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile)
          setFormData({
            nome: data.profile.nome || '',
            company_name: data.profile.company_name || '',
            address: data.profile.address || '',
            city: data.profile.city || '',
            pix_key: data.profile.pix_key || '',
          })
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err)
        setError('Falha ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [status])

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await res.json()
      setProfile(data.profile)
      setSuccess('✅ Perfil atualizado com sucesso!')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError('Falha ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleActivateDriver = () => {
    router.push('/motorista/cadastro')
  }

  // Connect Stripe
  const handleConnectStripe = async () => {
    try {
      setSaving(true)
      setError('')

      const res = await fetch('/api/stripe/connect-account', {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('Failed to create Stripe connect account')
      }

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Error connecting Stripe:', err)
      setError('Falha ao conectar Stripe')
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
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

  if (!session || !profile) {
    return null
  }

  const isDriver = Boolean(profile.can_use_driver_view || profile.tipo === 'motorista')
  const isStripeConnected = Boolean(isDriver && profile.stripe_ready)
  const backHref = isDriver ? '/motorista/dashboard/overview' : '/cliente/dashboard'

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#1F2933',
              marginBottom: '0.25rem'
            }}>
              ⚙️ Configurações
            </h1>
            <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
              Gerencie seu perfil e preferências
            </p>
          </div>
          <Link href={backHref} className="amo-btn amo-btn-outline">
            ← Voltar ao Dashboard
          </Link>
        </div>

        {/* Success Message */}
        {success && (
          <div className="amo-fade-in" style={{
            background: '#D1FAE5',
            border: '2px solid #6EE7B7',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#065F46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="amo-fade-in" style={{
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

        {/* Profile Information Card */}
        <div className="amo-card amo-fade-in" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1.5rem'
          }}>
            👤 Informações do Perfil
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="nome" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Nome completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                className="amo-input"
                placeholder="Seu nome completo"
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
                Email {profile.email ? '' : '/ Celular'}
              </label>
              <input
                id="email"
                type="text"
                value={profile.email || profile.celular || ''}
                disabled
                className="amo-input"
                style={{
                  background: '#F9FAFB',
                  cursor: 'not-allowed',
                  color: '#9AA5B1'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#9AA5B1',
                marginTop: '0.25rem'
              }}>
                Não é possível alterar o email/celular
              </p>
            </div>

            <div>
              <label htmlFor="company_name" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Nome da empresa (para recibos)
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                className="amo-input"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label htmlFor="city" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Cidade
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="amo-input"
                placeholder="Ex: São Paulo"
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#9AA5B1',
                marginTop: '0.25rem'
              }}>
                Usado para pagamentos Pix
              </p>
            </div>

            <div>
              <label htmlFor="address" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Endereço completo
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="amo-input"
                placeholder="Opcional"
                rows={3}
                style={{
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Pix Key (only for drivers) */}
            {isDriver && (
              <div>
                <label htmlFor="pix_key" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1F2933',
                  marginBottom: '0.5rem'
                }}>
                  📱 Chave Pix (para receber pagamentos)
                </label>
                <input
                  id="pix_key"
                  name="pix_key"
                  type="text"
                  value={formData.pix_key}
                  onChange={handleChange}
                  className="amo-input"
                  placeholder="CPF, celular, email ou chave aleatória"
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: '#9AA5B1',
                  marginTop: '0.25rem'
                }}>
                  {profile?.cpf && `Sugestão: Use seu CPF (${profile.cpf})`}
                  {!profile?.cpf && profile?.celular && `Sugestão: Use seu celular (${profile.celular})`}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="amo-btn amo-btn-primary"
              style={{ width: '100%' }}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Account Type Card */}
        <div className="amo-card amo-fade-in" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1.5rem'
          }}>
            🔄 Tipo de Conta
          </h2>

          <div style={{
            background: '#F9FAFB',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#52606D',
              marginBottom: '0.5rem'
            }}>
              Sua conta atual:
            </p>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#1F2933'
            }}>
              {isDriver ? '🚗 Cliente + Motorista/Vendedor' : '💳 Cliente'}
            </p>
          </div>

          {isDriver ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <Link href="/cliente/dashboard" className="amo-btn amo-btn-outline" style={{ textAlign: 'center' }}>
                  Abrir Área do Cliente
                </Link>
                <Link href="/motorista/dashboard/overview" className="amo-btn amo-btn-secondary" style={{ textAlign: 'center' }}>
                  Abrir Área do Motorista
                </Link>
              </div>

              {/* Stripe Section */}
              <div style={{
                background: isStripeConnected ? '#D1FAE5' : '#FEE2E2',
                border: `2px solid ${isStripeConnected ? '#6EE7B7' : '#FCA5A5'}`,
                borderRadius: 'var(--amo-radius-md)',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#1F2933'
                  }}>
                    Stripe
                  </h3>
                  <span style={{ fontSize: '1.5rem' }}>
                    {isStripeConnected ? '✅' : '⚠️'}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: isStripeConnected ? '#065F46' : '#991B1B',
                  marginBottom: '1rem'
                }}>
                  {isStripeConnected
                    ? 'Sua conta Stripe está pronta e seu link de pagamento pode operar.'
                    : 'Seu link de pagamento fica bloqueado até a Stripe liberar a conta para cobrar e repassar.'}
                </p>
                {!isStripeConnected && (
                  <button
                    onClick={handleConnectStripe}
                    disabled={saving}
                    className="amo-btn amo-btn-secondary"
                    style={{ width: '100%' }}
                  >
                    {saving ? 'Conectando...' : 'Conectar Stripe Agora'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Become a Driver */}
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#52606D',
                  marginBottom: '1rem'
                }}>
                  Quer receber pagamentos com o mesmo login?
                </p>
                <button
                  onClick={handleActivateDriver}
                  disabled={saving}
                  className="amo-btn amo-btn-secondary"
                  style={{ width: '100%' }}
                >
                  🚗 Tornar-se Motorista/Vendedor
                </button>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#52606D',
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}>
                  Você continuará com sua área de cliente e ativará uma área de motorista com onboarding + Stripe Connect.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
