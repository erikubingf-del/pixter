
// src/app/motorista/dashboard/pagina-pagamento/page.tsx

// This page contains the "Minha Página de Pagamento" section, including
// the public payment link, QR code, and Stripe connection status/button.

// Logic adapted from the original MinhaPaginaView and main dashboard component.

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getPublicPaymentUrl } from '@/lib/utils/payment'

// Define Profile type (ensure it matches the one used elsewhere)
type Profile = {
  id: string;
  nome?: string;
  email?: string;
  celular: string;
  profissao?: string;
  avatar_url?: string | null;
  stripe_account_id?: string | null;
  stripe_account_status?: 'pending' | 'verified' | 'restricted' | null;
  stripe_ready?: boolean;
  pix_key?: string | null;
};

export default function MinhaPaginaPagamentoPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingConnect, setLoadingConnect] = useState(false);

  // Fetch profile data and related info (QR code, payment URL)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const profileRes = await fetch('/api/motorista/profile');
        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`Erro ao carregar perfil (${profileRes.status})`);
        }
        const profileData: Profile = await profileRes.json();
        setProfile(profileData);

        const pageActive = !!profileData?.pix_key;
        if (pageActive) {
          setPaymentUrl(getPublicPaymentUrl(window.location.origin, profileData.celular));

          try {
            const qrRes = await fetch(`/api/stripe/driver-qr-code?driverId=${profileData.id}`);
            if (qrRes.ok) {
              const qrData = await qrRes.json();
              setQrCode(qrData.qrCode);
            } else {
              console.error('Erro ao buscar QR code');
            }
          } catch (qrError: any) {
            console.error('Falha ao buscar QR code:', qrError);
          }
        } else {
          setPaymentUrl('');
          setQrCode('');
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados da página:', err);
        setError(err.message || 'Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Function to initiate Stripe Connect onboarding
  const handleConnectStripe = async () => {
    setLoadingConnect(true);
    setError('');
    try {
      const response = await fetch('/api/stripe/connect-account', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao iniciar conexão com Stripe.');
      }
      const { url } = await response.json();
      if (url) {
        window.location.href = url; // Redirect user to Stripe
      } else {
        throw new Error('URL de conexão Stripe não recebida.');
      }
    } catch (err: any) {
      console.error("Erro handleConnectStripe:", err);
      setError(err.message || 'Erro ao conectar com Stripe.');
      setLoadingConnect(false);
    }
    // No need to setLoadingConnect(false) on success, as page redirects
  };

  // Handle copy payment URL
  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- Render Logic ---
  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (error && !profile) return <div className="p-6 text-red-500">Erro: {error}</div>;
  if (!profile) return <div className="p-6">Não foi possível carregar o perfil.</div>;

  const isStripeReady = Boolean(profile.stripe_ready);
  const hasPixKey = !!profile.pix_key;
  const pageActive = hasPixKey;
  const connectLabel = profile.stripe_account_id
    ? 'Continuar onboarding Stripe'
    : 'Conectar com Stripe';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Minha Página de Pagamento</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!pageActive ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-900">Página de pagamento inativa</p>
                <p className="text-sm text-amber-800 mt-1">
                  Configure ao menos um método de recebimento para ativar sua página pública.
                </p>
              </div>
            </div>
          </div>

          {/* Option 1: Add PIX */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#059669" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Opção 1 — Adicionar chave Pix</p>
                <p className="text-xs text-gray-500 mt-0.5">Mais rápido. Gratuito. Sem burocracia.</p>
              </div>
            </div>
            <Link
              href="/motorista/dashboard/dados"
              className="amo-btn amo-btn-teal w-full justify-center"
              style={{ display: 'flex' }}
            >
              Ir para Meus Dados → Chave Pix
            </Link>
          </div>

          {/* Option 2: Connect Stripe */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" stroke="#6C5DD3" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Opção 2 — Conectar Stripe</p>
                <p className="text-xs text-gray-500 mt-0.5">Aceita cartão de crédito, Apple Pay e Google Pay.</p>
              </div>
            </div>
            <button
              onClick={handleConnectStripe}
              disabled={loadingConnect}
              className="amo-btn amo-btn-secondary w-full justify-center"
              style={{ display: 'flex' }}
            >
              {loadingConnect ? 'Abrindo Stripe...' : connectLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stripe upsell banner for PIX-only drivers */}
          {hasPixKey && !isStripeReady && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
              <p className="font-semibold mb-1">Sua página aceita apenas Pix</p>
              <p className="mb-3">
                Conecte o Stripe para seus clientes pagarem também com cartão de crédito e Google/Apple Pay — e tenha uma experiência mais completa.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={loadingConnect}
                className="inline-flex justify-center py-1.5 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loadingConnect ? 'Abrindo Stripe...' : connectLabel}
              </button>
            </div>
          )}

          <p className="text-gray-700">Sua página pública para receber pagamentos:</p>
          {paymentUrl ? (
            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-md border border-gray-200">
              <Link href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate flex-grow text-sm sm:text-base">
                {paymentUrl}
              </Link>
              <button
                onClick={handleCopy}
                className="text-sm py-1 px-3 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Gerando link...</p>
          )}

          {/* Payment methods badge */}
          <div className="flex gap-2 flex-wrap">
            {hasPixKey && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Pix ativo
              </span>
            )}
            {isStripeReady && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                ✓ Cartão de crédito ativo
              </span>
            )}
          </div>

          {/* QR Code — available for any driver with PIX or Stripe */}
          <div>
            <p className="text-gray-700 mt-4">QR Code para Pagamento Rápido:</p>
            {qrCode ? (
              <div className="mt-2 p-4 border rounded-md inline-block bg-gray-50">
                <Image
                  src={qrCode}
                  alt="QR Code Pagamento"
                  width={224}
                  height={224}
                  unoptimized
                  className="h-48 w-48 md:h-56 md:w-56"
                />
              </div>
            ) : (
              <p className="text-gray-500 mt-2">{loading ? 'Carregando...' : 'Não foi possível gerar o QR Code.'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

