import { NextResponse } from 'next/server';

export async function POST() {
  // NextAuth handles signOut via /api/auth/signout
  // This route exists for backwards compatibility
  return NextResponse.json({
    success: true,
    message: 'Use /api/auth/signout for NextAuth logout',
    redirectUrl: '/api/auth/signout'
  });
}
