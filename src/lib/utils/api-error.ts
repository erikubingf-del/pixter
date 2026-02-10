import { NextResponse } from 'next/server';

/**
 * Return a safe error response without leaking internal details.
 */
export function safeErrorResponse(error: unknown, fallbackMessage: string, status = 500) {
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status });
}
