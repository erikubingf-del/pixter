import { getServerSession } from 'next-auth/next';
import { authOptions } from './options';

export interface AuthSession {
  id: string;
  email: string;
  tipo: string;
  phone?: string;
  stripeAccountId?: string;
  name?: string;
  image?: string;
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
  if (session.tipo !== 'motorista') {
    throw new AuthError('Acesso negado', 403);
  }
  return session;
}

export async function requireCliente(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.tipo !== 'cliente') {
    throw new AuthError('Acesso negado', 403);
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}
