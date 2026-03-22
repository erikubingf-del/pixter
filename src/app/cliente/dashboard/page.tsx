'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import '../../../styles/amopagar-theme.css'
import { formatCentsToBrl } from '@/lib/utils/payment'

type Payment = {
  id: string
  created_at: string
  valor: number
  metodo: string | null
  status: string
  motorista: {
    nome: string
  } | null
}

type Profile = {
  nome: string | null
  can_use_driver_view?: boolean
}

const quickActions = [
  {
    href: '/cliente/dashboard/historico',
    title: 'Histórico',
    description: 'Veja todos os pagamentos e comprovantes.',
    icon: (
      <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/cliente/payment-methods',
    title: 'Meus cartões',
    description: 'Gerencie os cartões salvos para pagar mais rápido.',
    icon: (
      <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    href: '/settings',
    title: 'Configurações',
    description: 'Atualize seus dados e preferências da conta.',
    icon: (
      <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function ClienteDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [router, status])

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return

      try {
        setLoading(true)
        setError('')

        const [profileRes, paymentsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/client/payments'),
        ])

        if (!profileRes.ok || !paymentsRes.ok) {
          throw new Error('Não foi possível carregar seu painel.')
        }

        const profileData = await profileRes.json()
        const paymentsData = await paymentsRes.json()

        setProfile(profileData.profile)
        setPayments((paymentsData.payments || []).slice(0, 4))
      } catch (err: any) {
        console.error('Error loading client dashboard:', err)
        setError(err.message || 'Erro ao carregar painel')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#F5F6FA',
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

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F6FA',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
        <div className="amo-card amo-fade-in">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#52606D', marginBottom: '0.35rem' }}>
                Área do cliente
              </p>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#1F2933',
                marginBottom: '0.35rem'
              }}>
                Olá, {(profile?.nome || session.user?.name || 'Cliente').split(' ')[0]}
              </h1>
              <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
                Seus comprovantes, cartões e configurações em um só lugar.
              </p>
            </div>
            <Link href="/settings" className="amo-btn amo-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configurações
            </Link>
          </div>
        </div>

        {profile?.can_use_driver_view && (
          <div className="amo-card amo-fade-in" style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
            border: '2px solid #C4B5FD'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#4338CA', marginBottom: '0.35rem' }}>
              Conta com área de comerciante ativa
            </p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2933', marginBottom: '0.5rem' }}>
              Alterne para receber pagamentos e ver analytics
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#4C1D95', marginBottom: '1rem' }}>
              Sua área do cliente continua separada. Quando quiser receber, use a visão de comerciante.
            </p>
            <Link href="/motorista/dashboard/overview" className="amo-btn amo-btn-secondary">
              Abrir área do comerciante
            </Link>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="amo-card amo-fade-in"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '40px', height: '40px', background: '#F5F3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                {action.icon}
              </div>
              <p style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#1F2933', marginBottom: '0.25rem' }}>
                {action.title}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#52606D', lineHeight: '1.5' }}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="amo-card amo-fade-in">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2933', marginBottom: '0.25rem' }}>
                Pagamentos recentes
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#52606D' }}>
                Os últimos comprovantes pagos com sua conta.
              </p>
            </div>
            <Link href="/cliente/dashboard/historico" className="amo-btn amo-btn-outline">
              Ver histórico completo
            </Link>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '2px solid #FCA5A5',
              borderRadius: 'var(--amo-radius-md)',
              padding: '1rem',
              color: '#991B1B',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {!error && payments.length === 0 && (
            <div style={{
              background: '#F9FAFB',
              borderRadius: 'var(--amo-radius-md)',
              padding: '1.5rem',
              color: '#52606D',
              fontSize: '0.95rem',
              textAlign: 'center'
            }}>
              Ainda não há pagamentos vinculados a esta conta.
            </div>
          )}

          {!error && payments.length > 0 && (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 'var(--amo-radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '700', color: '#1F2933', marginBottom: '0.2rem' }}>
                      {payment.motorista?.nome || 'Motorista'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#52606D' }}>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {payment.metodo ? ` · ${payment.metodo}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '700', color: '#1F2933', marginBottom: '0.2rem' }}>
                      {formatCentsToBrl(payment.valor)}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {payment.status === 'succeeded' ? 'Pago' : payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
