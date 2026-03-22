import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireCliente: vi.fn(),
  single: vi.fn(),
}));

vi.mock('@/lib/auth/get-session', () => ({
  requireCliente: mocks.requireCliente,
}));

vi.mock('@/lib/supabase/client', () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: mocks.single,
  };

  return {
    supabaseServer: {
      from: vi.fn(() => chain),
    },
  };
});

import { GET } from '@/app/api/client/receipt/route';

describe('GET /api/client/receipt', () => {
  beforeEach(() => {
    mocks.requireCliente.mockResolvedValue({ id: 'client_1' });
    mocks.single.mockReset();
  });

  it('renders an escaped HTML receipt for the authenticated client', async () => {
    mocks.single.mockResolvedValue({
      data: {
        id: 'pay_123',
        created_at: '2026-03-08T12:00:00.000Z',
        valor: 1234,
        metodo: 'card',
        status: 'succeeded',
        payment_method_details: {
          brand: 'visa',
          last4: '4242',
        },
        driver_profile: {
          nome: '<script>alert(1)</script>',
          profissao: 'Motorista & Co',
        },
      },
      error: null,
    });

    const response = await GET(
      new Request('https://amopagar.test/api/client/receipt?paymentId=pay_123')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const html = (await response.text()).replace(/\u00a0/g, ' ');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Motorista &amp; Co');
    expect(html).toContain('R$ 12,34');
    expect(html).toContain('Cartão visa final 4242');
  });
});
