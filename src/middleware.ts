import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sanitizeInternalCallbackUrl } from '@/lib/utils/navigation';

/**
 * Global middleware that:
 *  1. Checks NextAuth session
 *  2. Protects API routes (only specific ones are public)
 *  3. Redirects unauthenticated users away from protected pages
 *  4. Preserves callback routing without hard-coding a single-role session model
 */
export async function middleware(req: NextRequest) {
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  const { pathname } = req.nextUrl;
  const isAuthenticated = !!session;

  // --- Public routes that do NOT require authentication ---
  const isPublicRoute =
    // Static/info pages
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/motorista/login') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/termos') ||
    pathname.startsWith('/privacidade') ||
    pathname.startsWith('/pagamento') ||
    pathname.startsWith('/public') ||
    // NextAuth handler
    pathname.startsWith('/api/auth') ||
    // Public API routes
    pathname.startsWith('/api/public') ||
    pathname === '/api/health' ||
    // Stripe webhook (verified by signature, not session)
    pathname === '/api/stripe/webhook' ||
    // Customer-facing payment creation (no login required)
    pathname === '/api/stripe/create-payment-intent' ||
    pathname === '/api/stripe/create-pix-payment' ||
    pathname.startsWith('/api/stripe/check-pix-status') ||
    // Pix payment routes (guest payments)
    pathname.startsWith('/api/pix') ||
    // Auth callbacks
    pathname.startsWith('/auth/callback');

  // Dynamic phone number routes (e.g., /5511999999999)
  const isPhoneNumberRoute = /^\/\d{10,13}$/.test(pathname);

  if (isPublicRoute || isPhoneNumberRoute) {
    // For authenticated users on login pages, redirect to dashboard
    if (isAuthenticated) {
      const isLoginPage =
        pathname === '/login' ||
        pathname === '/cadastro';

      const isMotoristaLoginPage =
        pathname === '/motorista/login';

      const callbackUrl = sanitizeInternalCallbackUrl(
        req.nextUrl.searchParams.get('callbackUrl'),
        '/auth/post-login'
      );

      if (isLoginPage || isMotoristaLoginPage) {
        return NextResponse.redirect(new URL(callbackUrl, req.url));
      }
    }
    return NextResponse.next();
  }

  // --- Protected routes: require authentication ---
  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';

    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const callbackUrl = req.nextUrl.search || '';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${callbackUrl}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
