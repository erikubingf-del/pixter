// src/lib/auth/index.ts
export { authOptions } from './options';
export { getAuthSession, requireAuth, requireMotorista, requireCliente, AuthError } from './get-session';
export type { AuthSession } from './get-session';
