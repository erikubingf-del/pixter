import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  maybeSingle: vi.fn(),
  paymentIntentsCreate: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/supabase/client', () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: mocks.maybeSingle,
    single: vi.fn(),
  };

  return {
    supabaseServer: {
      from: vi.fn(() => chain),
    },
  };
});

vi.mock('@/lib/stripe/server', () => ({
  default: {
    paymentIntents: {
      create: mocks.paymentIntentsCreate,
    },
    ephemeralKeys: {
      create: vi.fn(),
    },
  },
  calculateFee: (amountInCents: number) => Math.round(amountInCents * 0.03 + 39),
  validateAmount: (amountInCents: number) => {
    if (amountInCents < 200) {
      return 'Valor mínimo é R$2.00';
    }
    if (amountInCents > 40000) {
      return 'Valor máximo é R$400.00';
    }
    return null;
  },
  getCardPaymentOptions: () => ({
    card: {
      request_three_d_secure: 'automatic',
    },
  }),
}));

import { POST } from '@/app/api/stripe/create-payment-intent/route';

describe('POST /api/stripe/create-payment-intent', () => {
  beforeEach(() => {
    mocks.getServerSession.mockResolvedValue(null);
    mocks.maybeSingle.mockReset();
    mocks.paymentIntentsCreate.mockReset();
  });

  it('blocks payments until the driver Stripe account is fully ready', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: 'driver_1',
        stripe_account_id: 'acct_123',
        stripe_account_charges_enabled: true,
        stripe_account_payouts_enabled: false,
      },
      error: null,
    });

    const response = await POST(
      new Request('https://amopagar.test/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250,
          driverPhoneNumber: '5511999999999',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Conta do motorista ainda não está totalmente verificada para receber pagamentos.',
    });
    expect(mocks.paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it('creates a payment intent when the driver is fully verified', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: 'driver_1',
        stripe_account_id: 'acct_123',
        stripe_account_charges_enabled: true,
        stripe_account_payouts_enabled: true,
      },
      error: null,
    });

    mocks.paymentIntentsCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret',
    });

    const response = await POST(
      new Request('https://amopagar.test/api/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: 250,
          driverPhoneNumber: '5511999999999',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clientSecret: 'pi_123_secret',
      paymentIntentId: 'pi_123',
    });
    expect(mocks.paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 250,
        application_fee_amount: 47,
        transfer_data: { destination: 'acct_123' },
      })
    );
  });
});
