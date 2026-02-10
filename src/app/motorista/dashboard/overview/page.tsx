"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { format, subDays } from "date-fns";
import StripeSetupAlert from "@/components/StripeSetupAlert";

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
          const link = `${window.location.origin}/${rawPhone}`;
          setPaymentPageLink(link);
          QRCode.toDataURL(link, { errorCorrectionLevel: "H", margin: 2, scale: 6 }, (_, url) => {
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
      router.push("/motorista/login");
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
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
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
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {profile.nome || "Motorista"}!
        </h1>
        <button onClick={fetchData} className="text-sm text-purple-600 hover:text-purple-800">
          Atualizar
        </button>
      </div>

      <StripeSetupAlert />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Hoje</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? formatBRL(analytics.today.total) : "..."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {analytics?.today.count || 0} pagamento{analytics?.today.count !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Esta Semana</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? formatBRL(analytics.thisWeek.total) : "..."}
          </p>
          {analytics && (
            <p className={`text-xs mt-1 ${analytics.weekChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {analytics.weekChange >= 0 ? "+" : ""}{analytics.weekChange}% vs semana anterior
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Este Mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? formatBRL(analytics.thisMonth.total) : "..."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {analytics?.thisMonth.count || 0} pagamentos
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Ticket Médio</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? formatBRL(analytics.averageTicket) : "..."}
          </p>
          <p className="text-xs text-gray-400 mt-1">últimos 30 dias</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 mb-1">Saldo Disponível</p>
          <p className="text-3xl font-bold text-green-600">{availableBalance}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500 mb-1">Saldo Pendente</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingBalance}</p>
        </div>
      </div>

      {/* Weekly Chart */}
      {analytics && analytics.dailyTotals.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Faturamento - Últimos 7 dias</h2>
          <div className="flex items-end gap-2 h-32">
            {analytics.dailyTotals.map((d) => {
              const height = maxDaily > 0 ? (d.total / maxDaily) * 100 : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">
                    {d.total > 0 ? formatBRL(d.total) : ""}
                  </span>
                  <div
                    className="w-full bg-purple-300 rounded-t-md transition-all hover:bg-purple-400"
                    style={{ height: `${Math.max(height, 2)}%` }}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busiest Hours */}
          {analytics.busiestHours.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Horários de Pico</h3>
              <div className="space-y-2">
                {analytics.busiestHours.map((h, i) => (
                  <div key={h.hour} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {h.label}
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
            <div className="bg-white rounded-lg shadow p-4">
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
            <div className="bg-white rounded-lg shadow p-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Minha Página de Pagamento</h2>
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
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto border rounded-md"
                  style={{ width: 180, height: 180 }}
                />
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5 space-y-3">
          <h2 className="text-lg font-semibold">Acesso Rápido</h2>
          <Link href="/motorista/dashboard/pagamentos" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <span className="text-sm font-medium text-gray-700">Pagamentos e Recibos</span>
          </Link>
          <Link href="/motorista/lucro" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <span className="text-sm font-medium text-gray-700">Lucro e Pix Manual</span>
          </Link>
          <Link href="/motorista/dashboard/dados" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <span className="text-sm font-medium text-gray-700">Meus Dados</span>
          </Link>
        </div>
      </div>

      <canvas ref={qrCodeRef} className="hidden" />
    </div>
  );
}
