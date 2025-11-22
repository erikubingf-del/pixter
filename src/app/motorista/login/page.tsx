"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import '../../../styles/amopagar-theme.css';

export default function MotoristaLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [countryCode] = useState("55");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
    }
  };

  const enviarCodigo = async () => {
    if (!phone.trim() || phone.length < 10) {
      return setError("Por favor, informe um número de celular válido");
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar código");

      setSuccess("Código enviado! Verifique seu WhatsApp.");
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async () => {
    if (otp.length !== 6) {
      return setError("Por favor, insira o código de 6 dígitos");
    }
    setLoading(true);
    setError("");

    try {
      const result = await signIn("phone-otp", {
        redirect: false,
        phone,
        code: otp,
        countryCode,
        callbackUrl: "/motorista/dashboard",
      });

      if (result?.error) {
        throw new Error(result.error === "CredentialsSignin"
          ? "Código inválido ou expirado"
          : result.error);
      }

      if (result?.url) {
        router.push(result.url);
      } else {
        router.push("/motorista/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F5E9 0%, #F0E7FC 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="amo-card amo-fade-in" style={{
        maxWidth: '480px',
        width: '100%',
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
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1F2933',
            marginBottom: '0.5rem'
          }}>
            {codeSent ? 'Digite o código' : 'Login para Motoristas'}
          </h2>
          <p style={{ color: '#52606D', fontSize: '0.95rem' }}>
            {codeSent
              ? 'Enviamos um código de 6 dígitos para seu WhatsApp'
              : 'Entre com seu número de celular'}
          </p>
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

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#D1FAE5',
            border: '2px solid #6EE7B7',
            borderRadius: 'var(--amo-radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#065F46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {!codeSent ? (
          // Phone Input Step
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="phone" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Número de Celular (WhatsApp)
              </label>
              <input
                id="phone"
                type="tel"
                value={formatPhone(phone)}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="amo-input"
                autoFocus
              />
            </div>

            <button
              onClick={enviarCodigo}
              disabled={loading || phone.length < 10}
              className="amo-btn amo-btn-secondary"
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Enviando...
                </span>
              ) : (
                <>📱 Enviar código via WhatsApp</>
              )}
            </button>
          </div>
        ) : (
          // OTP Input Step
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="otp" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#1F2933',
                marginBottom: '0.5rem'
              }}>
                Código de Verificação
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="amo-input"
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem'
                }}
                autoFocus
                maxLength={6}
              />
            </div>

            <button
              onClick={verificarCodigo}
              disabled={loading || otp.length !== 6}
              className="amo-btn amo-btn-secondary"
              style={{ width: '100%' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {/* Resend Code */}
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#52606D' }}>
              {countdown > 0 ? (
                <span>Reenviar código em {countdown}s</span>
              ) : (
                <button
                  onClick={enviarCodigo}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#81C995',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Reenviar código
                </button>
              )}
            </div>

            {/* Change Number */}
            <button
              onClick={() => {
                setCodeSent(false);
                setOtp('');
                setError('');
                setSuccess('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#52606D',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Alterar número
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #E4E7EB',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center',
          fontSize: '0.875rem'
        }}>
          <p style={{ color: '#52606D' }}>
            Não tem uma conta?{' '}
            <Link href="/motorista/cadastro" style={{
              color: '#81C995',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Cadastre-se
            </Link>
          </p>
          <p style={{ color: '#52606D' }}>
            É cliente?{' '}
            <Link href="/login" style={{
              color: '#8B7DD8',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Acesse aqui
            </Link>
          </p>
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
