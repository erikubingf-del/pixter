#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const envFilePath = path.join(ROOT_DIR, '.env.local');
const appUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

const statusOutput = execFileSync(
  'npx',
  [
    'supabase',
    'status',
    '-o',
    'env',
    '--override-name',
    'api.url=NEXT_PUBLIC_SUPABASE_URL',
    '--override-name',
    'auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY',
    '--override-name',
    'auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY',
  ],
  {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

const localEnv = parseEnvBlock(statusOutput);
const requiredKeys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingKeys = requiredKeys.filter((key) => !localEnv[key]);
if (missingKeys.length > 0) {
  console.error('Local Supabase status did not return the expected values.');
  console.error(`Missing: ${missingKeys.join(', ')}`);
  process.exit(1);
}

if (!fs.existsSync(envFilePath)) {
  console.error(`Missing ${envFilePath}.`);
  process.exit(1);
}

const currentEnv = fs.readFileSync(envFilePath, 'utf8');
const replacements = {
  NEXT_PUBLIC_SUPABASE_URL: localEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: localEnv.SUPABASE_SERVICE_ROLE_KEY,
  NEXTAUTH_URL: appUrl,
  NEXT_PUBLIC_APP_URL: appUrl,
};

const nextEnv = updateEnvFile(currentEnv, replacements);
fs.writeFileSync(envFilePath, nextEnv);

console.log(`Updated ${envFilePath} to use the local Supabase stack.`);
console.log(`App URL: ${appUrl}`);
console.log(`Supabase URL: ${localEnv.NEXT_PUBLIC_SUPABASE_URL}`);

function parseEnvBlock(value) {
  const entries = {};

  for (const rawLine of value.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let envValue = line.slice(separatorIndex + 1).trim();

    if (
      (envValue.startsWith('"') && envValue.endsWith('"')) ||
      (envValue.startsWith("'") && envValue.endsWith("'"))
    ) {
      envValue = envValue.slice(1, -1);
    }

    entries[key] = envValue;
  }

  return entries;
}

function updateEnvFile(fileContents, replacements) {
  const lines = fileContents.split('\n');
  const seen = new Set();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!(key in replacements)) {
      return line;
    }

    seen.add(key);
    return `${key}=${replacements[key]}`;
  });

  for (const [key, value] of Object.entries(replacements)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  return nextLines.join('\n');
}
