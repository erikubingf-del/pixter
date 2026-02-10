import { NextResponse } from 'next/server';
import { requireMotorista } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { safeErrorResponse } from '@/lib/utils/api-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireMotorista();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7).toISOString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all succeeded payments for the last 60 days
    const { data: payments, error } = await supabaseServer
      .from('pagamentos')
      .select('id, created_at, valor, metodo, status')
      .eq('motorista_id', session.id)
      .eq('status', 'succeeded')
      .gte('created_at', sixtyDaysAgo)
      .order('created_at', { ascending: false });

    if (error) {
      return safeErrorResponse(error, 'Erro ao buscar dados analíticos');
    }

    const all = payments || [];

    // Today
    const todayPayments = all.filter(p => p.created_at >= todayStart);
    const todayTotal = todayPayments.reduce((s, p) => s + Number(p.valor), 0);

    // This week vs last week
    const thisWeekPayments = all.filter(p => p.created_at >= thisWeekStart);
    const thisWeekTotal = thisWeekPayments.reduce((s, p) => s + Number(p.valor), 0);
    const lastWeekPayments = all.filter(p => p.created_at >= lastWeekStart && p.created_at < thisWeekStart);
    const lastWeekTotal = lastWeekPayments.reduce((s, p) => s + Number(p.valor), 0);
    const weekChange = lastWeekTotal > 0
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
      : thisWeekTotal > 0 ? 100 : 0;

    // This month
    const thisMonthPayments = all.filter(p => p.created_at >= thisMonthStart);
    const thisMonthTotal = thisMonthPayments.reduce((s, p) => s + Number(p.valor), 0);

    // Last 30 vs previous 30 (growth)
    const last30 = all.filter(p => p.created_at >= thirtyDaysAgo);
    const last30Total = last30.reduce((s, p) => s + Number(p.valor), 0);
    const prev30 = all.filter(p => p.created_at >= sixtyDaysAgo && p.created_at < thirtyDaysAgo);
    const prev30Total = prev30.reduce((s, p) => s + Number(p.valor), 0);
    const monthGrowth = prev30Total > 0
      ? Math.round(((last30Total - prev30Total) / prev30Total) * 100)
      : last30Total > 0 ? 100 : 0;

    // Average ticket (last 30 days)
    const averageTicket = last30.length > 0
      ? Math.round(last30Total / last30.length)
      : 0;

    // Busiest hours (last 30 days)
    const hourCounts: Record<number, { count: number; total: number }> = {};
    last30.forEach(p => {
      const hour = new Date(p.created_at).getHours();
      if (!hourCounts[hour]) hourCounts[hour] = { count: 0, total: 0 };
      hourCounts[hour].count++;
      hourCounts[hour].total += Number(p.valor);
    });
    const busiestHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${hour.padStart(2, '0')}:00`,
        count: data.count,
        total: data.total,
      }));

    // Payment method breakdown (last 30 days)
    const methods: Record<string, number> = {};
    last30.forEach(p => {
      const m = p.metodo || 'card';
      methods[m] = (methods[m] || 0) + 1;
    });

    // Daily totals for chart (last 7 days)
    const dailyTotals: { date: string; label: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      const dayPayments = all.filter(
        p => p.created_at >= d.toISOString() && p.created_at < nextD.toISOString()
      );
      dailyTotals.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        total: dayPayments.reduce((s, p) => s + Number(p.valor), 0),
        count: dayPayments.length,
      });
    }

    // Best day of week (last 30 days)
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayTotals: Record<number, number> = {};
    last30.forEach(p => {
      const dow = new Date(p.created_at).getDay();
      dayTotals[dow] = (dayTotals[dow] || 0) + Number(p.valor);
    });
    const bestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0];

    return NextResponse.json({
      today: { total: todayTotal, count: todayPayments.length },
      thisWeek: { total: thisWeekTotal, count: thisWeekPayments.length },
      lastWeek: { total: lastWeekTotal, count: lastWeekPayments.length },
      weekChange,
      thisMonth: { total: thisMonthTotal, count: thisMonthPayments.length },
      monthGrowth,
      averageTicket,
      busiestHours,
      methodBreakdown: methods,
      dailyTotals,
      bestDay: bestDay ? { day: dayNames[parseInt(bestDay[0])], total: bestDay[1] } : null,
      totalPayments30d: last30.length,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return safeErrorResponse(error, 'Erro ao buscar dados analíticos');
  }
}
