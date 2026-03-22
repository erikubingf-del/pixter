import { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  supabaseServer,
  supabaseAdmin,
  createServerAuthClient,
} from "@/lib/supabase/client";

/* ---------- Row type for `profiles` ---------- */
interface ProfileRow {
  id: string;
  nome: string | null;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  tipo: string | null;
  stripe_account_id: string | null;
  account: string | null;
  celular: string | null;
}

/* ---------- Extended user type ---------- */
interface ExtendedUser extends User {
  id: string;
  email: string;
  tipo: string;
  phone?: string;
  account?: string;
  name?: string;
  image?: string;
  stripeAccountId?: string;
}

/* ---------- Helper: get profile by email ---------- */
async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch by email error:", error.message);
    return null;
  }
  return data as ProfileRow | null;
}

/* ---------- NextAuth options ---------- */
export const authOptions: NextAuthOptions = {
  providers: [
    /* -------- Google -------- */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    /* ------ Email + Password (Supabase) ------ */
    CredentialsProvider({
      id: "email-password",
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const authClient = createServerAuthClient();
          const { data, error } = await authClient.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          const { data: profile } = await authClient
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          return {
            id: data.user.id,
            email: data.user.email,
            name: profile?.nome || data.user.user_metadata?.nome || data.user.email?.split("@")[0],
            image: profile?.avatar_url || null,
            tipo: profile?.tipo || data.user.user_metadata?.tipo || "cliente",
            account: "email",
            stripeAccountId: profile?.stripe_account_id || "",
          };
        } catch (err) {
          console.error("Login error:", err);
          return null;
        }
      },
    }),

  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google authentication flow
      if (account?.provider === "google" && user.email) {
        try {
          const existingProfile = await getProfileByEmail(user.email);

          if (existingProfile) {
            user.id = existingProfile.id;
            (user as ExtendedUser).tipo = existingProfile.tipo || "cliente";
            (user as ExtendedUser).account = "google";
            return true;
          }

          // Create the auth user
          const { data: authUser, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              email_confirm: true,
              user_metadata: {
                nome: user.name || "",
                avatar_url: user.image || null,
              },
            });

          if (authError) {
            // User might already exist - find by email
            try {
              const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id);
              if (userData?.user) {
                user.id = userData.user.id;
              } else {
                // Fallback: query profiles by email
                const profileByEmail = await getProfileByEmail(user.email);
                if (profileByEmail) {
                  user.id = profileByEmail.id;
                }
              }
            } catch (e) {
              console.error("Exception finding user:", e);
              return true;
            }
          } else {
            user.id = authUser.user.id;
          }

          // Create profile using upsert to handle duplicates
          try {
            const { error: profileError } = await supabaseServer
              .from("profiles")
              .upsert({
                id: user.id,
                nome: user.name || "",
                email: user.email,
                avatar_url: user.image || null,
                tipo: "cliente",
                account: "google",
              }, { onConflict: 'id' });

            if (profileError) {
              console.error("Profile creation error:", profileError);
            }
          } catch (error) {
            console.error("Exception during profile creation:", error);
          }

          (user as ExtendedUser).tipo = "cliente";
          (user as ExtendedUser).account = "google";

          return true;
        } catch (e) {
          console.error("Google auth error:", e);
          return true;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tipo = (user as ExtendedUser).tipo;
        token.account = (user as ExtendedUser).account;
        token.stripeAccountId = (user as ExtendedUser)?.stripeAccountId || undefined;
        token.email = user.email;
        token.phone = (user as ExtendedUser)?.phone;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          const { data: latestProfile } = await supabaseServer
            .from('profiles')
            .select('tipo, stripe_account_id, avatar_url, nome')
            .eq('id', token.id as string)
            .maybeSingle();

          if (latestProfile) {
            token.tipo = latestProfile.tipo || (token.tipo as string) || 'cliente';
            token.stripeAccountId =
              latestProfile.stripe_account_id || (token.stripeAccountId as string | undefined);
            if (latestProfile.nome) {
              session.user.name = latestProfile.nome;
            }
            if (latestProfile.avatar_url) {
              session.user.image = latestProfile.avatar_url;
            }
          }
        }

        session.user.id = token.id as string;
        session.user.tipo = token.tipo as string;
        (session.user as any).account = token.account as string;
        (session.user as any).phone = token.phone;
        (session.user as any).stripeAccountId = token.stripeAccountId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    newUser: "/cadastro",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },
};
