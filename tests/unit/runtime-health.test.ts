import { describe, expect, it } from 'vitest';

import { getRuntimeHealthReport } from '@/lib/health/runtime';

describe('runtime health report', () => {
  it('fails when required environment variables are missing', async () => {
    const report = await getRuntimeHealthReport({
      env: {},
      dnsLookup: async () => ({ address: '127.0.0.1', family: 4 }),
      stripeProbe: async () => ({
        id: 'acct_test',
        charges_enabled: true,
        payouts_enabled: true,
      }),
    });

    expect(report.status).toBe('error');
    expect(report.checks.configuration.status).toBe('error');
    expect(report.checks.configuration.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(report.checks.configuration.missing).toContain('STRIPE_SECRET_KEY');
  });

  it('fails when the Supabase hostname does not resolve', async () => {
    const report = await getRuntimeHealthReport({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://broken-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_valid',
        SUPABASE_SERVICE_ROLE_KEY: 'sb_service_role_valid',
        STRIPE_SECRET_KEY: 'sk_test_valid',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_valid',
        NEXTAUTH_SECRET: 'secret',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      },
      dnsLookup: async () => {
        throw Object.assign(new Error('getaddrinfo ENOTFOUND broken-project.supabase.co'), {
          code: 'ENOTFOUND',
        });
      },
      stripeProbe: async () => ({
        id: 'acct_test',
        charges_enabled: true,
        payouts_enabled: true,
      }),
    });

    expect(report.status).toBe('error');
    expect(report.checks.supabase.status).toBe('error');
    expect(report.checks.supabase.hostname).toBe('broken-project.supabase.co');
    expect(report.checks.supabase.error).toContain('ENOTFOUND');
  });

  it('fails when Stripe key modes do not match', async () => {
    const report = await getRuntimeHealthReport({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://healthy-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_valid',
        SUPABASE_SERVICE_ROLE_KEY: 'sb_service_role_valid',
        STRIPE_SECRET_KEY: 'sk_live_valid',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_valid',
        NEXTAUTH_SECRET: 'secret',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      },
      dnsLookup: async () => ({ address: '127.0.0.1', family: 4 }),
      stripeProbe: async () => ({
        id: 'acct_live',
        charges_enabled: true,
        payouts_enabled: true,
      }),
    });

    expect(report.status).toBe('error');
    expect(report.checks.stripe.status).toBe('error');
    expect(report.checks.stripe.error).toContain('mode');
  });
});
