import { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  supabaseServer,
  supabaseAdmin,
  formatPhoneNumber,
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
          const { data, error } = await supabaseServer.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          const { data: profile } = await supabaseServer
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          return {
            id: data.user.id,
            email: data.user.email,
            name: profile?.nome || data.user.email?.split("@")[0],
            image: profile?.avatar_url || null,
            tipo: profile?.tipo || "cliente",
            account: "email",
          };
        } catch (err) {
          console.error("Login error:", err);
          return null;
        }
      },
    }),

    /* ------ Phone + OTP (Supabase) ------ */
    CredentialsProvider({
      id: "phone-otp",
      name: "Telefone",
      credentials: {
        phone: { label: "Telefone", type: "text" },
        code: { label: "Código", type: "text" },
        countryCode: { label: "Country Code", type: "text", value: "55" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        try {
          const countryCode = credentials.countryCode || "55";
          const formattedPhone = credentials.phone.startsWith("+")
            ? credentials.phone
            : formatPhoneNumber(credentials.phone, countryCode);

          // Verify OTP
          const { data: verifyData, error: verifyError } =
            await supabaseAdmin.auth.verifyOtp({
              phone: formattedPhone,
              token: credentials.code,
              type: "sms",
            });

          if (verifyError || !verifyData?.user) {
            return null;
          }

          // Find profile by ID
          let profile;
          const { data: existingProfile, error: profileError } =
            await supabaseServer
              .from("profiles")
              .select("*")
              .eq("id", verifyData.user.id)
              .maybeSingle();

          if (profileError) {
            console.error("Error finding profile:", profileError);
            return null;
          }

          // Try to find profile by phone number if not found by ID
          if (!existingProfile) {
            const phoneWithPlus = formattedPhone.startsWith("+")
              ? formattedPhone
              : `+${formattedPhone}`;
            const phoneWithoutPlus = formattedPhone.startsWith("+")
              ? formattedPhone.substring(1)
              : formattedPhone;

            const { data: phoneProfile } =
              await supabaseServer
                .from("profiles")
                .select("*")
                .in("celular", [phoneWithPlus, phoneWithoutPlus])
                .maybeSingle();

            if (phoneProfile) {
              profile = phoneProfile;

              // Return with the profile's actual tipo (don't mutate PK)
              return {
                id: verifyData.user.id,
                email: phoneProfile.email || "",
                name: phoneProfile.nome || formattedPhone,
                image: phoneProfile.avatar_url || "",
                tipo: phoneProfile.tipo || "motorista",
                phone: formattedPhone,
                account: "phone",
                stripeAccountId: phoneProfile?.stripe_account_id || "",
              };
            }
          }

          // If no profile exists, create a new driver profile
          if (!existingProfile && !profile) {
            const newProfilePayload = {
              id: verifyData.user.id,
              celular: formattedPhone,
              tipo: "motorista",
              nome: formattedPhone,
              account: "phone",
              verified: true,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: createError } = await supabaseServer
              .from("profiles")
              .insert(newProfilePayload);

            if (createError) {
              console.error("Error creating driver profile:", createError);
              return null;
            }

            profile = newProfilePayload;
          } else {
            profile = existingProfile || profile;
          }

          // Return user with the profile's actual tipo (no forced mutation)
          return {
            id: profile.id || verifyData.user.id,
            email: profile.email || "",
            name: profile.nome || formattedPhone,
            image: profile.avatar_url || "",
            tipo: profile.tipo || "motorista",
            phone: formattedPhone,
            account: "phone",
            stripeAccountId: profile?.stripe_account_id || "",
          };
        } catch (err) {
          console.error("Phone OTP verification error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: ExtendedUser;
      account: any;
      profile: any;
    }) {
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
        token.stripeAccountId = (user as ExtendedUser)?.stripeAccountId || null;
        token.email = user.email;
        token.phone = (user as ExtendedUser)?.phone;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
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
