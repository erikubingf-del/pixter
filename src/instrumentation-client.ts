import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network request failed/,
    /^Failed to fetch/,
    /^Load failed/,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
