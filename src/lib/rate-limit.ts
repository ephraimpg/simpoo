/** Small in-memory sliding-window rate limiter (per IP). */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 8;

// Survive dev hot-reloads by stashing buckets on globalThis.
const globalStore = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = (globalStore.__rateBuckets ??= new Map<string, Bucket>());

export function rateLimit(key: string): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  // Opportunistic cleanup so the map cannot grow forever.
  if (buckets.size > 500) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Stricter limiter for admin login attempts. */
export function loginRateLimit(key: string): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const loginKey = `login:${key}`;
  const windowMs = 15 * 60 * 1000;
  const max = 5;
  const bucket = buckets.get(loginKey);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(loginKey, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= max) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
