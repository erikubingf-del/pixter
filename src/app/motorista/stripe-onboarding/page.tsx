'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type StripeStatus = {
  connected: boolean;
  ready: boolean;
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

function validatePixKeyLocal(key: string): string | null {
  const k = key.trim();
  if (!k) return 'Informe a chave Pix.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (k.includes('@') && !emailRegex.test(k)) return 'E-mail inválido.';
  if (k.startsWith('+') && !/^\+55\d{10,11}$/.test(k))
    return 'Telefone inválido. Use +55XXXXXXXXXXX.';
  if (k.length === 11 && /^\d{11}$/.test(k)) return null; // CPF
  if (k.length === 14 && /^\d{14}$/.test(k)) return null; // CNPJ
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) return null;
  if ((k.length === 10 || k.length === 11) && /^\d+$/.test(k)) return null;
  if (!k.includes('@') && !k.startsWith('+') && !/^\d+$/.test(k) && !/^[0-9a-f-]+$/i.test(k))
    return 'Formato de chave Pix não reconhecido.';
  return null;
}

function detectPixKeyType(key: string): string {
  const k = key.trim();
  if (!k) return '';
  if (k.includes('@')) return 'E-mail';
  if (k.startsWith('+55') || (k.startsWith('+') && !k.includes('@'))) return 'Telefone';
  if (k.length === 11 && /^\d{11}$/.test(k)) return 'CPF';
  if (k.length === 14 && /^\d{14}$/.test(k)) return 'CNPJ';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
    return 'Chave Aleatória';
  if ((k.length === 10 || k.length === 11) && /^\d+$/.test(k)) return 'Telefone';
  return '';
}

