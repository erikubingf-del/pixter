import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXTAUTH_SECRET: 'test-secret',
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_12345',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      STRIPE_SECRET_KEY: 'sk_test_12345',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    },
  },
});
