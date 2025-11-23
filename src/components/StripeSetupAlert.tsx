'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StripeStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export default function StripeSetupAlert() {
  const router = useRouter();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch('/api/stripe/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupNow = () => {
    router.push('/motorista/stripe-onboarding');
  };

  if (loading || dismissed) return null;

  // Don't show alert if fully connected
  if (status?.connected && status?.charges_enabled && status?.payouts_enabled) {
    return null;
  }

  // Show critical alert if not connected at all
  if (!status?.connected) {
    return (
      <div style={{
        background: '#FEF3C7',
        border: '2px solid #F59E0B',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            color: '#92400E',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#92400E',
              marginBottom: '0.5rem'
            }}>
              Configure sua conta Stripe para receber pagamentos
            </h3>
            <p style={{
              color: '#78350F',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              lineHeight: '1.5'
            }}>
              Você precisa conectar sua conta Stripe para criar links de pagamento, QR codes e receber seus lucros via Pix.
            </p>
            <button
              onClick={handleSetupNow}
              style={{
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Conectar Stripe Agora →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if connected but not fully setup
  if (status?.connected && (!status?.charges_enabled || !status?.payouts_enabled)) {
    const requirementsList = [
      ...(status.requirements?.currently_due || []),
      ...(status.requirements?.past_due || [])
    ];

    const friendlyRequirements: { [key: string]: string } = {
      'individual.email': 'Confirmar email',
      'individual.phone': 'Adicionar telefone',
      'individual.dob.day': 'Data de nascimento',
      'individual.dob.month': 'Data de nascimento',
      'individual.dob.year': 'Data de nascimento',
      'individual.id_number': 'CPF',
      'individual.verification.document': 'Documento de identificação',
      'external_account': 'Adicionar conta bancária',
      'tos_acceptance.date': 'Aceitar termos de serviço',
    };

    const pendingItems = requirementsList
      .map(req => friendlyRequirements[req] || req)
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    return (
      <div style={{
        background: '#DBEAFE',
        border: '2px solid #3B82F6',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            color: '#1E40AF',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>ℹ️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#1E40AF',
              marginBottom: '0.5rem'
            }}>
              Complete sua configuração do Stripe
            </h3>
            <p style={{
              color: '#1E3A8A',
              fontSize: '0.875rem',
              marginBottom: '0.75rem',
              lineHeight: '1.5'
            }}>
              Sua conta Stripe está quase pronta! Faltam apenas alguns passos:
            </p>
            {pendingItems.length > 0 && (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 1rem 0',
                fontSize: '0.875rem',
                color: '#1E3A8A'
              }}>
                {pendingItems.slice(0, 3).map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    • {item}
                  </li>
                ))}
                {pendingItems.length > 3 && (
                  <li style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                    ... e mais {pendingItems.length - 3} item(ns)
                  </li>
                )}
              </ul>
            )}
            <button
              onClick={handleSetupNow}
              style={{
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Completar Configuração →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
