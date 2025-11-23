// src/app/api/auth/complete-registration/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  formatPhoneNumber,
  supabaseServer,
} from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log("=== complete-registration route called ===");

    // Get authenticated user from session
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return NextResponse.json(
        { error: "Você precisa verificar seu telefone primeiro." },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log("Completing registration for user:", userId);

    const formData = await req.formData();

    // Extract form data
    const phone = formData.get("phone") as string;
    const countryCode = formData.get("countryCode") as string;
    const nome = formData.get("nome") as string;
    const cpf = formData.get("cpf") as string;
    const profissao = formData.get("profissao") as string;
    const dataNascimento = formData.get("dataNascimento") as string;
    const avatarIndex = formData.get("avatarIndex") as string;
    const email = formData.get("email") as string | null;
    const selfieFile = formData.get("selfie") as File | null;

    // --- Basic Validation ---
    if (!phone || !nome || !cpf || !profissao || !dataNascimento || !avatarIndex) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone, countryCode);

    // --- Handle Selfie Upload and Avatar URL ---
    let selfieUrl: string | null = null;
    let avatarUrl: string | null = null;

    // 1. Upload Selfie
    if (selfieFile) {
      const selfiePath = `public/selfies/${userId}/${selfieFile.name || "selfie.jpg"}`;
      const { error: uploadError } = await supabaseServer.storage
        .from("selfies") // Ensure 'selfies' bucket exists and has appropriate policies
        .upload(selfiePath, selfieFile, { upsert: true });

      if (uploadError) {
        console.error(`Error uploading selfie for user ${userId}:`, uploadError);
        // Proceed without selfie for now
      } else {
        const { data: urlData } = supabaseServer.storage
          .from("selfies")
          .getPublicUrl(selfiePath);
        selfieUrl = urlData?.publicUrl;
        console.log(`Selfie uploaded for ${userId} to ${selfieUrl}`);
      }
    }

    // 2. Determine Avatar URL (using static paths)
    const index = Number(avatarIndex);
    if (!isNaN(index) && index >= 0 && index < 9) { // Assuming 9 avatars (0-8)
      avatarUrl = `/images/avatars/avatar_${index + 1}.png`;
      console.log(`Avatar URL set for ${userId} to ${avatarUrl}`);
    } else {
      console.warn(`Invalid avatarIndex received: ${avatarIndex} for user ${userId}`);
    }

    // 3. Create or Update Profile
    // Check if profile already exists (created by trigger or previous attempt)
    const { data: existingProfile } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const profilePayload: any = {
      id: userId,
      celular: formattedPhone,
      tipo: 'motorista',
      nome,
      cpf,
      profissao,
      data_nascimento: dataNascimento,
      verified: true,
      onboarding_completed: true, // Mark onboarding as complete
      updated_at: new Date().toISOString(),
    };

    // Add optional fields
    if (email && email.trim() !== "") profilePayload.email = email.trim();
    if (selfieUrl) profilePayload.selfie_url = selfieUrl;
    if (avatarUrl) profilePayload.avatar_url = avatarUrl;

    // Use upsert to handle both creation and updates
    const { error: profileError } = await supabaseServer
      .from("profiles")
      .upsert(profilePayload);

    if (profileError) {
      console.error(`Error creating/updating profile for user ${userId}:`, profileError);
      return NextResponse.json(
        { error: "Erro ao salvar perfil do motorista." },
        { status: 500 }
      );
    }

    // --- Success ---
    console.log(`Registration completed for user ${userId}`);

    // Check if Stripe account is connected
    const { data: stripeCheck } = await supabaseServer
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    const needsStripeOnboarding = !stripeCheck?.stripe_account_id;

    return NextResponse.json({
      userId,
      needsStripeOnboarding,
      redirectTo: needsStripeOnboarding ? '/motorista/stripe-onboarding' : '/motorista/dashboard'
    }, { status: 200 });

  } catch (err: any) {
    console.error("Unhandled error in complete-registration:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

