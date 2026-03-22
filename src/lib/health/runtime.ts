import { lookup } from 'node:dns/promises';

type CheckStatus = 'ok' | 'warn' | 'error';
type OverallStatus = 'ok' | 'degraded' | 'error';

type DnsLookupResult = {
  address: string;
  family: number;
};

type StripeProbeResult = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
};

type RuntimeHealthOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  dnsLookup?: (hostname: string) => Promise<DnsLookupResult>;
  stripeProbe?: (secretKey: string) => Promise<StripeProbeResult>;
};

type ConfigurationCheck = {
  status: CheckStatus;
  missing: string[];
  placeholders: string[];
  optionalMissing: string[];
  message: string;
};

type SupabaseCheck = {
  status: CheckStatus;
  hostname: string | null;
  address?: string;
  family?: number;
  error?: string;
  message: string;
};

type StripeCheck = {
  status: CheckStatus;
  mode: 'test' | 'live' | 'unknown' | null;
  publishableMode: 'test' | 'live' | 'unknown' | null;
  accountId?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  error?: string;
  message: string;
};

export type RuntimeHealthReport = {
  status: OverallStatus;
  timestamp: string;
  checks: {
    configuration: ConfigurationCheck;
    supabase: SupabaseCheck;
    stripe: StripeCheck;
  };
};

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
] as const;

const OPTIONAL_ENV = ['STRIPE_WEBHOOK_SECRET'] as const;

function isPlaceholderValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  return /placeholder|replace_with|xxxxxxxx|your-random-32-character-secret-here|your-domain/i.test(
    value
  );
}

function inferStripeMode(key: string | undefined): 'test' | 'live' | 'unknown' {
  if (!key) {
    return 'unknown';
  }

  if (key.startsWith('sk_test_') || key.startsWith('pk_test_')) {
    return 'test';
  }

  if (key.startsWith('sk_live_') || key.startsWith('pk_live_')) {
    return 'live';
  }

  return 'unknown';
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function defaultStripeProbe(secretKey: string): Promise<StripeProbeResult> {
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(secretKey, {
    apiVersion: '2022-11-15',
  });

  const account = await stripe.accounts.retrieve();

  return {
    id: account.id,
    charges_enabled: Boolean(account.charges_enabled),
    payouts_enabled: Boolean(account.payouts_enabled),
  };
}

function getConfigurationCheck(env: RuntimeHealthOptions['env']): ConfigurationCheck {
  const source = env ?? process.env;
  const missing = REQUIRED_ENV.filter((key) => !source[key]);
  const placeholders = REQUIRED_ENV.filter((key) => isPlaceholderValue(source[key]));
  const optionalMissing = OPTIONAL_ENV.filter((key) => !source[key]);

  if (missing.length > 0 || placeholders.length > 0) {
    return {
      status: 'error',
      missing: [...missing],
      placeholders: [...placeholders],
      optionalMissing: [...optionalMissing],
      message: 'Required runtime environment is incomplete.',
    };
  }

  if (optionalMissing.length > 0) {
    return {
      status: 'warn',
      missing: [],
      placeholders: [],
      optionalMissing: [...optionalMissing],
      message: 'Optional runtime variables are missing.',
    };
  }

  return {
    status: 'ok',
    missing: [],
    placeholders: [],
    optionalMissing: [],
    message: 'Runtime environment variables are configured.',
  };
}

async function getSupabaseCheck(
  env: RuntimeHealthOptions['env'],
  dnsLookup: NonNullable<RuntimeHealthOptions['dnsLookup']>
): Promise<SupabaseCheck> {
  const source = env ?? process.env;
  const supabaseUrl = source.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl || isPlaceholderValue(supabaseUrl)) {
    return {
      status: 'error',
      hostname: null,
      message: 'Supabase URL is missing or still using a placeholder value.',
    };
  }

  let hostname: string;

  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch (error) {
    return {
      status: 'error',
      hostname: null,
      error: formatError(error),
      message: 'Supabase URL is not a valid URL.',
    };
  }

  try {
    const result = await dnsLookup(hostname);
    return {
      status: 'ok',
      hostname,
      address: result.address,
      family: result.family,
      message: 'Supabase hostname resolves correctly.',
    };
  } catch (error) {
    return {
      status: 'error',
      hostname,
      error: formatError(error),
      message: 'Supabase hostname does not resolve.',
    };
  }
}

async function getStripeCheck(
  env: RuntimeHealthOptions['env'],
  stripeProbe: NonNullable<RuntimeHealthOptions['stripeProbe']>
): Promise<StripeCheck> {
  const source = env ?? process.env;
  const secretKey = source.STRIPE_SECRET_KEY;
  const publishableKey = source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    return {
      status: 'error',
      mode: inferStripeMode(secretKey),
      publishableMode: inferStripeMode(publishableKey),
      message: 'Stripe keys are missing.',
    };
  }

  if (isPlaceholderValue(secretKey) || isPlaceholderValue(publishableKey)) {
    return {
      status: 'error',
      mode: inferStripeMode(secretKey),
      publishableMode: inferStripeMode(publishableKey),
      message: 'Stripe keys still contain placeholder values.',
    };
  }

  const secretMode = inferStripeMode(secretKey);
  const publishableMode = inferStripeMode(publishableKey);

  if (secretMode !== publishableMode) {
    return {
      status: 'error',
      mode: secretMode,
      publishableMode,
      error: `Stripe mode mismatch: secret key is ${secretMode} while publishable key is ${publishableMode}.`,
      message: 'Stripe key mode mismatch detected.',
    };
  }

  try {
    const account = await stripeProbe(secretKey);
    return {
      status: 'ok',
      mode: secretMode,
      publishableMode,
      accountId: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      message: 'Stripe API is reachable.',
    };
  } catch (error) {
    return {
      status: 'error',
      mode: secretMode,
      publishableMode,
      error: formatError(error),
      message: 'Stripe API probe failed.',
    };
  }
}

export async function getRuntimeHealthReport(
  options: RuntimeHealthOptions = {}
): Promise<RuntimeHealthReport> {
  const configuration = getConfigurationCheck(options.env);
  const supabase = await getSupabaseCheck(options.env, options.dnsLookup ?? lookup);
  const stripe = await getStripeCheck(options.env, options.stripeProbe ?? defaultStripeProbe);

  const checks = { configuration, supabase, stripe };
  const statuses = Object.values(checks).map((check) => check.status);

  const status: OverallStatus = statuses.includes('error')
    ? 'error'
    : statuses.includes('warn')
      ? 'degraded'
      : 'ok';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
  };
}
