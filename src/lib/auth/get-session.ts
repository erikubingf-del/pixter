import { getServerSession } from 'next-auth/next';
import { authOptions } from './options';
import { supabaseServer } from '@/lib/supabase/client';
import { hasDriverCapabilityFromProfile } from '@/lib/auth/driver-profile';

export interface AuthSession {
  id: string;
  email: string;
  tipo: string;
  canUseDriverView?: boolean;
  phone?: string;
  stripeAccountId?: string;
  name?: string;
  image?: string;
}

export async function hasDriverCapability(userId: string): Promise<boolean> {
  const { data: profile, error } = await supabaseServer
    .from('profiles')
    .select('tipo, onboarding_completed, stripe_account_id, cpf, profissao, data_nascimento')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) {
    return false;
  }

  return hasDriverCapabilityFromProfile(profile);
}

/**
 * Shared auth helper for API routes.
 * Returns the authenticated user session or null.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || '',
    tipo: session.user.tipo || 'cliente',
    phone: (session.user as any).phone,
    stripeAccountId: (session.user as any).stripeAccountId,
    name: session.user.name || undefined,
    image: session.user.image || undefined,
  };
}

/**
 * Helper that returns the session or throws a structured error.
 * Use in API routes where authentication is required.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new AuthError('Não autorizado', 401);
  }
  return session;
}

export async function requireMotorista(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.tipo === 'motorista') {
    return { ...session, canUseDriverView: true };
  }

  const canUseDriverView = await hasDriverCapability(session.id);
  if (!canUseDriverView) {
    throw new AuthError('Acesso negado', 403);
  }

  return {
    ...session,
    tipo: 'motorista',
    canUseDriverView,
  };
}

export async function requireCliente(): Promise<AuthSession> {
  return requireAuth();
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}
