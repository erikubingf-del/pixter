import { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  supabaseServer,
  supabaseAdmin,
  formatPhoneNumber,
} from "@/lib/supabase/client";
import Stripe from "stripe";

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
}

/* ---------- Extended user type ---------- */
interface ExtendedUser extends User {
  id: string;
  email: string;
  tipo: string;
  account?: string;
  name?: string;
  image?: string;
  stripeAccountId?: string;
}

/* ---------- Stripe ---------- */
// Lazy-load Stripe to avoid build-time errors
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }

  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });
  return _stripe;
}
const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const client = getStripe();
    return (client as any)[prop];
  }
});

/* ---------- Helper: fetch profile ---------- */

/* ---------- Helper: get profile by email ---------- */
async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
  console.log("Going to fetch profile by email:", email);

  const { data, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error(
      "Profile fetch by email error:",
      error.message,
      error.details
    );
    return null;
  }
  if (data) {
    console.log("Profile fetched by email:", data);
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
          // Use server client for sign-in
          const { data, error } = await supabaseServer.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.error("Email/Password Auth Error:", error?.message);
            return null; // Return null instead of throwing error
          }

          // Fetch profile using server client
          const { data: profile } = await supabaseServer
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          // Return user object for NextAuth session
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
          console.error("Missing phone or code in credentials");
          return null;
        }

        try {
          const countryCode = credentials.countryCode || "55";
          // If phone already starts with +, use it directly
          const formattedPhone = credentials.phone.startsWith("+")
            ? credentials.phone
            : formatPhoneNumber(credentials.phone, countryCode);

          console.log("Formatted phone:", formattedPhone);

          // First verify the OTP
          const { data: verifyData, error: verifyError } =
            await supabaseAdmin.auth.verifyOtp({
              phone: formattedPhone,
              token: credentials.code,
              type: "sms",
            });

          console.log("OTP verification response:", {
            verifyData,
            verifyError,
          });

          if (verifyError) {
            console.error(
              `Supabase verifyOtp error for ${formattedPhone}:`,
              verifyError?.message
            );
            return null;
          }

          if (!verifyData?.user) {
            console.error("No user data returned from verifyOtp");
            return null;
          }

          // Find or create profile
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

          // Try to find profile by phone number if no profile found by ID
          if (!existingProfile) {
            console.log("No profile found by ID, checking by phone number...");

            // Get both formats of the phone number for checking
            const phoneWithPlus = formattedPhone.startsWith("+")
              ? formattedPhone
              : `+${formattedPhone}`;
            const phoneWithoutPlus = formattedPhone.startsWith("+")
              ? formattedPhone.substring(1)
              : formattedPhone;

            console.log("Checking for phone formats:", {
              phoneWithPlus,
              phoneWithoutPlus,
            });

            // Check for profile with either phone format
            const { data: phoneProfile, error: phoneProfileError } =
              await supabaseServer
                .from("profiles")
                .select("*")
                .or(
                  `celular.eq.${phoneWithPlus},celular.eq.${phoneWithoutPlus}`
                )
                .maybeSingle();

            if (phoneProfileError) {
              console.error(
                "Error finding profile by phone:",
                phoneProfileError
              );
            } else if (phoneProfile) {
              console.log("Found profile by phone number:", phoneProfile.id);
              profile = phoneProfile;

              // Update the auth user ID in the profile to match the authenticated user
              const { error: updateError } = await supabaseServer
                .from("profiles")
                .update({ id: verifyData.user.id })
                .eq("id", phoneProfile.id);

              if (updateError) {
                console.error("Error updating profile ID:", updateError);
              } else {
                console.log(
                  "Profile ID updated successfully to:",
                  verifyData.user.id
                );
              }

              return {
                id: verifyData.user.id,
                email: phoneProfile.email || "",
                name: phoneProfile.nome || formattedPhone,
                image: phoneProfile.avatar_url || "",
                tipo: "motorista",
                account: "phone",
                stripeAccountId: phoneProfile?.stripe_account_id || "",
              };
            }
          }

          // If no profile exists, create a new driver profile automatically
          let isNewProfile = false;
          if (!existingProfile && !profile) {
            console.log(
              "No profile found. Creating new driver profile for:",
              verifyData.user.id
            );

            const newProfilePayload = {
              id: verifyData.user.id,
              celular: formattedPhone,
              tipo: "motorista",
              nome: formattedPhone, // Use phone as temporary name
              account: "phone",
              verified: true,
              onboarding_completed: false, // Track onboarding status
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

            console.log("Driver profile created successfully");
            profile = newProfilePayload;
            isNewProfile = true;
          } else {
            profile = existingProfile || profile;
          }

          // Ensure profile is motorista type
          if (profile.tipo !== "motorista") {
            console.log(
              "Profile exists but is not motorista. Updating to motorista..."
            );
            const { error: updateTypeError } = await supabaseServer
              .from("profiles")
              .update({ tipo: "motorista" })
              .eq("id", verifyData.user.id);

            if (updateTypeError) {
              console.error("Error updating profile type:", updateTypeError);
            } else {
              profile.tipo = "motorista";
            }
          }

          // Return user object
          return {
            id: profile.id,
            email: profile.email || "",
            name: profile.nome || formattedPhone,
            image: profile.avatar_url || "",
            tipo: "motorista",
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
      profile,
    }: {
      user: ExtendedUser;
      account: any;
      profile: any;
    }) {
      // Google authentication flow
      if (account?.provider === "google" && user.email) {
        try {
          console.log("Google auth flow started for email:", user.email);
          const existingProfile = await getProfileByEmail(user.email);

          if (existingProfile) {
            console.log("Using existing profile with ID:", existingProfile.id);
            user.id = existingProfile.id;
            (user as ExtendedUser).tipo = existingProfile.tipo || "cliente";
            (user as ExtendedUser).account = "google";
            return true;
          }

          // 2. For new Google users, create the auth user and profile
          // Try to create the user - if they already exist, we'll get their ID from the error
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
            // User might already exist - try to find them using Admin API
            console.log("User might already exist, attempting to find via Admin API");

            try {
              const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

              if (listError) {
                console.error("Error listing users:", listError);
                return true; // Continue with NextAuth session only
              }

              const existingUser = listData.users.find(u => u.email === user.email);

              if (existingUser) {
                console.log("Found existing user via Admin API:", existingUser.id);
                user.id = existingUser.id;
              } else {
                console.error("Could not find user after creation failed");
                return true; // Continue with NextAuth session only
              }
            } catch (e) {
              console.error("Exception finding user:", e);
              return true; // Continue with NextAuth session only
            }
          } else {
            // Successfully created new user
            console.log("Successfully created new auth user:", authUser.user.id);
            user.id = authUser.user.id;
          }

          // Create profile
          try {
            const { error: profileError } = await supabaseServer
              .from("profiles")
              .insert({
                id: user.id,
                nome: user.name || "",
                email: user.email,
                avatar_url: user.image || null,
                tipo: "cliente",
                account: "google",
              });

            if (profileError) {
              console.error("Profile creation error:", profileError);
            }
          } catch (error) {
            console.error("Exception during profile creation:", error);
          }

          // Set user type for NextAuth session
          (user as ExtendedUser).tipo = "cliente";
          (user as ExtendedUser).account = "google";

          return true;
        } catch (e) {
          console.error("Google auth error:", e);
          // If all else fails, just let NextAuth handle the session
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
        token.stripeAccountId = (user as ExtendedUser)?.stripeAccountId|| null;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tipo = token.tipo as string;
        (session.user as any).account = token.account as string;
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
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 1 day in seconds
  },
};
