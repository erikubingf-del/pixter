export function normalizePhoneForPaymentPath(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.startsWith('55') ? digitsOnly.substring(2) : digitsOnly;
}

export function getPublicPaymentPath(phone: string): string {
  return `/pagamento/${normalizePhoneForPaymentPath(phone)}`;
}

export function getPublicPaymentUrl(baseUrl: string, phone: string): string {
  return `${baseUrl.replace(/\/$/, '')}${getPublicPaymentPath(phone)}`;
}

export function brlToCents(value: number | string): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }

  let normalized = value.trim();
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  return Math.round(Number.parseFloat(normalized) * 100);
}

export function formatCentsToBrl(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100);
}
