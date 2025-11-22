'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import '../../../styles/amopagar-theme.css'

interface Payment {
  id: string
  created_at: string
  valor: number
  metodo: string | null
  receipt_number: string
  receipt_pdf_url: string | null
  receipt_url: string | null
  is_business_expense: boolean
  motorista: {
    nome: string
  } | null
}

interface Profile {
  tipo: 'cliente' | 'motorista'
  stripe_account_id: string | null
  pix_key: string | null
  celular: string | null
}

interface StripeStatus {
  connected: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
  }
}

export default function UnifiedDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [payments, setPayments] = useState<Payment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch profile and payments
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return

      try {
        setLoading(true)
        setError('')

        // Fetch profile
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setProfile(profileData.profile)
        }

        // Fetch recent payments
        const paymentsRes = await fetch('/api/client/payments')
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json()
          setPayments(paymentsData.payments?.slice(0, 5) || [])
        }

        // Fetch Stripe status if driver
        if (profileData.profile?.tipo === 'motorista') {
          const stripeRes = await fetch('/api/stripe/status')
          if (stripeRes.ok) {
            const stripeData = await stripeRes.json()
            setStripeStatus(stripeData)
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status])

  // Generate QR Code
  const generateQRCode = async () => {
    if (!profile?.celular) return

    try {
      const QRCode = (await import('qrcode')).default
      const paymentUrl = `${window.location.origin}/${profile.celular}`
      const qrDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1F2933',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrDataUrl)
      setShowQRCode(true)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  // Toggle business expense
  const toggleBusinessExpense = async (paymentId: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/receipts/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_business_expense: !currentValue })
      })

      if (res.ok) {
        setPayments(prev => prev.map(p =>
          p.id === paymentId
            ? { ...p, is_business_expense: !currentValue }
            : p
        ))
      }
    } catch (err) {
      console.error('Error toggling business expense:', err)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  // Copy payment link
  const copyPaymentLink = () => {
    if (!profile?.celular) return
    const link = `${window.location.origin}/${profile.celular}`
    navigator.clipboard.writeText(link)
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

  if (!session) {
    return null
  }

  const isDriver = profile?.tipo === 'motorista'
  const isStripeConnected = isDriver && profile?.stripe_account_id

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
      padding: '2rem 1rem'
    }}>
      <div className="amo-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              👋 Olá, {session.user?.name?.split(' ')[0] || 'Cliente'}!
            </h1>
            <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
              {isDriver ? 'Gerencie pagamentos e receba vendas' : 'Acompanhe seus pagamentos'}
            </p>
          </div>
          <Link href="/settings" className="amo-btn amo-btn-outline">
            ⚙️ Configurações
          </Link>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Payment History Card */}
          <div className="amo-card amo-fade-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1F2933'
              }}>
                💳 Últimos Pagamentos
              </h2>
              <Link href="/cliente/dashboard/historico" style={{
                color: '#8B7DD8',
                fontSize: '0.875rem',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Ver todos →
              </Link>
            </div>

            {payments.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#9AA5B1'
              }}>
                <p>Nenhum pagamento ainda</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {payments.map((payment) => (
                  <div key={payment.id} style={{
                    padding: '1rem',
                    background: '#F9FAFB',
                    borderRadius: 'var(--amo-radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{
                        fontWeight: '600',
                        color: '#1F2933',
                        marginBottom: '0.25rem'
                      }}>
                        {formatCurrency(payment.valor)}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#52606D' }}>
                        {payment.motorista?.nome || 'Vendedor'} • {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: '1.5rem' }}>
                      {payment.metodo === 'pix' ? '📱' : '💳'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receipts Card */}
          <div className="amo-card amo-fade-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1F2933'
              }}>
                📄 Meus Comprovantes
              </h2>
            </div>

            {payments.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: '#9AA5B1'
              }}>
                <p>Sem comprovantes</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} style={{
                      padding: '1rem',
                      background: '#F9FAFB',
                      borderRadius: 'var(--amo-radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={payment.is_business_expense || false}
                        onChange={() => toggleBusinessExpense(payment.id, payment.is_business_expense)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#8B7DD8',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1F2933'
                        }}>
                          {payment.receipt_number}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#52606D' }}>
                          {payment.is_business_expense ? '💼 Negócio' : '🏠 Pessoal'}
                        </p>
                      </div>
                      <a
                        href={`/api/receipts/${payment.receipt_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem',
                          color: '#8B7DD8',
                          fontSize: '1.25rem',
                          textDecoration: 'none'
                        }}
                      >
                        ⬇️
                      </a>
                    </div>
                  ))}
                </div>

                <button
                  className="amo-btn amo-btn-outline"
                  style={{ width: '100%' }}
                  onClick={() => router.push('/cliente/dashboard/historico')}
                >
                  📦 Exportar todos PDFs
                </button>
              </>
            )}
          </div>

          {/* Saved Cards Card */}
          <div className="amo-card amo-fade-in">
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#1F2933',
              marginBottom: '1.5rem'
            }}>
              💾 Cartões Salvos
            </h2>

            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#9AA5B1',
              marginBottom: '1rem'
            }}>
              <p>Nenhum cartão salvo ainda</p>
            </div>

            <button
              className="amo-btn amo-btn-outline"
              style={{ width: '100%' }}
            >
              ➕ Adicionar cartão
            </button>
          </div>
        </div>

        {/* Driver-Specific Section */}
        {isDriver && (
          <div className="amo-fade-in" style={{ marginTop: '2rem' }}>
            <div className="amo-card" style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #D4FC79 100%)',
              border: `2px solid ${isStripeConnected ? '#81C995' : '#FCA5A5'}`
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#1F2933',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🚗 Recursos do Motorista
              </h2>

              {/* Payment Link Section */}
              <div style={{
                background: 'white',
                borderRadius: 'var(--amo-radius-md)',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1F2933',
                  marginBottom: '1rem'
                }}>
                  🔗 Meu Link de Pagamento
                </h3>

                {isStripeConnected ? (
                  <>
                    <div style={{
                      background: '#F9FAFB',
                      padding: '1rem',
                      borderRadius: 'var(--amo-radius-md)',
                      marginBottom: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: '#1F2933',
                      wordBreak: 'break-all'
                    }}>
                      {window.location.origin}/{profile.celular}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem'
                    }}>
                      <button
                        onClick={copyPaymentLink}
                        className="amo-btn amo-btn-secondary"
                      >
                        📋 Copiar Link
                      </button>
                      <button
                        onClick={generateQRCode}
                        className="amo-btn amo-btn-secondary"
                      >
                        📱 Ver QR Code
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      background: '#FEE2E2',
                      border: '2px solid #FCA5A5',
                      borderRadius: 'var(--amo-radius-md)',
                      padding: '1rem',
                      marginBottom: '1rem',
                      color: '#991B1B',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>🔒</span>
                      <span>Conecte sua conta Stripe para ativar seu link de pagamento</span>
                    </div>

                    <Link
                      href="/settings"
                      className="amo-btn amo-btn-secondary"
                      style={{ width: '100%' }}
                    >
                      Conectar Stripe Agora →
                    </Link>
                  </>
                )}
              </div>

              {/* Stripe Alerts */}
              <div style={{
                background: stripeStatus?.connected
                  ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                    ? 'linear-gradient(135deg, #D1FAE5 0%, #E8F5E9 100%)'
                    : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)')
                  : 'white',
                borderRadius: 'var(--amo-radius-md)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: stripeStatus?.connected
                  ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                    ? '2px solid #10B981'
                    : '2px solid #F59E0B')
                  : '2px solid #E4E7EB'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1F2933',
                  marginBottom: '1rem'
                }}>
                  {stripeStatus?.connected
                    ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                      ? '✅ Status da Conta'
                      : '⚠️ Ação Necessária')
                    : '⚠️ Alertas da Conta'}
                </h3>

                {stripeStatus?.connected ? (
                  <>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>{stripeStatus.charges_enabled ? '✅' : '❌'}</span>
                        <span style={{ color: '#52606D' }}>
                          {stripeStatus.charges_enabled ? 'Receber pagamentos' : 'Pagamentos desabilitados'}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>{stripeStatus.payouts_enabled ? '✅' : '❌'}</span>
                        <span style={{ color: '#52606D' }}>
                          {stripeStatus.payouts_enabled ? 'Saques habilitados' : 'Saques desabilitados'}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>{stripeStatus.details_submitted ? '✅' : '⏳'}</span>
                        <span style={{ color: '#52606D' }}>
                          {stripeStatus.details_submitted ? 'Cadastro completo' : 'Dados pendentes'}
                        </span>
                      </div>
                    </div>

                    {stripeStatus.requirements && (
                      stripeStatus.requirements.currently_due.length > 0 ||
                      stripeStatus.requirements.past_due.length > 0
                    ) && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--amo-radius-md)',
                        padding: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#DC2626',
                          marginBottom: '0.5rem'
                        }}>
                          Pendências detectadas:
                        </p>
                        <ul style={{
                          fontSize: '0.75rem',
                          color: '#991B1B',
                          paddingLeft: '1.25rem',
                          margin: 0
                        }}>
                          {[...stripeStatus.requirements.past_due, ...stripeStatus.requirements.currently_due].slice(0, 2).map((req, idx) => (
                            <li key={idx}>{req.replace(/_/g, ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link
                      href="/settings"
                      style={{
                        color: '#8B7DD8',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      Gerenciar Conta Stripe →
                    </Link>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <span>⚠️</span>
                      <span style={{ color: '#52606D' }}>Stripe não conectado</span>
                    </div>

                    <Link
                      href="/settings"
                      style={{
                        color: '#8B7DD8',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      Conectar Stripe →
                    </Link>
                  </div>
                )}
              </div>

              {/* Pix Status Card */}
              <div style={{
                background: profile.pix_key
                  ? 'linear-gradient(135deg, #D1FAE5 0%, #E8F5E9 100%)'
                  : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                borderRadius: 'var(--amo-radius-md)',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: profile.pix_key
                  ? '2px solid #10B981'
                  : '2px solid #F59E0B'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1F2933',
                  marginBottom: '1rem'
                }}>
                  {profile.pix_key ? '✅ Pix Configurado' : '⚠️ Configure seu Pix'}
                </h3>

                {profile.pix_key ? (
                  <>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>✅</span>
                        <span style={{ color: '#52606D' }}>
                          Recebimento via Pix ativo
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>📱</span>
                        <span style={{ color: '#52606D', fontFamily: 'monospace' }}>
                          {profile.pix_key}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <span>💰</span>
                        <span style={{ color: '#52606D' }}>
                          Sem taxas! Receba 100% do valor
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      style={{
                        color: '#8B7DD8',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }}
                    >
                      Alterar Chave Pix →
                    </Link>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#92400E',
                      marginBottom: '1rem'
                    }}>
                      Configure sua chave Pix para receber pagamentos instantâneos sem taxas!
                    </p>

                    <div style={{
                      background: 'rgba(252, 211, 77, 0.2)',
                      borderRadius: 'var(--amo-radius-md)',
                      padding: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#92400E',
                        marginBottom: '0.5rem'
                      }}>
                        💡 Vantagens do Pix:
                      </p>
                      <ul style={{
                        fontSize: '0.75rem',
                        color: '#92400E',
                        paddingLeft: '1.25rem',
                        margin: 0
                      }}>
                        <li>Receba 100% do valor (sem taxas!)</li>
                        <li>Dinheiro cai na hora</li>
                        <li>Disponível 24/7</li>
                      </ul>
                    </div>

                    <Link
                      href="/settings"
                      className="amo-btn amo-btn-secondary"
                      style={{ display: 'inline-block' }}
                    >
                      Configurar Pix Agora →
                    </Link>
                  </>
                )}
              </div>

              {/* Lucro Analytics Link */}
              <Link
                href="/motorista/lucro"
                style={{
                  display: 'block',
                  background: 'white',
                  borderRadius: 'var(--amo-radius-md)',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  border: '2px solid #81C995',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(129, 201, 149, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>💰</span>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#1F2933',
                        marginBottom: '0.25rem'
                      }}>
                        Ver Meu Lucro
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#52606D' }}>
                        Estatísticas, gráficos e análises
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.5rem', color: '#81C995' }}>→</span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <div
            onClick={() => setShowQRCode(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: 'var(--amo-radius-lg)',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
              }}
            >
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#1F2933'
              }}>
                📱 Mostre este QR Code
              </h3>
              <p style={{
                color: '#52606D',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                O cliente pode escanear para fazer o pagamento
              </p>
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code de Pagamento"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    marginBottom: '1.5rem'
                  }}
                />
              )}
              <button
                onClick={() => setShowQRCode(false)}
                className="amo-btn amo-btn-secondary"
                style={{ width: '100%' }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
