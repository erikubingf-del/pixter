#!/usr/bin/env node
/**
 * Seed test accounts for QA:
 *   1. motorista.pendente@amopagar.test  – driver, no Stripe, no PIX
 *   2. motorista.stripe@amopagar.test    – driver, Stripe connected + PIX set
 *   3. cliente@amopagar.test             – client only, with trip history
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const PASSWORD = 'Teste@1234';

async function upsertUser({ email, nome, tipo, extra = {} }) {
  // Delete existing user by email so we can re-seed cleanly
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);
  if (found) {
    await supabase.auth.admin.deleteUser(found.id);
    console.log(`  deleted existing ${email}`);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nome, tipo },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);

  const userId = data.user.id;

  const { error: pe } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    nome,
    tipo,
    verified: true,
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...extra,
  });
  if (pe) throw new Error(`profile upsert ${email}: ${pe.message}`);

  return userId;
}

// ─── 1. Driver — pending (no Stripe, no PIX) ────────────────────────────────
console.log('\n[1] Creating pending driver...');
await upsertUser({
  email: 'motorista.pendente@amopagar.test',
  nome: 'Carlos Motorista',
  tipo: 'motorista',
  extra: {
    celular: '+5511991110001',
    profissao: 'Motorista de app',
    city: 'São Paulo',
  },
});
console.log('    ✓ motorista.pendente@amopagar.test');

// ─── 2. Driver — Stripe connected + PIX ─────────────────────────────────────
console.log('\n[2] Creating Stripe-connected driver...');
const stripeDriverId = await upsertUser({
  email: 'motorista.stripe@amopagar.test',
  nome: 'Ana Vendedora',
  tipo: 'motorista',
  extra: {
    celular: '+5511991110002',
    profissao: 'Vendedora ambulante',
    city: 'São Paulo',
    company_name: 'Ana Delivery',
    pix_key: '+5511991110002',
    stripe_account_id: 'acct_test_connected_mock',
    stripe_account_status: 'verified',
    stripe_account_charges_enabled: true,
    stripe_account_details_submitted: true,
    stripe_account_payouts_enabled: true,
    onboarding_completed: true,
  },
});
console.log('    ✓ motorista.stripe@amopagar.test');

// ─── 3. Client — with trip history ──────────────────────────────────────────
console.log('\n[3] Creating client with trip history...');
const clientId = await upsertUser({
  email: 'cliente@amopagar.test',
  nome: 'João Cliente',
  tipo: 'cliente',
  extra: {
    celular: '+5511991110003',
  },
});
console.log('    ✓ cliente@amopagar.test');

// Insert pagamentos for the client (using stripeDriverId as motorista)
const trips = [
  {
    descricao: 'Corrida para aeroporto GRU',
    categoria: 'Transporte',
    valor: 8750,   // R$ 87,50
    metodo: 'card',
    status: 'succeeded',
    notas: 'Reembolso viagem a trabalho — Sprint Q1',
    created_at: daysAgo(1),
  },
  {
    descricao: 'Corrida para reunião cliente Faria Lima',
    categoria: 'Transporte',
    valor: 3200,
    metodo: 'card',
    status: 'succeeded',
    notas: 'Cliente: Acme Corp',
    created_at: daysAgo(3),
  },
  {
    descricao: 'Corrida retorno reunião',
    categoria: 'Transporte',
    valor: 2900,
    metodo: 'pix',
    status: 'succeeded',
    notas: 'Cliente: Acme Corp',
    created_at: daysAgo(3),
  },
  {
    descricao: 'Entrega de documentos — centro',
    categoria: 'Entrega',
    valor: 1500,
    metodo: 'pix',
    status: 'succeeded',
    notas: '',
    created_at: daysAgo(7),
  },
  {
    descricao: 'Corrida para evento corporativo',
    categoria: 'Transporte',
    valor: 5500,
    metodo: 'card',
    status: 'succeeded',
    notas: 'Evento: All-hands março',
    created_at: daysAgo(10),
  },
  {
    descricao: 'Corrida para dentista',
    categoria: 'Saúde',
    valor: 2200,
    metodo: 'card',
    status: 'succeeded',
    notas: 'Pessoal — não reembolsar',
    created_at: daysAgo(14),
  },
  {
    descricao: 'Transporte para conferência DevConf SP',
    categoria: 'Transporte',
    valor: 4400,
    metodo: 'card',
    status: 'succeeded',
    notas: 'Conferência patrocinada pela empresa',
    created_at: daysAgo(20),
  },
  {
    descricao: 'Corrida ida — visita fornecedor',
    categoria: 'Transporte',
    valor: 3800,
    metodo: 'pix',
    status: 'succeeded',
    notas: 'Fornecedor: LogiTech LTDA',
    created_at: daysAgo(25),
  },
];

for (const trip of trips) {
  const fee = Math.round(trip.valor * 0.04);
  const { error } = await supabase.from('pagamentos').insert({
    motorista_id: stripeDriverId,
    cliente_id: clientId,
    valor: trip.valor,
    moeda: 'brl',
    status: trip.status,
    metodo: trip.metodo,
    application_fee_amount: fee,
    net_amount: trip.valor - fee,
    descricao: trip.descricao,
    categoria: trip.categoria,
    notas: trip.notas,
    receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
    created_at: trip.created_at,
    updated_at: trip.created_at,
  });
  if (error) throw new Error(`pagamento insert: ${error.message}`);
}
console.log(`    ✓ ${trips.length} trips inserted`);

console.log(`
╔══════════════════════════════════════════════════════════╗
║  Test Accounts — AmoPagar                               ║
╠══════════════════════════════════════════════════════════╣
║  Password for all: Teste@1234                           ║
╠══════════════════════════════════════════════════════════╣
║  [1] MOTORISTA — Pendente (sem Stripe, sem PIX)         ║
║      motorista.pendente@amopagar.test                   ║
║                                                          ║
║  [2] MOTORISTA — Stripe + PIX conectados                ║
║      motorista.stripe@amopagar.test                     ║
║                                                          ║
║  [3] CLIENTE — com 8 corridas no histórico              ║
║      cliente@amopagar.test                              ║
╚══════════════════════════════════════════════════════════╝
`);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
