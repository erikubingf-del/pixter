import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      tipo: string;
      phone?: string;
      stripeAccountId?: string;
    };
  }
  interface User extends DefaultUser {
    tipo: string;
    phone?: string;
    stripeAccountId?: string;
    account?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: string;
    phone?: string;
    stripeAccountId?: string;
    account?: string;
  }
}

export {};
