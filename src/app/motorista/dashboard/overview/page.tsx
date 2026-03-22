"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { format, subDays } from "date-fns";
import StripeSetupAlert from "@/components/StripeSetupAlert";
import { getPublicPaymentUrl } from "@/lib/utils/payment";

type Analytics = {
  today: { total: number; count: number };
  thisWeek: { total: number; count: number };
  lastWeek: { total: number; count: number };
  weekChange: number;
  thisMonth: { total: number; count: number };
  monthGrowth: number;
  averageTicket: number;
  busiestHours: { hour: number; label: string; count: number }[];
  methodBreakdown: Record<string, number>;
  dailyTotals: { date: string; label: string; total: number; count: number }[];
  bestDay: { day: string; total: number } | null;
  totalPayments30d: number;
};

type Profile = {
  id: string;
  nome?: string;
  celular?: string;
  tipo?: string;
  stripe_account_id?: string | null;
};

type NewPayment = {
  id: string;
  valor: number;
  metodo: string;
  created_at: string;
};

const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export default function DriverDashboardPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentPageLink, setPaymentPageLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Notification state
  const [newPayments, setNewPayments] = useState<NewPayment[]>([]);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toISOString());
  const [showNotification, setShowNotification] = useState(false);

  // Balance state
  const [availableBalance, setAvailableBalance] = useState("R$ 0,00");
  const [pendingBalance, setPendingBalance] = useState("R$ 0,00");

  const fetchData = useCallback(async () => {
    if (sessionStatus !== "authenticated") return;

    setLoading(true);
    setError("");

    try {
      // Fetch profile, analytics, and balance in parallel
      const [profileRes, analyticsRes, balanceRes] = await Promise.all([
        fetch("/api/motorista/profile", { credentials: "include" }),
        fetch("/api/motorista/analytics", { credentials: "include" }),
        fetch("/api/motorista/payments?" + new URLSearchParams({
          startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
        }), { credentials: "include" }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);

        const rawPhone = profileData.celular?.replace(/\D/g, "") || "";
        if (rawPhone) {
          const link = getPublicPaymentUrl(window.location.origin, rawPhone);
          setPaymentPageLink(link);
          QRCode.toDataURL(link, { errorCorrectionLevel: "H", margin: 2, scale: 6 }, (_: Error | null | undefined, url: string) => {
            if (url) setQrCodeUrl(url);
          });
        }
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        if (data.balance) {
          if (data.balance.available?.[0]?.amount) setAvailableBalance(data.balance.available[0].amount);
          if (data.balance.pending?.[0]?.amount) setPendingBalance(data.balance.pending[0].amount);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus]);

  // Poll for new payments every 15 seconds
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !profile?.id) return;

    const pollPayments = async () => {
      try {
        const res = await fetch(`/api/motorista/notifications?since=${encodeURIComponent(lastChecked)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.payments?.length > 0) {
            setNewPayments(data.payments);
            setShowNotification(true);
            setLastChecked(new Date().toISOString());
            // Auto-dismiss after 8 seconds
            setTimeout(() => setShowNotification(false), 8000);
            // Refresh analytics
            fetchData();
          }
        }
      } catch {
        // Silent fail on polling
      }
    };

    const interval = setInterval(pollPayments, 15000);
    return () => clearInterval(interval);
  }, [sessionStatus, profile?.id, lastChecked, fetchData]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchData();
    } else if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, fetchData, router]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-red-500">{error || "Erro ao carregar perfil"}</div>;
  }

  const maxDaily = analytics?.dailyTotals
    ? Math.max(...analytics.dailyTotals.map((d) => d.total), 1)
    : 1;

  return (
    <div className="p-4 md:p-6 space-y-5 bg-[#F5F6FA] min-h-screen">
      {/* Payment Notification Toast */}
      {showNotification && newPayments.length > 0 && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-lg">Novo Pagamento!</span>
              <button onClick={() => setShowNotification(false)} className="text-green-200 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {newPayments.map((p) => (
              <div key={p.id} className="text-green-100 text-sm">
                {formatBRL(p.valor)} via {p.metodo || "cartão"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Área do Motorista</p>
          <h1 className="text-xl font-bold text-gray-900">
            Olá, {profile.nome?.split(' ')[0] || "Motorista"}
          </h1>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer font-medium">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.73-4.43"/></svg>
          Atualizar
        </button>
      </div>

      <StripeSetupAlert />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Hoje</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 tabular-nums">
            {analytics ? formatBRL(analytics.today.total) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {analytics?.today.count || 0} pagamento{analytics?.today.count !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Esta Semana</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 tabular-nums">
            {analytics ? formatBRL(analytics.thisWeek.total) : "—"}
          </p>
          {analytics && (
            <p className={`text-xs mt-1 font-medium ${analytics.weekChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {analytics.weekChange >= 0 ? "+" : ""}{analytics.weekChange}% vs anterior
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Este Mês</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 tabular-nums">
            {analytics ? formatBRL(analytics.thisMonth.total) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {analytics?.thisMonth.count || 0} pagamentos
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ticket Médio</p>
          <p className="text-xl font-bold text-gray-900 mt-1.5 tabular-nums">
            {analytics ? formatBRL(analytics.averageTicket) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">últimos 30 dias</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Saldo Disponível</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums mt-0.5">{availableBalance}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Saldo Pendente</p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums mt-0.5">{pendingBalance}</p>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      {analytics && analytics.dailyTotals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Faturamento — Últimos 7 dias</h2>
          <div className="flex items-end gap-2 h-32">
            {analytics.dailyTotals.map((d) => {
              const height = maxDaily > 0 ? (d.total / maxDaily) * 100 : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">
                    {d.total > 0 ? formatBRL(d.total) : ""}
                  </span>
                  <div
                    className="w-full bg-purple-500 rounded-t-md transition-all hover:bg-purple-600"
                    style={{ height: `${Math.max(height, 2)}%`, opacity: d.total > 0 ? 1 : 0.25 }}
                    title={`${formatBRL(d.total)} (${d.count} pagamentos)`}
                  />
                  <span className="text-xs text-gray-400 mt-1">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights Row */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Busiest Hours */}
          {analytics.busiestHours.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Horários de Pico</h3>
              <div className="space-y-2">
                {analytics.busiestHours.map((h, i) => (
                  <div key={h.hour} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                        {i + 1}
                      </span>
                      {h.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {h.count} pagamento{h.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {Object.keys(analytics.methodBreakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Métodos de Pagamento</h3>
              <div className="space-y-2">
                {Object.entries(analytics.methodBreakdown).map(([method, count]) => {
                  const labels: Record<string, string> = {
                    card: "Cartão",
                    pix: "Pix",
                    apple_pay: "Apple Pay",
                    google_pay: "Google Pay",
                  };
                  const total = Object.values(analytics.methodBreakdown).reduce((s, c) => s + c, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{labels[method] || method}</span>
                      <span className="text-sm font-medium text-gray-900">{pct}% ({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Best Day */}
          {analytics.bestDay && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Melhor Dia</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.bestDay.day}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatBRL(analytics.bestDay.total)} nos últimos 30 dias
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {analytics.totalPayments30d} pagamentos no total
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Minha Página de Pagamento</h2>
          {paymentPageLink && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentPageLink}
                  readOnly
                  className="flex-1 p-2 border rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(paymentPageLink)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                >
                  Copiar
                </button>
              </div>
              {qrCodeUrl && (
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={180}
                  height={180}
                  unoptimized
                  className="mx-auto border rounded-md"
                />
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-2">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Acesso Rápido</h2>
          <Link href="/motorista/dashboard/pagamentos" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150 group">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-purple-500" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Pagamentos e Recibos</span>
          </Link>
          <Link href="/motorista/lucro" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150 group">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-purple-500" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Lucro e Pix Manual</span>
          </Link>
          <Link href="/motorista/dashboard/dados" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150 group">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-purple-500" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Meus Dados</span>
          </Link>
        </div>
      </div>

      <canvas ref={qrCodeRef} className="hidden" />
    </div>
  );
}
