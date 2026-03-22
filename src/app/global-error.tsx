'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>⚠️</p>
          <h1 style={{ margin: '0 0 0.75rem', color: '#1F2933', fontSize: '1.5rem' }}>
            Ocorreu um erro inesperado
          </h1>
          <p style={{ margin: '0 0 1.5rem', color: '#52606D', lineHeight: 1.6 }}>
            A falha foi registrada. Tente novamente e, se o problema continuar, entre em contato com o suporte.
          </p>
          <button
            onClick={() => reset()}
            style={{
              border: 'none',
              borderRadius: '12px',
              background: '#8B7DD8',
              color: '#FFFFFF',
              padding: '0.9rem 1.2rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
