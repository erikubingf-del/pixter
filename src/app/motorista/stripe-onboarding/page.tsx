'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function StripeOnboarding() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/motorista/login');
    } else if (status === 'authenticated') {
      checkStripeStatus();
    }
  }, [status, router]);

  const checkStripeStatus = async () => {
    try {
      const res = await fetch('/api/stripe/status');
      const data = await res.json();

      if (data.connected) {
        // Already connected, redirect to dashboard
        router.push('/motorista/dashboard');
      } else {
        setAccountStatus(data);
      }
    } catch (err) {
      console.error('Error checking Stripe status:', err);
    }
  };

  const handleCreateStripeAccount = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/create-account', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta Stripe');
      }

      // Redirect to Stripe onboarding URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de onboarding não recebida');
      }
    } catch (err: any) {
      console.error('Error creating Stripe account:', err);
      setError(err.message || 'Erro ao iniciar configuração do Stripe');
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    router.push('/motorista/dashboard');
  };

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(139, 125, 216, 0.3)',
            borderTop: '4px solid #8B7DD8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#52606D' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '3rem'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#8B7DD8' }}>Amo</span>
              <span style={{ color: '#81C995' }}>Pagar</span>
            </h1>
          </Link>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1rem'
          }}>
            Configure sua Conta Stripe
          </h2>
          <p style={{ color: '#52606D', fontSize: '1rem', lineHeight: '1.6' }}>
            Para receber pagamentos, você precisa conectar sua conta Stripe. É rápido e seguro!
          </p>
        </div>

        {/* Benefits */}
        <div style={{
          background: '#F7FAFC',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '1rem'
          }}>
            O que você poderá fazer:
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>💳</span>
              <span style={{ color: '#52606D' }}>Receber pagamentos via Pix instantaneamente</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>📱</span>
              <span style={{ color: '#52606D' }}>Criar links de pagamento personalizados</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🔗</span>
              <span style={{ color: '#52606D' }}>Gerar QR codes para seus clientes</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>📊</span>
              <span style={{ color: '#52606D' }}>Acompanhar seus lucros em tempo real</span>
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '2px solid #FCA5A5',
            borderRadius: '12px',
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleCreateStripeAccount}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#9CA3AF' : '#8B7DD8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}></div>
                Iniciando...
              </>
            ) : (
              <>🚀 Conectar Stripe Agora</>
            )}
          </button>

          <button
            onClick={handleSkipForNow}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'transparent',
              color: '#52606D',
              border: '2px solid #E4E7EB',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Fazer isso depois
          </button>
        </div>

        {/* Info Note */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#E8F5E9',
          borderRadius: '12px',
          fontSize: '0.875rem',
          color: '#065F46',
          lineHeight: '1.5'
        }}>
          <strong>💡 Nota:</strong> Você precisará fornecer algumas informações básicas como CPF e dados bancários. O processo leva cerca de 5 minutos.
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
