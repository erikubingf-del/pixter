import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase/client'

/**
 * Advanced analytics for drivers
 * Future: Gate behind premium subscription
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get driver profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, tipo')
      .eq('email', session.user.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.tipo !== 'motorista') {
      return NextResponse.json(
        { error: 'Only drivers can access analytics' },
        { status: 403 }
      )
    }

    // Fetch all payments for analytics
    const { data: payments, error: paymentsError } = await supabaseServer
      .from('pagamentos')
      .select('valor, metodo, payment_day_of_week, payment_hour, is_repeat_customer, created_at')
      .eq('motorista_id', profile.id)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Calculate insights
    const insights = {
      // Best day of week
      bestDay: getBestDayOfWeek(payments || []),

      // Peak hours
      peakHours: getPeakHours(payments || []),

      // Payment method preference
      methodBreakdown: getMethodBreakdown(payments || []),

      // Repeat customer rate
      repeatCustomerRate: getRepeatCustomerRate(payments || []),

      // Average transaction
      averageTransaction: getAverageTransaction(payments || []),

      // Growth trend (last 30 days vs previous 30 days)
      growthTrend: getGrowthTrend(payments || [])
    }

    return NextResponse.json({ insights })
  } catch (error: any) {
    console.error('Error in analytics route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getBestDayOfWeek(payments: any[]) {
  const dayTotals: { [key: string]: number } = {}

  payments.forEach(p => {
    const day = p.payment_day_of_week || 'Unknown'
    dayTotals[day] = (dayTotals[day] || 0) + p.valor
  })

  const bestDay = Object.entries(dayTotals)
    .sort(([, a], [, b]) => b - a)[0]

  return bestDay ? {
    day: bestDay[0],
    total: bestDay[1],
    percentage: (bestDay[1] / payments.reduce((sum, p) => sum + p.valor, 0) * 100).toFixed(1)
  } : null
}

function getPeakHours(payments: any[]) {
  const hourTotals: { [key: number]: number } = {}

  payments.forEach(p => {
    if (p.payment_hour !== null) {
      hourTotals[p.payment_hour] = (hourTotals[p.payment_hour] || 0) + p.valor
    }
  })

  return Object.entries(hourTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, total]) => ({
      hour: parseInt(hour),
      total,
      timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`
    }))
}

function getMethodBreakdown(payments: any[]) {
  const methodTotals: { [key: string]: { total: number; count: number } } = {}

  payments.forEach(p => {
    const method = p.metodo || 'unknown'
    if (!methodTotals[method]) {
      methodTotals[method] = { total: 0, count: 0 }
    }
    methodTotals[method].total += p.valor
    methodTotals[method].count += 1
  })

  return Object.entries(methodTotals).map(([method, data]) => ({
    method,
    total: data.total,
    count: data.count,
    average: data.total / data.count
  }))
}

function getRepeatCustomerRate(payments: any[]) {
  const repeatPayments = payments.filter(p => p.is_repeat_customer).length
  const totalPayments = payments.length

  return totalPayments > 0 ? {
    rate: (repeatPayments / totalPayments * 100).toFixed(1),
    repeatCount: repeatPayments,
    totalCount: totalPayments
  } : null
}

function getAverageTransaction(payments: any[]) {
  if (payments.length === 0) return 0
  const total = payments.reduce((sum, p) => sum + p.valor, 0)
  return total / payments.length
}

function getGrowthTrend(payments: any[]) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const last30Days = payments.filter(p =>
    new Date(p.created_at) >= thirtyDaysAgo
  ).reduce((sum, p) => sum + p.valor, 0)

  const previous30Days = payments.filter(p => {
    const date = new Date(p.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }).reduce((sum, p) => sum + p.valor, 0)

  const growth = previous30Days > 0
    ? ((last30Days - previous30Days) / previous30Days * 100).toFixed(1)
    : '0'

  return {
    last30Days,
    previous30Days,
    growthPercentage: parseFloat(growth),
    trending: parseFloat(growth) > 0 ? 'up' : parseFloat(growth) < 0 ? 'down' : 'stable'
  }
}