export default function SetupPaymentMethods() {
  const router = useRouter();
  const { status } = useSession();

  // Stripe state
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  // PIX state
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [pixInput, setPixInput] = useState('');
  const [pixEditing, setPixEditing] = useState(false);
  const [pixConfirm, setPixConfirm] = useState(false);
  const [pixConfirmChecked, setPixConfirmChecked] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState('');
  const [pixSuccess, setPixSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/motorista/profile');
      if (!res.ok) return;
      const data = await res.json();
      setPixKey(data.pix_key || null);
    } catch {/* ignore */}
  }, []);

  const loadStripeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/status');
      if (!res.ok) return;
      const data = await res.json();
      setStripeStatus(data);
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadProfile();
      loadStripeStatus();
    }
  }, [status, router, loadProfile, loadStripeStatus]);

  const handleConnectStripe = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const res = await fetch('/api/stripe/connect-account', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao conectar Stripe');
      if (data.ready) {
        await loadStripeStatus();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setStripeError(err.message || 'Erro ao iniciar conexão com Stripe');
      setStripeLoading(false);
    }
  };

  const handlePixSave = () => {
    const err = validatePixKeyLocal(pixInput);
    if (err) { setPixError(err); return; }
    setPixError('');
    setPixConfirm(true);
    setPixConfirmChecked(false);
  };

  const handlePixConfirm = async () => {
    if (!pixConfirmChecked) return;
    setPixLoading(true);
    setPixError('');
    try {
      const res = await fetch('/api/motorista/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pix_key: pixInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar chave Pix.');
      setPixKey(pixInput.trim());
      setPixEditing(false);
      setPixConfirm(false);
      setPixInput('');
      setPixSuccess(true);
      setTimeout(() => setPixSuccess(false), 3000);
    } catch (err: any) {
      setPixError(err.message);
    } finally {
      setPixLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)' }}>
        <div style={{ width: 48, height: 48, border: '4px solid rgba(139,125,216,0.3)', borderTop: '4px solid #8B7DD8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const stripeReady = stripeStatus?.ready;
  const stripeConnected = stripeStatus?.connected;

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 640, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              <span style={{ color: '#8B7DD8' }}>Amo</span>
              <span style={{ color: '#81C995' }}>Pagar</span>
            </h1>
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1F2933', margin: '0.5rem 0' }}>
            Configure seus recebimentos
          </h2>
          <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
            Ative um ou os dois métodos. São independentes entre si.
          </p>
        </div>

        {/* PIX Connector */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.75rem', marginBottom: '1rem', border: pixKey ? '2px solid #81C995' : '2px solid #E4E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
              🏦
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1F2933', fontSize: '1.05rem' }}>PIX</div>
              <div style={{ fontSize: '0.8rem', color: '#65B741', fontWeight: 600 }}>Gratuito · Instantâneo · Sem burocracia</div>
            </div>
            {pixKey && (
              <div style={{ marginLeft: 'auto', background: '#E8F5E9', color: '#15803D', borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                ✓ Ativo
              </div>
            )}
          </div>

          {/* PIX Key display / form */}
          {!pixEditing ? (
            pixKey ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', borderRadius: 8, padding: '0.75rem 1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{detectPixKeyType(pixKey)}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#1F2933', wordBreak: 'break-all' }}>{pixKey}</div>
                </div>
                <button
                  onClick={() => { setPixInput(pixKey); setPixEditing(true); setPixError(''); setPixConfirm(false); }}
                  style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#059669', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#52606D', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Cadastre sua chave Pix para receber pagamentos diretamente na sua conta bancária, sem taxa.
                </p>
                <button
                  onClick={() => { setPixEditing(true); setPixInput(''); setPixError(''); setPixConfirm(false); }}
                  style={{ width: '100%', padding: '0.875rem', background: '#15803D', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Adicionar chave Pix
                </button>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <input
                  type="text"
                  value={pixInput}
                  onChange={(e) => { setPixInput(e.target.value); setPixError(''); }}
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #D1D5DB', borderRadius: 8, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
                  disabled={pixLoading}
                />
                {pixInput && (
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Tipo: <strong>{detectPixKeyType(pixInput) || 'Não reconhecido'}</strong>
                  </p>
                )}
                {pixError && <p style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '0.25rem' }}>{pixError}</p>}
              </div>

              {!pixConfirm ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handlePixSave}
                    disabled={pixLoading || !pixInput.trim()}
                    style={{ flex: 1, padding: '0.75rem', background: '#15803D', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: pixLoading || !pixInput.trim() ? 0.5 : 1 }}
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => { setPixEditing(false); setPixInput(''); setPixError(''); }}
                    disabled={pixLoading}
                    style={{ padding: '0.75rem 1rem', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div style={{ background: '#FFFBEB', border: '2px solid #FCD34D', borderRadius: 10, padding: '1rem' }}>
                  <p style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirme sua chave Pix</p>
                  <p style={{ color: '#78350F', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Chave: <code style={{ fontWeight: 700 }}>{pixInput.trim()}</code>
                  </p>
                  <p style={{ color: '#78350F', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    Se estiver incorreta, os pagamentos irão para outra conta e não poderão ser estornados.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={pixConfirmChecked}
                      onChange={(e) => setPixConfirmChecked(e.target.checked)}
                      style={{ marginTop: 2 }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>
                      Confirmo que esta chave está correta.
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handlePixConfirm}
                      disabled={!pixConfirmChecked || pixLoading}
                      style={{ flex: 1, padding: '0.7rem', background: '#15803D', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: !pixConfirmChecked || pixLoading ? 0.5 : 1 }}
                    >
                      {pixLoading ? 'Salvando...' : 'Salvar chave'}
                    </button>
                    <button
                      onClick={() => setPixConfirm(false)}
                      disabled={pixLoading}
                      style={{ padding: '0.7rem 1rem', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pixSuccess && (
            <div style={{ marginTop: '0.75rem', background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              ✓ Chave Pix salva com sucesso!
            </div>
          )}
        </div>

        {/* Stripe Connector */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.75rem', marginBottom: '1.5rem', border: stripeReady ? '2px solid #8B7DD8' : '2px solid #E4E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0E7FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
              💳
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1F2933', fontSize: '1.05rem' }}>Stripe</div>
              <div style={{ fontSize: '0.8rem', color: '#8B7DD8', fontWeight: 600 }}>Cartão de crédito · Apple Pay · Google Pay</div>
            </div>
            {stripeReady && (
              <div style={{ marginLeft: 'auto', background: '#F0E7FC', color: '#6C3DBF', borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                ✓ Ativo
              </div>
            )}
            {stripeConnected && !stripeReady && (
              <div style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#92400E', borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                ⏳ Pendente
              </div>
            )}
          </div>

          {stripeError && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              {stripeError}
            </div>
          )}

          {stripeReady ? (
            <p style={{ color: '#52606D', fontSize: '0.875rem' }}>
              Sua conta Stripe está verificada. Você pode aceitar cartões de crédito e carteiras digitais.
            </p>
          ) : (
            <div>
              <p style={{ color: '#52606D', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {stripeConnected
                  ? 'Sua conta Stripe ainda precisa de verificação para liberar os pagamentos.'
                  : 'Conecte uma conta Stripe para aceitar cartões de crédito, Apple Pay e Google Pay. Processo leva ~5 minutos.'}
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={stripeLoading}
                style={{ width: '100%', padding: '0.875rem', background: stripeLoading ? '#9CA3AF' : '#8B7DD8', color: 'white', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 600, cursor: stripeLoading ? 'not-allowed' : 'pointer' }}
              >
                {stripeLoading
                  ? 'Abrindo Stripe...'
                  : stripeConnected
                    ? 'Continuar verificação Stripe'
                    : 'Conectar Stripe'}
              </button>
            </div>
          )}
        </div>

        {/* Go to dashboard */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => router.push('/motorista/dashboard/overview')}
            style={{ background: 'none', border: 'none', color: '#52606D', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Ir ao dashboard {(pixKey || stripeReady) ? '→' : 'sem configurar agora'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
