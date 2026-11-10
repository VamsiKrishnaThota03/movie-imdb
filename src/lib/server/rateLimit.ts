/**
 * Per-IP rate limiting for the OMDb proxy routes.
 *
 * Why this exists: the OMDb API key is server-only (good — see `omdb.ts`), but
 * that means the deployed app *is* the key. Anyone who finds the URL can call
 * `/api/movies` in a loop and burn the owner's daily quota, which on the free
 * tier is 1,000 requests. Hiding the key stops it being stolen; it does not
 * stop it being spent.
 *
 * Deliberately dependency-free and in-process: this is a single Vercel
 * deployment, and a fixed-window counter in memory is the right size of
 * solution. The trade-off is real and worth stating — serverless instances do
 * not share state, so the effective limit is per instance, and a burst spread
 * across cold starts can exceed it. For a demo protecting a free quota that is
 * fine; a service that needed a hard global limit would use Redis or Vercel KV.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
  limit: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 30;

// Module scope persists across requests within one warm instance.
const windows = new Map<string, Window>();

/**
 * Drop expired entries so the map cannot grow without bound from one-off IPs.
 * Called on each check; the map stays small enough that a full sweep is cheaper
 * than maintaining a second index.
 */
function evictExpired(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/**
 * Identify the caller.
 *
 * Vercel sets `x-forwarded-for` and strips any client-supplied value, so the
 * first entry is the real client. Taking the *first* entry matters: a caller
 * who sends their own `x-forwarded-for` would otherwise get to choose their own
 * bucket and reset the counter at will.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkRateLimit(
  key: string,
  { limit = DEFAULT_LIMIT, now = Date.now() }: { limit?: number; now?: number } = {}
): RateLimitResult {
  evictExpired(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, retryAfter: 0, limit };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { allowed: false, remaining: 0, retryAfter, limit };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfter, limit };
}

/** Headers describing the limit, in the RFC draft-7 shape. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
  };
  if (!result.allowed) headers['Retry-After'] = String(result.retryAfter);
  return headers;
}

/** Test-only: clear the in-memory windows between cases. */
export function resetRateLimitForTests() {
  windows.clear();
}
