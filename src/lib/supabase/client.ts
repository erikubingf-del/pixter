/* ──────────────────────────────────────────────────────────────
   src/lib/supabase/client.ts
   ────────────────────────────────────────────────────────────── */
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/*──────────────── VARIÁVEIS DE AMBIENTE ───────────────*/
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Placeholder values for build time
const buildTimeUrl = 'https://placeholder.supabase.co';
const buildTimeAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';
const buildTimeServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.placeholder';

/*──────────────── SERVER CLIENT (service role) ────────────────────────────*/
export const supabaseServer = createClient(
  supabaseUrl || buildTimeUrl,
  supabaseServiceKey || buildTimeServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export const supabaseAdmin = supabaseServer;

export function createServerAuthClient() {
  return createClient(
    supabaseUrl || buildTimeUrl,
    supabaseAnonKey || buildTimeAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
}

/*──────────────── BROWSER CLIENT (anon key) ────────────────────────────*/
export function createBrowserClient() {
  return createClientComponentClient();
}

/*──────────────── UTIL ────────────────────────────────*/
export const formatPhoneNumber = (phone: string, code = '55') => {
  if (code !== '55') {
    throw new Error('Apenas números brasileiros (+55) são aceitos no momento');
  }

  if (phone.startsWith('+')) {
    if (!phone.startsWith('+55')) {
      throw new Error('Apenas números brasileiros (+55) são aceitos no momento');
    }
    return phone;
  }

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    throw new Error('Número de telefone inválido. Use o formato: (11) 99999-9999');
  }

  if (code === '55' && digitsOnly.startsWith('0')) {
    return `+${code}${digitsOnly.substring(1)}`;
  }

  return digitsOnly.startsWith(code) ? `+${digitsOnly}` : `+${code}${digitsOnly}`;
};

/*──────────────── EMAIL/PASSWORD SIGNUP (Client-Side) ──*/
export async function signUpWithEmail(email: string, password: string, optionsData?: { celular?: string; nome?: string; cpf?: string; tipo?: string }) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: optionsData },
  });

  if (error) {
    return { success: false, message: `Falha no cadastro: ${error.message}` };
  }

  if (data.user && data.user.identities && data.user.identities.length > 0) {
    return { success: true, message: 'Cadastro iniciado! Verifique seu email para confirmar sua conta.' };
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      success: false,
      message: 'Este email já está registrado mas precisa de verificação. Verifique sua caixa de entrada.'
    };
  }

  return { success: false, message: 'Erro inesperado durante o cadastro. Tente novamente.' };
}

/*──────────────── sign-in OTP via telefone (Client-Side) ──*/
export const signInWithPhone = (phone: string) => {
  const supabase = createBrowserClient();
  const formattedPhone = formatPhoneNumber(phone);
  return supabase.auth.signInWithOtp({ phone: formattedPhone });
};

/*──────────────── CRUD perfil / storage (Client-Side) ──*/
export const getProfile = (id: string) => {
  const supabase = createBrowserClient();
  return supabase.from("profiles").select("*").eq("id", id).single();
};

export const updateProfile = (id: string, updates: Record<string, any>) => {
  const supabase = createBrowserClient();
  return supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
};

export const uploadImage = (bucket: string, path: string, file: File) => {
  const supabase = createBrowserClient();
  return supabase.storage.from(bucket).upload(path, file, { upsert: true });
};

export const getImageUrl = (bucket: string, path: string) => {
  const supabase = createBrowserClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/*──────────────── DRIVER via TELEFONE (Server-Side ONLY) ──*/
export const createDriverWithPhone = async (
  phone: string,
  userData: Record<string, any>
) => {
  const sanitizedPhoneDigits = phone.replace(/\D/g, '');
  const emailProvided = userData.email && userData.email.trim() !== '' ? userData.email.trim() : null;

  const { data: dupPhoneData, error: dupPhoneError } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (dupPhoneError) console.error('Error checking duplicate phone:', dupPhoneError.message);
  if (dupPhoneData) return { error: new Error('phone_exists') };

  if (emailProvided) {
    const { data: dupEmailData, error: dupEmailError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', emailProvided)
      .maybeSingle();
    if (dupEmailError) console.error('Error checking duplicate email:', dupEmailError.message);
    if (dupEmailData) return { error: new Error('email_exists') };
  }

  const email = emailProvided ?? `${sanitizedPhoneDigits}-${Date.now()}@amopagar-temp.com`;
  const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    phone,
    password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { tipo: 'motorista', nome: userData.nome }
  });

  if (authErr) {
    return { error: authErr };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: new Error('User creation failed unexpectedly.') };
  }

  const profilePayload: Record<string, any> = {
    id: userId,
    celular: phone,
    tipo: 'motorista',
    nome: userData.nome,
    cpf: userData.cpf,
    email: emailProvided,
    updated_at: new Date().toISOString(),
    verified: true
  };

  Object.keys(profilePayload).forEach(key => profilePayload[key] === undefined && delete profilePayload[key]);

  const { error: profileErr } = await supabaseServer
    .from('profiles')
    .upsert(profilePayload);

  if (profileErr) {
    return { error: profileErr };
  }

  return { data: { user: authData.user }, error: null };
};
