import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/callback
 * Handles Supabase email verification callback.
 * Exchanges the auth code for a session, then redirects to login.
 *
 * This route uses Supabase's exchangeCodeForSession which is specific
 * to Supabase's email verification flow. It does NOT create a NextAuth session;
 * the user must log in via NextAuth after email verification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (code) {
    try {
      // Exchange the code to confirm the email in Supabase
      // We use the admin client just to verify the token, not to create a browser session
      const { data, error } = await supabaseServer.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error.message);
        return NextResponse.redirect(new URL('/login?error=verification-failed', appUrl));
      }

      // Update profile to mark email as verified if needed
      if (data?.user) {
        await supabaseServer
          .from('profiles')
          .update({ verified: true, updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      // Redirect to login page with success
      return NextResponse.redirect(new URL('/login?verified=true', appUrl));
    } catch (error) {
      console.error('Error processing verification:', error);
      return NextResponse.redirect(new URL('/login?error=verification-failed', appUrl));
    }
  }

  // No code, redirect to home
  return NextResponse.redirect(new URL('/', appUrl));
}
