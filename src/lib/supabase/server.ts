import { createClient } from '@supabase/supabase-js';

// Use placeholder values during build when env vars unavailable
// Real values will be used at runtime in Vercel with proper env vars
const buildTimeUrl = 'https://xxxxxxxxxxx.supabase.co'; // Valid format for build
const buildTimeKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'; // Valid JWT format

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || buildTimeUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || buildTimeKey
);
