/**
 * In-memory sliding window rate limiter.
 * Good for single-instance deployments. For distributed systems, use Redis.
 */

interface RateLimitRecord {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitRecord>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now - record.windowStart > 3600_000) {
      store.delete(key)
    }
  }
}, 300_000)

export interface RateLimitConfig {
  /** Number of requests allowed per window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = { limit: 5, windowMs: 3_600_000 }
): RateLimitResult {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now - record.windowStart > config.windowMs) {
    // Start a new window
    store.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    }
  }

  if (record.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.windowStart + config.windowMs,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetAt: record.windowStart + config.windowMs,
  }
}

/**
 * Rate limit key builders
 */
export const rateLimitKeys = {
  scrape: (userId: string) => `scrape:${userId}`,
  resume: (userId: string) => `resume:${userId}`,
  auth: (ip: string) => `auth:${ip}`,
}
