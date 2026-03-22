import { describe, expect, it } from 'vitest';

import { POST as loginDriverPost } from '@/app/api/auth/login-driver/route';
import { POST as sendVerificationPost } from '@/app/api/auth/send-verification/route';
import { POST as verifyOtpRegistrationPost } from '@/app/api/auth/verify-otp-registration/route';
import { POST as signinClientPost } from '@/app/api/auth/signin-client/route';

describe('legacy auth endpoints disabled for MVP', () => {
  it('rejects the legacy driver phone login endpoint', async () => {
    const response = await loginDriverPost();
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toContain('desativado');
    expect(data.error).toContain('/login');
  });

  it('rejects phone verification requests', async () => {
    const response = await sendVerificationPost();
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toContain('desativada');
    expect(data.error).toContain('email ou Google');
  });

  it('rejects OTP registration verification', async () => {
    const response = await verifyOtpRegistrationPost();
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toContain('desativada');
    expect(data.error).toContain('email ou Google');
  });

  it('guides legacy email sign-in callers to the shared NextAuth provider', async () => {
    const response = await signinClientPost();
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toContain('email-password');
    expect(data.redirect).toBe('/api/auth/signin');
  });
});
