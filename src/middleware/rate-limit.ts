/**
 * Supabase-based rate limiter for serverless environments.
 * Uses the `rate_limits` table to persist rate limit state across invocations.
 *
 * For high-traffic production use, consider upgrading to Upstash Redis.
 */

import { supabaseServer } from '@/lib/supabase/client';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Check if the given key has exceeded its rate limit.
 *
 * @param key - Unique identifier (e.g. "payment:192.168.1.1" or "auth:user@email.com")
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 */
export async function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  try {
    // Count requests in the current window
    const { count, error: countError } = await supabaseServer
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('Rate limit count error:', countError.message);
      // Fail open: allow the request if we can't check the rate limit
      return { success: true, remaining: limit };
    }

    const currentCount = count ?? 0;

    if (currentCount >= limit) {
      return { success: false, remaining: 0 };
    }

    // Record this request
    const { error: insertError } = await supabaseServer
      .from('rate_limits')
      .insert({ key });

    if (insertError) {
      console.error('Rate limit insert error:', insertError.message);
      // Fail open
      return { success: true, remaining: limit - currentCount };
    }

    return {
      success: true,
      remaining: limit - currentCount - 1,
    };
  } catch (err) {
    console.error('Rate limit error:', err);
    // Fail open on unexpected errors
    return { success: true, remaining: limit };
  }
}

/**
 * Clean up expired rate limit entries.
 * Call this periodically (e.g. via a cron job or Supabase scheduled function).
 */
export async function cleanupRateLimits(olderThanMs: number = 300000) {
  const cutoff = new Date(Date.now() - olderThanMs).toISOString();

  const { error } = await supabaseServer
    .from('rate_limits')
    .delete()
    .lt('created_at', cutoff);

  if (error) {
    console.error('Rate limit cleanup error:', error.message);
  }
}
