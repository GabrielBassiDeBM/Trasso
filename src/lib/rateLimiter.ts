/**
 * Best-effort in-memory fixed-window rate limiter.
 *
 * TODO(production): this resets on every deploy/restart and is per-instance,
 * so it does not hold up across multiple serverless instances or regions.
 * Before scaling beyond a single server, replace this with a shared store
 * (e.g. Upstash Redis / @upstash/ratelimit) keyed the same way.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget old buckets so this Map doesn't grow without bound.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function takeToken(key: string, limit: number, windowMs: number): RateLimitResult {
  sweep();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort client IP extraction behind a proxy/CDN (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
