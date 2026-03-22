import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getRuntimeHealthReport: vi.fn(),
}));

vi.mock('@/lib/health/runtime', () => ({
  getRuntimeHealthReport: mocks.getRuntimeHealthReport,
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    mocks.getRuntimeHealthReport.mockReset();
  });

  it('returns 503 when runtime health is in error state', async () => {
    mocks.getRuntimeHealthReport.mockResolvedValue({
      status: 'error',
      timestamp: '2026-03-21T00:00:00.000Z',
      checks: {},
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('error');
  });

  it('returns 200 when runtime health is ok', async () => {
    mocks.getRuntimeHealthReport.mockResolvedValue({
      status: 'ok',
      timestamp: '2026-03-21T00:00:00.000Z',
      checks: {},
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});
