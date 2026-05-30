// Simple in-memory rate limiter
// For production with multiple instances, replace with Upstash Redis

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10

export function checkRateLimit(identifier: string): {
  success: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    }
    store.set(identifier, newEntry)
    // Cleanup old entries periodically
    if (store.size > 10000) {
      const keysToDelete: string[] = []
      store.forEach((val, key) => {
        if (now > val.resetAt) keysToDelete.push(key)
      })
      keysToDelete.forEach((k) => store.delete(k))
    }
    return { success: true, remaining: MAX_REQUESTS - 1, resetAt: newEntry.resetAt }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}
