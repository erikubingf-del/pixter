import { NextResponse } from 'next/server';
import { safeErrorResponse } from '@/lib/utils/api-error';

/**
 * POST /api/auth/signin-client
 *
 * This route is no longer needed since NextAuth handles email/password
 * authentication via the credentials provider. Client login should use
 * NextAuth's signIn("credentials", { email, password }) directly.
 *
 * Kept as a redirect/hint for any legacy frontend code that still calls this endpoint.
 */
export async function POST() {
  try {
    return NextResponse.json(
      {
        error: 'Use o login compartilhado via NextAuth. Chame signIn("email-password", { email, password }) no frontend.',
        redirect: '/api/auth/signin',
      },
      { status: 410 } // Gone
    );
  } catch (error) {
    return safeErrorResponse(error, 'Erro no signin-client');
  }
}
