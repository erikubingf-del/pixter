/**
 * Simple in-memory rate limiter
 * For production, use Redis or Upstash
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  // Clean up old entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key]
  }

  // Initialize if doesn't exist
  if (!store[key]) {
    store[key] = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  // Increment
  store[key].count++

  // Check limit
  if (store[key].count > limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: store[key].resetTime
    }
  }

  return {
    success: true,
    remaining: limit - store[key].count,
    resetTime: store[key].resetTime
  }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)
