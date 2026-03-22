import { getRuntimeHealthReport } from '../src/lib/health/runtime.ts';
import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(filePath);
    return;
  }

  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function formatList(values) {
  return values.length > 0 ? values.join(', ') : 'none';
}

function printCheck(label, check) {
  console.log(`- ${label}: ${check.status}`);
  if (check.message) {
    console.log(`  ${check.message}`);
  }
  if (Array.isArray(check.missing) && check.missing.length > 0) {
    console.log(`  missing: ${formatList(check.missing)}`);
  }
  if (Array.isArray(check.placeholders) && check.placeholders.length > 0) {
    console.log(`  placeholders: ${formatList(check.placeholders)}`);
  }
  if (Array.isArray(check.optionalMissing) && check.optionalMissing.length > 0) {
    console.log(`  optionalMissing: ${formatList(check.optionalMissing)}`);
  }
  if (check.hostname) {
    console.log(`  hostname: ${check.hostname}`);
  }
  if (check.address) {
    console.log(`  address: ${check.address} (IPv${check.family})`);
  }
  if (check.mode || check.publishableMode) {
    console.log(`  stripe mode: secret=${check.mode ?? 'unknown'} publishable=${check.publishableMode ?? 'unknown'}`);
  }
  if (check.accountId) {
    console.log(`  stripe account: ${check.accountId}`);
  }
  if (check.error) {
    console.log(`  error: ${check.error}`);
  }
}

loadLocalEnvFile('.env.local');
const report = await getRuntimeHealthReport();

console.log(`Runtime health: ${report.status}`);
console.log(`Timestamp: ${report.timestamp}`);
printCheck('configuration', report.checks.configuration);
printCheck('supabase', report.checks.supabase);
printCheck('stripe', report.checks.stripe);

if (report.status === 'error') {
  process.exitCode = 1;
}
