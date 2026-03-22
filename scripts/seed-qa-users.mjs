#!/usr/bin/env node

import fs from 'node:fs';
import dns from 'node:dns/promises';
import path from 'node:path';
import process from 'node:process';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const ROOT_DIR = process.cwd();
const ALLOW_LIVE_ENVIRONMENT = process.argv.includes('--allow-live-environment');
const STRIPE_ALLOW_LIVE = process.argv.includes('--allow-live-stripe');
const SKIP_SAMPLE_DATA = process.argv.includes('--skip-sample-data');
const PLATFORM_FEE_RATE = 0.03;
const PLATFORM_FIXED_FEE_CENTS = 39;

loadEnvFile(path.join(ROOT_DIR, '.env'));
loadEnvFile(path.join(ROOT_DIR, '.env.local'));

const DEFAULT_PASSWORD = process.env.PIXTER_QA_PASSWORD || 'PixterTest123!';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeMode = stripeSecretKey?.startsWith('sk_live_')
  ? 'live'
  : stripeSecretKey?.startsWith('sk_test_')
  ? 'test'
  : 'missing';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (stripeMode === 'live' && !ALLOW_LIVE_ENVIRONMENT) {
  console.error(
    'Live Stripe key detected. Refusing to seed QA users without --allow-live-environment.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const stripe =
  stripeSecretKey && (stripeMode === 'test' || STRIPE_ALLOW_LIVE)
    ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    : null;

const qaUsers = [
  {
    key: 'client',
    email: 'qa.client@pixter.test',
    password: DEFAULT_PASSWORD,
    profile: {
      tipo: 'cliente',
      nome: 'Cliente QA',
      celular: '+5511994001001',
      cpf: null,
      profissao: null,
      data_nascimento: null,
      avatar_url: null,
      company_name: null,
      city: 'Sao Paulo',
      address: 'Avenida Paulista, 1000',
      verified: true,
      onboarding_completed: false,
      pix_key: null,
      stripe_account_id: null,
      stripe_account_status: 'unconnected',
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
    },
  },
  {
    key: 'driver_no_stripe',
    email: 'qa.driver.no-stripe@pixter.test',
    password: DEFAULT_PASSWORD,
    profile: {
      tipo: 'motorista',
      nome: 'Motorista QA Sem Stripe',
      celular: '+5511994001002',
      cpf: '52998224725',
      profissao: 'Motorista executivo',
      data_nascimento: '1989-06-12',
      avatar_url: '/images/avatars/avatar_2.png',
      company_name: 'Pixter Driver QA',
      city: 'Sao Paulo',
      address: 'Rua Haddock Lobo, 450',
      verified: true,
      onboarding_completed: true,
      pix_key: 'qa.driver.no-stripe@pixter.test',
      stripe_account_id: null,
      stripe_account_status: 'unconnected',
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
    },
  },
  {
    key: 'driver_pending_stripe',
    email: 'qa.driver.pending-stripe@pixter.test',
    password: DEFAULT_PASSWORD,
    profile: {
      tipo: 'motorista',
      nome: 'Motorista QA Stripe Pendente',
      celular: '+5511994001003',
      cpf: '11144477735',
      profissao: 'Motorista premium',
      data_nascimento: '1991-03-21',
      avatar_url: '/images/avatars/avatar_5.png',
      company_name: 'Pixter Connect QA',
      city: 'Sao Paulo',
      address: 'Rua Oscar Freire, 210',
      verified: true,
      onboarding_completed: true,
      pix_key: 'qa.driver.pending-stripe@pixter.test',
      stripe_account_id: null,
      stripe_account_status: 'unconnected',
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
    },
  },
];

const summary = [];

try {
  await assertSupabaseHostResolves(supabaseUrl);

  for (const qaUser of qaUsers) {
    const authUser = await ensureAuthUser(qaUser);
    await upsertProfile(authUser.id, qaUser.profile, qaUser.email);

    summary.push({
      key: qaUser.key,
      email: qaUser.email,
      password: qaUser.password,
      userId: authUser.id,
      tipo: qaUser.profile.tipo,
      phone: qaUser.profile.celular,
      stripeState: qaUser.key === 'driver_pending_stripe' ? 'pending_setup' : 'unconnected',
    });
  }

  const clientUser = getSummaryUser('client');
  const driverNoStripeUser = getSummaryUser('driver_no_stripe');
  const driverPendingStripeUser = getSummaryUser('driver_pending_stripe');

  await clearStripeConnectState(driverNoStripeUser.userId);

  let onboardingLink = null;
  let stripeAccountId = null;

  if (!stripe && stripeMode === 'live' && !STRIPE_ALLOW_LIVE) {
    console.warn('Stripe live key detected. Skipping automatic Stripe Connect account creation. Re-run with --allow-live-stripe to force it.');
  } else if (!stripe) {
    console.warn('STRIPE_SECRET_KEY not available. Pending Stripe QA user was created without a Stripe account.');
  } else {
    const stripeResult = await ensureStripePendingDriver(driverPendingStripeUser);
    onboardingLink = stripeResult.onboardingLink;
    stripeAccountId = stripeResult.accountId;
  }

  if (!SKIP_SAMPLE_DATA) {
    await seedPayments({
      clientUser,
      driverNoStripeUser,
      driverPendingStripeUser,
    });
  }

  console.log('\nQA users seeded successfully.\n');
  console.table(
    summary.map((user) => ({
      scenario: user.key,
      email: user.email,
      password: user.password,
      tipo: user.tipo,
      phone: user.phone,
    }))
  );

  console.log('\nProfile behavior:');
  console.log('- qa.client@pixter.test: pure client account.');
  console.log('- qa.driver.no-stripe@pixter.test: driver account with onboarding complete but no Stripe connection.');
  console.log('- qa.driver.pending-stripe@pixter.test: driver account with onboarding complete and Stripe Connect started when a test key is available.');

  if (stripeAccountId) {
    console.log(`\nPending Stripe account: ${stripeAccountId}`);
  }

  if (onboardingLink) {
    console.log(`Stripe onboarding link: ${onboardingLink}`);
  }

  console.log(`\nPublic payment route to test after onboarding: ${APP_URL}/5511994001003`);
  console.log('Client-only login page: /login');
  console.log('Driver login page: /motorista/login');
} catch (error) {
  console.error('Failed to seed QA users.');
  console.error(error);
  process.exit(1);
}

function getSummaryUser(key) {
  const user = summary.find((entry) => entry.key === key);
  if (!user) {
    throw new Error(`QA user not found in summary: ${key}`);
  }
  return user;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

async function assertSupabaseHostResolves(url) {
  const host = new URL(url).hostname;

  try {
    await dns.lookup(host);
  } catch (error) {
    throw new Error(`Supabase host does not resolve: ${host}`);
  }
}

async function ensureAuthUser(qaUser) {
  let userId = await findUserIdByEmail(qaUser.email);

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: qaUser.email,
      password: qaUser.password,
      email_confirm: true,
      user_metadata: {
        nome: qaUser.profile.nome,
        tipo: qaUser.profile.tipo,
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        userId = await findUserIdByEmail(qaUser.email);
      } else {
        throw error;
      }
    } else {
      userId = data.user?.id || null;
    }
  }

  if (!userId) {
    throw new Error(`Unable to create or resolve auth user for ${qaUser.email}`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: qaUser.password,
    email_confirm: true,
    user_metadata: {
      nome: qaUser.profile.nome,
      tipo: qaUser.profile.tipo,
    },
  });

  if (updateError) {
    throw updateError;
  }

  return { id: userId };
}

async function findUserIdByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.id) {
    return data.id;
  }

  const authQuery = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (authQuery.error && authQuery.error.code !== 'PGRST116') {
    return findUserIdByEmailViaAdmin(email);
  }

  return authQuery.data?.id || (await findUserIdByEmailViaAdmin(email));
}

