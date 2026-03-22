import type Stripe from 'stripe';
import stripe from '@/lib/stripe/server';
import { supabaseServer } from '@/lib/supabase/client';

export type ConnectAccountStatus =
  | 'unconnected'
  | 'pending'
  | 'restricted'
  | 'verified'
  | 'rejected';

export type ConnectAccountSummary = {
  connected: boolean;
  ready: boolean;
  status: ConnectAccountStatus;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
    disabled_reason: string | null;
  };
};

type DriverProfileForConnect = {
  id: string;
  email: string | null;
  nome: string | null;
  celular: string | null;
  stripe_account_id: string | null;
};

export type StoredConnectAccountFields = {
  stripe_account_id: string | null;
  stripe_account_status?: ConnectAccountStatus | null;
  stripe_account_charges_enabled?: boolean | null;
  stripe_account_payouts_enabled?: boolean | null;
  stripe_account_details_submitted?: boolean | null;
};

const EMPTY_REQUIREMENTS = {
  currently_due: [] as string[],
  eventually_due: [] as string[],
  past_due: [] as string[],
  pending_verification: [] as string[],
  disabled_reason: null as string | null,
};

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function splitName(fullName: string | null | undefined) {
  if (!fullName) {
    return { firstName: undefined, lastName: undefined };
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: undefined, lastName: undefined };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(' ') : undefined,
  };
}

function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return undefined;
  }

  return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
}

export function summarizeStripeAccount(account: Stripe.Account): ConnectAccountSummary {
  const requirements = {
    currently_due: account.requirements?.currently_due || [],
    eventually_due: account.requirements?.eventually_due || [],
    past_due: account.requirements?.past_due || [],
    pending_verification: account.requirements?.pending_verification || [],
    disabled_reason: account.requirements?.disabled_reason || null,
  };

  let status: ConnectAccountStatus = 'pending';

  if (requirements.disabled_reason?.includes('rejected')) {
    status = 'rejected';
  } else if (account.charges_enabled && account.payouts_enabled) {
    status = requirements.pending_verification.length > 0 ? 'pending' : 'verified';
  } else if (requirements.past_due.length > 0 || requirements.disabled_reason) {
    status = 'restricted';
  }

  return {
    connected: true,
    ready: account.charges_enabled && account.payouts_enabled,
    status,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements,
  };
}

export function isStripeAccountReady(profile: StoredConnectAccountFields | null | undefined): boolean {
  return Boolean(
    profile?.stripe_account_id &&
      profile.stripe_account_charges_enabled &&
      profile.stripe_account_payouts_enabled
  );
}

export function getPendingStripeSummary(): ConnectAccountSummary {
  return {
    connected: true,
    ready: false,
    status: 'pending',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    requirements: EMPTY_REQUIREMENTS,
  };
}

export function summarizeStoredStripeAccount(
  profile: StoredConnectAccountFields | null | undefined
): ConnectAccountSummary {
  if (!profile?.stripe_account_id) {
    return getDisconnectedStripeSummary();
  }

  const ready = isStripeAccountReady(profile);

  return {
    connected: true,
    ready,
    status: profile.stripe_account_status || (ready ? 'verified' : 'pending'),
    charges_enabled: Boolean(profile.stripe_account_charges_enabled),
    payouts_enabled: Boolean(profile.stripe_account_payouts_enabled),
    details_submitted: Boolean(profile.stripe_account_details_submitted),
    requirements: EMPTY_REQUIREMENTS,
  };
}

export async function syncStripeAccountState(
  profileId: string,
  stripeAccountId: string
): Promise<{ account: Stripe.Account; summary: ConnectAccountSummary }> {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const summary = summarizeStripeAccount(account);

  await supabaseServer
    .from('profiles')
    .update({
      stripe_account_charges_enabled: summary.charges_enabled,
      stripe_account_payouts_enabled: summary.payouts_enabled,
      stripe_account_details_submitted: summary.details_submitted,
      stripe_account_status: summary.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  return { account, summary };
}

export async function ensureStripeConnectAccount(
  profile: DriverProfileForConnect
): Promise<string> {
  if (profile.stripe_account_id) {
    return profile.stripe_account_id;
  }

  const { firstName, lastName } = splitName(profile.nome);

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'BR',
    email: profile.email || undefined,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    individual: {
      first_name: firstName,
      last_name: lastName,
      email: profile.email || undefined,
      phone: normalizePhone(profile.celular),
    },
    metadata: {
      supabaseUserId: profile.id,
      user_type: 'motorista',
    },
  });

  await supabaseServer
    .from('profiles')
    .update({
      stripe_account_id: account.id,
      stripe_account_status: 'pending',
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  return account.id;
}

export async function resetStripeConnectState(profileId: string) {
  await supabaseServer
    .from('profiles')
    .update({
      stripe_account_id: null,
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
      stripe_account_status: 'unconnected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);
}

export async function createStripeOnboardingLink(accountId: string) {
  const appUrl = getAppUrl();

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/motorista/stripe-refresh`,
    return_url: `${appUrl}/motorista/stripe-success`,
    type: 'account_onboarding',
  });
}

export function getDisconnectedStripeSummary(): ConnectAccountSummary {
  return {
    connected: false,
    ready: false,
    status: 'unconnected',
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    requirements: EMPTY_REQUIREMENTS,
  };
}
