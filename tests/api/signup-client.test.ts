import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  createUser: vi.fn(),
  resend: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/middleware/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
}));

vi.mock('@/lib/supabase/client', () => {
  const chain = {
    upsert: mocks.upsert,
  };

  mocks.from.mockReturnValue(chain);

  return {
    supabaseServer: {
      auth: {
        admin: {
          createUser: mocks.createUser,
        },
        resend: mocks.resend,
      },
      from: mocks.from,
    },
  };
});

import { POST } from '@/app/api/auth/signup-client/route';

describe('POST /api/auth/signup-client', () => {
  beforeEach(() => {
    mocks.from.mockReturnValue({
      upsert: mocks.upsert,
    });
    mocks.rateLimit.mockResolvedValue({ success: true });
    mocks.createUser.mockResolvedValue({
      data: { user: { id: 'user_123' } },
      error: null,
    });
    mocks.resend.mockResolvedValue({ error: null });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it('creates a motorista account when requested from driver signup mode', async () => {
    const request = new NextRequest('https://amopagar.test/api/auth/signup-client', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Driver QA',
        email: 'driver.qa@pixter.test',
        password: 'PixterTest123!',
        accountType: 'motorista',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'driver.qa@pixter.test',
        user_metadata: expect.objectContaining({
          tipo: 'motorista',
        }),
      })
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user_123',
        tipo: 'motorista',
      }),
      { onConflict: 'id' }
    );
  });
});
