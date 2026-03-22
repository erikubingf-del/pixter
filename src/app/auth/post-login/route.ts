import { NextResponse } from 'next/server';
import { getAuthSession, hasDriverCapability } from '@/lib/auth/get-session';
import { sanitizeInternalCallbackUrl } from '@/lib/utils/navigation';
import { supabaseServer } from '@/lib/supabase/client';
import { isDriverOnboardingComplete } from '@/lib/auth/driver-profile';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getAuthSession();
  const url = new URL(request.url);
  const callbackUrl = sanitizeInternalCallbackUrl(url.searchParams.get('callbackUrl'), '');

  if (!session) {
    const loginUrl = new URL('/login', url.origin);
    if (callbackUrl) {
      loginUrl.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (callbackUrl) {
    return NextResponse.redirect(new URL(callbackUrl, url.origin));
  }

  const useDriverView =
    session.tipo === 'motorista' ? true : await hasDriverCapability(session.id);

  if (useDriverView) {
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('nome, cpf, data_nascimento, celular, profissao, onboarding_completed')
      .eq('id', session.id)
      .maybeSingle();

    if (!isDriverOnboardingComplete(profile)) {
      return NextResponse.redirect(new URL('/motorista/cadastro', url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(useDriverView ? '/motorista/dashboard/overview' : '/cliente/dashboard', url.origin)
  );
}
