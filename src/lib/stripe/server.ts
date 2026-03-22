import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default stripe;

// Pilot pricing: AmoPagar charges 3% + R$0,39 per card payment.
export const PLATFORM_FEE_RATE = 0.03; // 3%
export const PLATFORM_FIXED_FEE_CENTS = 39; // R$0,39

export function calculateFee(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_RATE + PLATFORM_FIXED_FEE_CENTS);
}

// Amount validation
export const MIN_AMOUNT_CENTS = 200; // R$2.00
export const MAX_AMOUNT_CENTS = 40000; // R$400.00

export function validateAmount(amountCents: number): string | null {
  if (!Number.isInteger(amountCents) || amountCents < MIN_AMOUNT_CENTS) {
    return `Valor mínimo é R$${(MIN_AMOUNT_CENTS / 100).toFixed(2)}`;
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    return `Valor máximo é R$${(MAX_AMOUNT_CENTS / 100).toFixed(2)}`;
  }
  return null;
}

// 3DS threshold - force 3D Secure for card payments above this amount
export const THREE_DS_THRESHOLD_CENTS = 10000; // R$100.00

// Get payment method options with conditional 3DS
export function getCardPaymentOptions(amountCents: number): Stripe.PaymentIntentCreateParams.PaymentMethodOptions {
  return {
    card: {
      // Force 3DS above R$100 for manual card entry
      // Apple Pay / Google Pay have built-in biometric auth so this only affects manual card
      request_three_d_secure: amountCents >= THREE_DS_THRESHOLD_CENTS ? 'any' : 'automatic',
    },
  };
}
