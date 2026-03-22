import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuthSession, hasDriverCapability } from '@/lib/auth/get-session';
import { supabaseServer } from '@/lib/supabase/client';
import { isDriverOnboardingComplete } from '@/lib/auth/driver-profile';

export const dynamic = 'force-dynamic';

export default async function MotoristaDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const canUseDriverView =
    session.tipo === 'motorista' ? true : await hasDriverCapability(session.id);

  if (!canUseDriverView) {
    redirect('/cliente/dashboard');
  }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select(
      'id, nome, cpf, data_nascimento, celular, profissao, onboarding_completed, stripe_account_id, stripe_account_charges_enabled, stripe_account_payouts_enabled, pix_key'
    )
    .eq('id', session.id)
    .maybeSingle();

  if (!isDriverOnboardingComplete(profile)) {
    redirect('/motorista/cadastro');
  }

  // Allow access if driver has either Stripe ready OR a PIX key configured.
  // Do NOT redirect to stripe-onboarding here — that causes a redirect loop
  // when the driver is PIX-only or when Stripe sync is slow.

  return <>{children}</>;
}
