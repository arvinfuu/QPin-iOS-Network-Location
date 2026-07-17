/**
 * Simple in-memory token bucket rate limiter (per isolate).
 * Suitable for Cloudflare Workers free tier personal use.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in ms */
  windowMs: number;
}

const DEFAULTS: RateLimitOptions = {
  limit: 60,
  windowMs: 60_000,
};

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = DEFAULTS
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: options.limit, updatedAt: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.updatedAt;
  if (elapsed >= options.windowMs) {
    bucket.tokens = options.limit;
    bucket.updatedAt = now;
  }

  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

/** Test helper */
export function __resetRateLimits(): void {
  buckets.clear();
}
