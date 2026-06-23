import { takeToken, getClientIp, type RateLimitResult } from "@/lib/rateLimiter";

// Per-IP short-window throttle, independent of the per-user daily quota in
// ratelimit.ts — slows down a single client hammering the (expensive) AI
// endpoints even if they cycle accounts, and limits damage from a
// compromised session. Route-handler-only (not a Server Action).
const IP_WINDOW_MS = 60_000;
const IP_LIMITS: Record<string, number> = {
  ai: 10,
  "ai-scan": 5,
};

export function checkIpRateLimit(req: Request, bucket: string): RateLimitResult {
  const ip = getClientIp(req.headers);
  const limit = IP_LIMITS[bucket] ?? 10;
  return takeToken(`${bucket}:${ip}`, limit, IP_WINDOW_MS);
}
