'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Loader2 } from 'lucide-react';

interface PixPaymentProps {
  amount: number; // Amount in cents
  driverPhoneNumber: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
}

export default function PixPayment({
  amount,
  driverPhoneNumber,
  onSuccess,
  onError,
}: PixPaymentProps) {
  const [pixCode, setPixCode] = useState<string>('');
  const [pixQrCode, setPixQrCode] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  // Create Pix payment
  useEffect(() => {
    const createPixPayment = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch('/api/stripe/create-pix-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            driverPhoneNumber,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create Pix payment');
        }

        const data = await res.json();

        setPaymentIntentId(data.paymentIntentId);
        setPixCode(data.pixCode);

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(data.pixCode, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        });
        setPixQrCode(qrCodeDataUrl);

        // Start polling for payment status
        setPolling(true);
      } catch (err: any) {
        console.error('Error creating Pix payment:', err);
        setError(err.message || 'Failed to create Pix payment');
        onError(err);
      } finally {
        setLoading(false);
      }
    };

    createPixPayment();
  }, [amount, driverPhoneNumber, onError]);

  // Poll payment status
  useEffect(() => {
    if (!polling || !paymentIntentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/stripe/check-pix-status/${paymentIntentId}`);

        if (!res.ok) {
          console.error('Failed to check payment status');
          return;
        }

        const data = await res.json();
        setPaymentStatus(data.status);

        if (data.status === 'succeeded') {
          setPolling(false);
          clearInterval(pollInterval);
          onSuccess(data.paymentIntent);
        } else if (data.status === 'failed' || data.status === 'canceled') {
          setPolling(false);
          clearInterval(pollInterval);
          setError('Payment failed or was canceled');
          onError(new Error('Payment failed'));
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup: stop polling after 10 minutes
    const timeout = setTimeout(() => {
      setPolling(false);
      clearInterval(pollInterval);
      setError('Payment expired. Please try again.');
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [polling, paymentIntentId, onSuccess, onError]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format amount for display
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600">Gerando código Pix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Status */}
      {paymentStatus === 'succeeded' ? (
        <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-md">
          <Check className="w-6 h-6 text-green-600 mr-2" />
          <p className="text-green-600 font-semibold">Pagamento confirmado!</p>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-md">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <p className="text-blue-600 text-sm">Aguardando pagamento...</p>
        </div>
      )}

      {/* Amount Display */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">Valor a pagar:</p>
        <p className="text-3xl font-bold text-gray-900">{formattedAmount}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          {pixQrCode && (
            <img
              src={pixQrCode}
              alt="QR Code Pix"
              className="w-64 h-64"
            />
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">Como pagar com Pix:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Abra o aplicativo do seu banco</li>
          <li>Escolha pagar com Pix QR Code ou Pix Copia e Cola</li>
          <li>Escaneie o QR Code acima ou copie o código abaixo</li>
          <li>Confirme o pagamento no seu banco</li>
          <li>Aguarde a confirmação (aparece automaticamente aqui)</li>
        </ol>
      </div>

      {/* Pix Code Copy */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Código Pix Copia e Cola:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pixCode}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-md font-medium transition flex items-center gap-2 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timer Warning */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Este código Pix expira em 10 minutos
        </p>
      </div>

      {/* Cancel Option */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Cancelar e voltar
        </button>
      </div>
    </div>
  );
}
