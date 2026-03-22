import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Return a safe error response without leaking internal details.
 * Captures the error to Sentry for production monitoring.
 */
export function safeErrorResponse(error: unknown, fallbackMessage: string, status = 500) {
  console.error(fallbackMessage, error);
  Sentry.captureException(error, { extra: { fallbackMessage } });
  return NextResponse.json({ error: fallbackMessage }, { status });
}
