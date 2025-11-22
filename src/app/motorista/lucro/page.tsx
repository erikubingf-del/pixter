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
  status: string
}

interface Analytics {
  total: number
  count: number
  last30Days: number
  bestDay: { day: string; total: number } | null
  bestWeekday: { name: string; average: number } | null
  byDay: { date: string; total: number }[]
  byMethod: { method: string; total: number; count: number }[]
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

const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function LucroPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [payments, setPayments] = useState<Payment[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('30') // 7, 30, 90 days

  // Pending payment actions
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)

  // Pix payment entry (legacy - keeping for manual additions)
  const [showPixForm, setShowPixForm] = useState(false)
  const [pixAmount, setPixAmount] = useState('')
  const [pixDescription, setPixDescription] = useState('')
  const [savingPix, setSavingPix] = useState(false)
  const [pixSuccess, setPixSuccess] = useState('')
  const [pixError, setPixError] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/motorista/login')
    }
  }, [status, router])

  // Fetch payments data
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return

      try {
        setLoading(true)
        setError('')

        const res = await fetch(`/api/motorista/lucro?days=${dateRange}`)

        if (!res.ok) {
          throw new Error('Failed to fetch payments')
        }

        const data = await res.json()
        const allPayments = data.payments || []

        // Separate pending and succeeded payments
        const succeeded = allPayments.filter((p: Payment) => p.status === 'succeeded')
        const pending = allPayments.filter((p: Payment) => p.status === 'pending')

        setPayments(succeeded)
        setPendingPayments(pending)

        // Calculate analytics (only from succeeded payments)
        calculateAnalytics(succeeded)

        // Fetch Stripe status
        const stripeRes = await fetch('/api/stripe/status')
        if (stripeRes.ok) {
          const stripeData = await stripeRes.json()
          setStripeStatus(stripeData)
        }
      } catch (err: any) {
        console.error('Error fetching payments:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status, dateRange])

  const handleAddPixPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(pixAmount)
    if (isNaN(amount) || amount <= 0) {
      setPixError('Valor inválido')
      return
    }

    setSavingPix(true)
    setPixError('')
    setPixSuccess('')

    try {
      const res = await fetch('/api/motorista/add-pix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: amount,
          descricao: pixDescription || 'Pagamento via Pix'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to add payment')
      }

      setPixSuccess(`✅ Pagamento de R$ ${amount.toFixed(2)} adicionado!`)
      setPixAmount('')
      setPixDescription('')

      // Refresh payments list
      const paymentsRes = await fetch(`/api/motorista/lucro?days=${dateRange}`)
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        const allPayments = data.payments || []
        const succeeded = allPayments.filter((p: Payment) => p.status === 'succeeded')
        const pending = allPayments.filter((p: Payment) => p.status === 'pending')
        setPayments(succeeded)
        setPendingPayments(pending)
        calculateAnalytics(succeeded)
      }

      // Close form after 2 seconds
      setTimeout(() => {
        setShowPixForm(false)
        setPixSuccess('')
      }, 2000)
    } catch (err: any) {
      console.error('Error adding Pix payment:', err)
      setPixError(err.message || 'Erro ao adicionar pagamento')
    } finally {
      setSavingPix(false)
    }
  }

  const handleConfirmPayment = async (paymentId: string) => {
    setConfirmingPaymentId(paymentId)

    try {
      const res = await fetch('/api/motorista/confirm-pix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to confirm payment')
      }

      // Refresh payments list
      const paymentsRes = await fetch(`/api/motorista/lucro?days=${dateRange}`)
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        const allPayments = data.payments || []
        const succeeded = allPayments.filter((p: Payment) => p.status === 'succeeded')
        const pending = allPayments.filter((p: Payment) => p.status === 'pending')
        setPayments(succeeded)
        setPendingPayments(pending)
        calculateAnalytics(succeeded)
      }
    } catch (err: any) {
      console.error('Error confirming payment:', err)
      alert('Erro ao confirmar pagamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setConfirmingPaymentId(null)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento pendente?')) {
      return
    }

    setDeletingPaymentId(paymentId)

    try {
      const res = await fetch('/api/motorista/delete-pix-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete payment')
      }

      // Remove from pending list
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId))
    } catch (err: any) {
      console.error('Error deleting payment:', err)
      alert('Erro ao excluir pagamento: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setDeletingPaymentId(null)
    }
  }

  const calculateAnalytics = (paymentsData: Payment[]) => {
    if (paymentsData.length === 0) {
      setAnalytics({
        total: 0,
        count: 0,
        last30Days: 0,
        bestDay: null,
        bestWeekday: null,
        byDay: [],
        byMethod: []
      })
      return
    }

    // Total and count
    const total = paymentsData.reduce((sum, p) => sum + p.valor, 0)
    const count = paymentsData.length

    // Last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const last30Days = paymentsData
      .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.valor, 0)

    // Group by day
    const byDay: { [key: string]: number } = {}
    paymentsData.forEach(p => {
      const date = new Date(p.created_at).toISOString().split('T')[0]
      byDay[date] = (byDay[date] || 0) + p.valor
    })

    const byDayArray = Object.entries(byDay)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => b.total - a.total)

    const bestDay = byDayArray.length > 0 ? {
      day: new Date(byDayArray[0].date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
      }),
      total: byDayArray[0].total
    } : null

    // Group by weekday (only if we have 30+ days of data)
    let bestWeekday = null
    if (parseInt(dateRange) >= 30) {
      const byWeekday: { [key: number]: { total: number; count: number } } = {}
      paymentsData.forEach(p => {
        const weekday = new Date(p.created_at).getDay()
        if (!byWeekday[weekday]) {
          byWeekday[weekday] = { total: 0, count: 0 }
        }
        byWeekday[weekday].total += p.valor
        byWeekday[weekday].count += 1
      })

      const weekdayAverages = Object.entries(byWeekday)
        .map(([day, data]) => ({
          day: parseInt(day),
          average: data.total / data.count
        }))
        .sort((a, b) => b.average - a.average)

      if (weekdayAverages.length > 0) {
        bestWeekday = {
          name: weekdayNames[weekdayAverages[0].day],
          average: weekdayAverages[0].average
        }
      }
    }

    // Group by payment method
    const byMethod: { [key: string]: { total: number; count: number } } = {}
    paymentsData.forEach(p => {
      const method = p.metodo || 'unknown'
      if (!byMethod[method]) {
        byMethod[method] = { total: 0, count: 0 }
      }
      byMethod[method].total += p.valor
      byMethod[method].count += 1
    })

    const byMethodArray = Object.entries(byMethod)
      .map(([method, data]) => ({
        method: method === 'pix' ? '📱 Pix' : method === 'card' ? '💳 Cartão' : '💰 Outro',
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total)

    setAnalytics({
      total,
      count,
      last30Days,
      bestDay,
      bestWeekday,
      byDay: byDayArray.slice(0, 30), // Last 30 days for chart
      byMethod: byMethodArray
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
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
          border: '4px solid rgba(129, 201, 149, 0.2)',
          borderTop: '4px solid #81C995',
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
      background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)',
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
              💰 Meu Lucro
            </h1>
            <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
              Acompanhe seus ganhos e estatísticas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPixForm(!showPixForm)}
              className="amo-btn amo-btn-secondary"
            >
              {showPixForm ? '❌ Cancelar' : '📱 Adicionar Pix'}
            </button>
            <Link href="/cliente/dashboard" className="amo-btn amo-btn-outline">
              ← Voltar ao Dashboard
            </Link>
          </div>
        </div>

        {/* Add Pix Payment Form */}
        {showPixForm && (
          <div className="amo-card amo-fade-in" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#1F2933',
              marginBottom: '1rem'
            }}>
              📱 Adicionar Pagamento Pix
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#52606D',
              marginBottom: '1.5rem'
            }}>
              Recebeu um pagamento via Pix? Adicione aqui para contabilizar no seu lucro.
            </p>

            <form onSubmit={handleAddPixPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label htmlFor="pixAmount" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1F2933',
                  marginBottom: '0.5rem'
                }}>
                  Valor recebido (R$)
                </label>
                <input
                  id="pixAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pixAmount}
                  onChange={(e) => setPixAmount(e.target.value)}
                  className="amo-input"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="pixDescription" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1F2933',
                  marginBottom: '0.5rem'
                }}>
                  Descrição (opcional)
                </label>
                <input
                  id="pixDescription"
                  type="text"
                  value={pixDescription}
                  onChange={(e) => setPixDescription(e.target.value)}
                  className="amo-input"
                  placeholder="Ex: Cliente João Silva"
                />
              </div>

              {pixError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '2px solid #FCA5A5',
                  borderRadius: 'var(--amo-radius-md)',
                  padding: '0.75rem',
                  color: '#991B1B',
                  fontSize: '0.875rem'
                }}>
                  ⚠️ {pixError}
                </div>
              )}

              {pixSuccess && (
                <div style={{
                  background: '#D1FAE5',
                  border: '2px solid #6EE7B7',
                  borderRadius: 'var(--amo-radius-md)',
                  padding: '0.75rem',
                  color: '#065F46',
                  fontSize: '0.875rem'
                }}>
                  {pixSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={savingPix}
                className="amo-btn amo-btn-secondary"
                style={{ width: '100%', opacity: savingPix ? 0.5 : 1 }}
              >
                {savingPix ? 'Salvando...' : '✅ Confirmar Pagamento'}
              </button>
            </form>
          </div>
        )}

        {/* Stripe Connection Status Banner */}
        {stripeStatus && (
          <div className="amo-card amo-fade-in" style={{
            marginBottom: '1.5rem',
            background: stripeStatus.connected
              ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
                : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)')
              : 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            border: stripeStatus.connected
              ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                ? '2px solid #10B981'
                : '2px solid #F59E0B')
              : '2px solid #EF4444'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>
                {stripeStatus.connected
                  ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled ? '✅' : '⚠️')
                  : '🔒'}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1F2933',
                  marginBottom: '0.5rem'
                }}>
                  {stripeStatus.connected
                    ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                      ? 'Conta Stripe Ativa'
                      : 'Ação Necessária na Conta Stripe')
                    : 'Conecte sua Conta Stripe'}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#52606D',
                  marginBottom: '0.75rem'
                }}>
                  {stripeStatus.connected
                    ? (stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                      ? 'Tudo funcionando perfeitamente! Você pode receber pagamentos.'
                      : 'Sua conta precisa de informações adicionais para continuar recebendo.')
                    : 'Conecte sua conta Stripe para começar a receber pagamentos dos clientes.'}
                </p>

                {stripeStatus.connected && (
                  <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{stripeStatus.charges_enabled ? '✅' : '❌'}</span>
                      <span style={{ color: '#52606D' }}>
                        {stripeStatus.charges_enabled ? 'Pagamentos ativos' : 'Pagamentos desabilitados'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{stripeStatus.payouts_enabled ? '✅' : '❌'}</span>
                      <span style={{ color: '#52606D' }}>
                        {stripeStatus.payouts_enabled ? 'Saques ativos' : 'Saques desabilitados'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{stripeStatus.details_submitted ? '✅' : '⏳'}</span>
                      <span style={{ color: '#52606D' }}>
                        {stripeStatus.details_submitted ? 'Dados completos' : 'Dados pendentes'}
                      </span>
                    </div>
                  </div>
                )}

                {stripeStatus.requirements && (
                  stripeStatus.requirements.currently_due.length > 0 ||
                  stripeStatus.requirements.past_due.length > 0
                ) && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--amo-radius-md)',
                    padding: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#DC2626',
                      marginBottom: '0.5rem'
                    }}>
                      ⚠️ Pendências:
                    </p>
                    <ul style={{
                      fontSize: '0.875rem',
                      color: '#991B1B',
                      paddingLeft: '1.25rem',
                      margin: 0
                    }}>
                      {[...stripeStatus.requirements.past_due, ...stripeStatus.requirements.currently_due].slice(0, 3).map((req, idx) => (
                        <li key={idx}>{req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href="/settings"
                  className="amo-btn amo-btn-secondary"
                  style={{ display: 'inline-block' }}
                >
                  {stripeStatus.connected ? 'Gerenciar Conta Stripe' : 'Conectar Stripe Agora'} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <div className="amo-card amo-fade-in" style={{
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '2px solid #F59E0B'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⏳</span>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#1F2933',
                margin: 0
              }}>
                Pagamentos Pix Pendentes ({pendingPayments.length})
              </h3>
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: '#92400E',
              marginBottom: '1rem'
            }}>
              Estes links Pix foram gerados mas ainda não foram confirmados. Confirme quando receber o pagamento ou exclua se não for pago.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 'var(--amo-radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <p style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#1F2933',
                      marginBottom: '0.25rem'
                    }}>
                      R$ {payment.valor.toFixed(2)}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#9AA5B1'
                    }}>
                      {new Date(payment.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleConfirmPayment(payment.id)}
                      disabled={confirmingPaymentId === payment.id}
                      className="amo-btn amo-btn-secondary"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        opacity: confirmingPaymentId === payment.id ? 0.5 : 1
                      }}
                    >
                      {confirmingPaymentId === payment.id ? '...' : '✅ Confirmar'}
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deletingPaymentId === payment.id}
                      className="amo-btn amo-btn-outline"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        opacity: deletingPaymentId === payment.id ? 0.5 : 1,
                        borderColor: '#EF4444',
                        color: '#EF4444'
                      }}
                    >
                      {deletingPaymentId === payment.id ? '...' : '🗑️ Excluir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="amo-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setDateRange('7')}
              className={`amo-btn ${dateRange === '7' ? 'amo-btn-secondary' : 'amo-btn-outline'}`}
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => setDateRange('30')}
              className={`amo-btn ${dateRange === '30' ? 'amo-btn-secondary' : 'amo-btn-outline'}`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setDateRange('90')}
              className={`amo-btn ${dateRange === '90' ? 'amo-btn-secondary' : 'amo-btn-outline'}`}
            >
              Últimos 90 dias
            </button>
          </div>
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

        {analytics && (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {/* Total Revenue */}
              <div className="amo-card amo-fade-in" style={{
                background: 'linear-gradient(135deg, #81C995 0%, #D4FC79 100%)',
                color: 'white'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.9,
                  marginBottom: '0.5rem'
                }}>
                  Faturamento Total
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '800'
                }}>
                  {formatCurrency(analytics.total)}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.9,
                  marginTop: '0.5rem'
                }}>
                  {analytics.count} pagamento{analytics.count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Last 30 Days */}
              <div className="amo-card amo-fade-in">
                <p style={{
                  fontSize: '0.875rem',
                  color: '#52606D',
                  marginBottom: '0.5rem'
                }}>
                  Últimos 30 dias
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#1F2933'
                }}>
                  {formatCurrency(analytics.last30Days)}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#81C995',
                  marginTop: '0.5rem'
                }}>
                  📈 {((analytics.last30Days / analytics.total) * 100).toFixed(0)}% do total
                </p>
              </div>

              {/* Best Day */}
              {analytics.bestDay && (
                <div className="amo-card amo-fade-in">
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#52606D',
                    marginBottom: '0.5rem'
                  }}>
                    Melhor Dia
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: '#1F2933'
                  }}>
                    {formatCurrency(analytics.bestDay.total)}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#8B7DD8',
                    marginTop: '0.5rem'
                  }}>
                    🏆 {analytics.bestDay.day}
                  </p>
                </div>
              )}

              {/* Best Weekday (only show if 30+ days of data) */}
              {analytics.bestWeekday && parseInt(dateRange) >= 30 && (
                <div className="amo-card amo-fade-in">
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#52606D',
                    marginBottom: '0.5rem'
                  }}>
                    Melhor Dia da Semana
                  </p>
                  <p style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: '#1F2933',
                    marginBottom: '0.5rem'
                  }}>
                    {analytics.bestWeekday.name}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#81C995'
                  }}>
                    📊 Média: {formatCurrency(analytics.bestWeekday.average)}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="amo-card amo-fade-in" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1F2933',
                marginBottom: '1.5rem'
              }}>
                💳 Por Forma de Pagamento
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analytics.byMethod.map((item, index) => {
                  const percentage = (item.total / analytics.total) * 100
                  return (
                    <div key={index}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1F2933'
                        }}>
                          {item.method}
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#52606D'
                        }}>
                          {formatCurrency(item.total)} ({item.count} pag.)
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#F9FAFB',
                        borderRadius: 'var(--amo-radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #81C995 0%, #D4FC79 100%)',
                          borderRadius: 'var(--amo-radius-full)',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Daily Chart */}
            <div className="amo-card amo-fade-in">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1F2933',
                marginBottom: '1.5rem'
              }}>
                📈 Faturamento por Dia
              </h2>

              {analytics.byDay.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {analytics.byDay.map((item, index) => {
                    const maxValue = Math.max(...analytics.byDay.map(d => d.total))
                    const percentage = (item.total / maxValue) * 100

                    return (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#9AA5B1',
                          minWidth: '60px',
                          textAlign: 'right'
                        }}>
                          {new Date(item.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                        <div style={{
                          flex: 1,
                          height: '32px',
                          background: '#F9FAFB',
                          borderRadius: 'var(--amo-radius-md)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #81C995 0%, #D4FC79 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '0.75rem',
                            transition: 'width 0.3s ease'
                          }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: '#9AA5B1'
                }}>
                  <p>Nenhum dado disponível para o período selecionado</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
