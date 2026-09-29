/**
 * Simple in-memory rate limiter for single-instance deployments.
 * For production with multiple instances, replace with Redis/Upstash.
 */

interface Bucket { count: number; resetAt: number; }
const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) { if (bucket.resetAt <= now) buckets.delete(key); }
}

export interface RateLimitOptions { limit: number; windowMs: number; identifier: string; }
export interface RateLimitResult { success: boolean; remaining: number; resetAt: number; retryAfterSeconds: number; }

export function rateLimit({ limit, windowMs, identifier }: RateLimitOptions): RateLimitResult {
  cleanup();
  const now = Date.now();
  const bucket = buckets.get(identifier);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  return realIp || 'local';
}
