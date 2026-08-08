interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Simple in-memory fixed-window rate limiter — fine at this app's single-process scale
 * (no Redis/KV needed). Throws 429 once `max` is exceeded within `windowMs`.
 */
export function assertRateLimit(key: string, opts: { max: number; windowMs: number }) {
  const now = Date.now()

  for (const [k, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return
  }

  bucket.count++
  if (bucket.count > opts.max) {
    throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Tente de novo em alguns minutos.' })
  }
}