async function findUserIdByEmailViaAdmin(email) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }
  }

  return null;
}

async function upsertProfile(userId, profile, email) {
  const payload = {
    id: userId,
    email,
    ...profile,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw error;
  }
}

async function clearStripeConnectState(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_account_id: null,
      stripe_account_status: 'unconnected',
      stripe_account_charges_enabled: false,
      stripe_account_payouts_enabled: false,
      stripe_account_details_submitted: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

async function ensureStripePendingDriver(user) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, nome, email, celular, stripe_account_id, stripe_account_status, stripe_account_charges_enabled, stripe_account_payouts_enabled, stripe_account_details_submitted'
    )
    .eq('id', user.userId)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error('Pending Stripe driver profile not found.');
  }

  let account = null;
  if (profile.stripe_account_id) {
    try {
      account = await stripe.accounts.retrieve(profile.stripe_account_id);
    } catch (error) {
      if (error?.code !== 'account_invalid') {
        throw error;
      }
    }
  }

  if (!account) {
    const { firstName, lastName } = splitName(profile.nome);
    account = await stripe.accounts.create({
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
        phone: profile.celular || undefined,
      },
      metadata: {
        qa_seed: 'true',
        scenario: 'driver_pending_stripe',
        supabaseUserId: profile.id,
      },
    });
  }

  const status = summarizeStripeStatus(account);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_account_id: account.id,
      stripe_account_status: status.status,
      stripe_account_charges_enabled: status.charges_enabled,
      stripe_account_payouts_enabled: status.payouts_enabled,
      stripe_account_details_submitted: status.details_submitted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (updateError) {
    throw updateError;
  }

  const onboardingLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${APP_URL}/motorista/stripe-refresh`,
    return_url: `${APP_URL}/motorista/stripe-success`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingLink: onboardingLink.url,
  };
}

function summarizeStripeStatus(account) {
  const pendingVerification = account.requirements?.pending_verification || [];
  const pastDue = account.requirements?.past_due || [];
  const disabledReason = account.requirements?.disabled_reason || null;

  let status = 'pending';
  if (disabledReason || pastDue.length > 0) {
    status = 'restricted';
  } else if (account.charges_enabled && account.payouts_enabled) {
    status = pendingVerification.length > 0 ? 'pending' : 'verified';
  }

  return {
    status,
    charges_enabled: Boolean(account.charges_enabled),
    payouts_enabled: Boolean(account.payouts_enabled),
    details_submitted: Boolean(account.details_submitted),
  };
}

function splitName(fullName) {
  if (!fullName) {
    return { firstName: undefined, lastName: undefined };
  }

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(' ') : undefined,
  };
}

async function seedPayments({ clientUser, driverNoStripeUser, driverPendingStripeUser }) {
  const payments = [
    buildSeedPayment({
      key: 'client_to_driver_no_stripe',
      amountCents: 4250,
      motoristaId: driverNoStripeUser.userId,
      clienteId: clientUser.userId,
      metodo: 'card',
      description: 'Corrida teste Centro -> Paulista',
      receiptNumber: 'SEED-QA-001',
      createdAt: daysAgoIso(2),
    }),
    buildSeedPayment({
      key: 'client_to_driver_pending_stripe',
      amountCents: 7890,
      motoristaId: driverPendingStripeUser.userId,
      clienteId: clientUser.userId,
      metodo: 'apple_pay',
      description: 'Corrida teste Itaim -> Congonhas',
      receiptNumber: 'SEED-QA-002',
      createdAt: daysAgoIso(5),
    }),
    buildSeedPayment({
      key: 'driver_no_stripe_as_client',
      amountCents: 1590,
      motoristaId: driverPendingStripeUser.userId,
      clienteId: driverNoStripeUser.userId,
      metodo: 'pix',
      description: 'Pagamento cliente QA motorista sem Stripe',
      receiptNumber: 'SEED-QA-003',
      createdAt: daysAgoIso(9),
    }),
    buildSeedPayment({
      key: 'driver_pending_as_client',
      amountCents: 2130,
      motoristaId: driverNoStripeUser.userId,
      clienteId: driverPendingStripeUser.userId,
      metodo: 'google_pay',
      description: 'Pagamento cliente QA motorista Stripe pendente',
      receiptNumber: 'SEED-QA-004',
      createdAt: daysAgoIso(15),
    }),
  ];

  const { error } = await supabase.from('pagamentos').upsert(payments, {
    onConflict: 'stripe_payment_id',
  });

  if (error) {
    throw error;
  }
}

function buildSeedPayment({
  key,
  amountCents,
  motoristaId,
  clienteId,
  metodo,
  description,
  receiptNumber,
  createdAt,
}) {
  const feeCents = Math.round(amountCents * PLATFORM_FEE_RATE + PLATFORM_FIXED_FEE_CENTS);
  const netCents = amountCents - feeCents;

  return {
    stripe_payment_id: `seed_pi_${key}`,
    stripe_charge_id: `seed_ch_${key}`,
    motorista_id: motoristaId,
    cliente_id: clienteId,
    valor: centsToDecimal(amountCents),
    moeda: 'brl',
    status: 'succeeded',
    metodo,
    application_fee_amount: centsToDecimal(feeCents),
    net_amount: centsToDecimal(netCents),
    receipt_number: receiptNumber,
    categoria: 'transport',
    notas: 'Registro gerado automaticamente para QA.',
    descricao: description,
    metadata: {
      seeded: true,
      source: 'seed-qa-users',
      scenario: key,
    },
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  };
}

function centsToDecimal(value) {
  return (value / 100).toFixed(2);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 30, 0, 0);
  return date.toISOString();
}
