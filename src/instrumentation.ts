import * as Sentry from '@sentry/nextjs';

const enabled = process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const serverOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled,
};

export async function register() {
  Sentry.init(serverOptions);
}
