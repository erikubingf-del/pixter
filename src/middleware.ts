import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Global middleware that:
 *  1. Checks NextAuth session
 *  2. Protects API routes (only specific ones are public)
 *  3. Redirects unauthenticated users away from protected pages
 *  4. Enforces role-based access (motorista vs cliente)
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
    pathname.startsWith('/motorista/cadastro') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/termos') ||
    pathname.startsWith('/privacidade') ||
    pathname.startsWith('/pagamento') ||
    pathname.startsWith('/public') ||
    // NextAuth handler
    pathname.startsWith('/api/auth') ||
    // Public API routes
    pathname.startsWith('/api/public') ||
    // Stripe webhook (verified by signature, not session)
    pathname === '/api/stripe/webhook' ||
    // Customer-facing payment creation (no login required)
    pathname === '/api/stripe/create-payment-intent' ||
    pathname === '/api/stripe/create-pix-payment' ||
    pathname.startsWith('/api/stripe/check-pix-status') ||
    // Pix payment routes (guest payments)
    pathname.startsWith('/api/pix') ||
    // Auth callback
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

      const userType = (session.tipo as string) || 'cliente';

      if (isLoginPage || (isMotoristaLoginPage && userType === 'cliente')) {
        return NextResponse.redirect(new URL('/cliente/dashboard', req.url));
      } else if (isMotoristaLoginPage && userType === 'motorista') {
        return NextResponse.redirect(new URL('/motorista/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // --- Protected routes: require authentication ---
  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone();

    if (pathname.startsWith('/motorista') || pathname.startsWith('/api/motorista')) {
      loginUrl.pathname = '/motorista/login';
    } else {
      loginUrl.pathname = '/login';
    }

    // For API routes, return 401 instead of redirect
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Role-based access control ---
  const userType = (session.tipo as string) || 'cliente';

  // Motorista routes require motorista role
  if (pathname.startsWith('/motorista') || pathname.startsWith('/api/motorista')) {
    if (userType !== 'motorista') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/cliente/dashboard', req.url));
    }
  }

  // Cliente routes require cliente role
  if (pathname.startsWith('/cliente') || pathname.startsWith('/api/client')) {
    if (userType !== 'cliente') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/motorista/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
