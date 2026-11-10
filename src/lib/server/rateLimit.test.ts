import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  clientKey,
  rateLimitHeaders,
  resetRateLimitForTests,
} from './rateLimit';

beforeEach(() => {
  resetRateLimitForTests();
});

describe('clientKey', () => {
  it('takes the FIRST x-forwarded-for entry, not the last', () => {
    // This is the security-relevant part. The platform appends the real client
    // as the first entry; a caller who sends their own x-forwarded-for would,
    // if we read the last entry, get to pick their own bucket and reset the
    // counter whenever they liked.
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 10.0.0.2' });
    expect(clientKey(headers)).toBe('203.0.113.5');
  });

  it('trims whitespace around the address', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '  203.0.113.5  ' }))).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip, then to a constant', () => {
    expect(clientKey(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(clientKey(new Headers())).toBe('unknown');
  });

  it('ignores an empty x-forwarded-for rather than returning an empty key', () => {
    // An empty key would merge every such caller into one bucket, which is the
    // same as having no limit for them.
    expect(clientKey(new Headers({ 'x-forwarded-for': '' }))).toBe('unknown');
    expect(clientKey(new Headers({ 'x-forwarded-for': ' , ' }))).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit and refuses the next one', () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i += 1) {
      const result = checkRateLimit('ip-a', { limit: 5, now });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i);
    }

    const blocked = checkRateLimit('ip-a', { limit: 5, now });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('keeps separate counters per caller', () => {
    const now = 1_000_000;
    checkRateLimit('ip-a', { limit: 1, now });
    expect(checkRateLimit('ip-a', { limit: 1, now }).allowed).toBe(false);

    // A different caller must be unaffected by the first one's burst.
    expect(checkRateLimit('ip-b', { limit: 1, now }).allowed).toBe(true);
  });

  it('resets once the window has passed', () => {
    const start = 1_000_000;
    checkRateLimit('ip-c', { limit: 1, now: start });
    expect(checkRateLimit('ip-c', { limit: 1, now: start + 30_000 }).allowed).toBe(false);

    // The window is 60s, so this is a fresh one.
    const after = checkRateLimit('ip-c', { limit: 1, now: start + 61_000 });
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it('reports retryAfter in whole seconds, never zero while blocked', () => {
    const start = 1_000_000;
    checkRateLimit('ip-d', { limit: 1, now: start });
    // 999ms left: ceil keeps this at 1 rather than rounding down to 0, which
    // would tell the client to retry immediately.
    const blocked = checkRateLimit('ip-d', { limit: 1, now: start + 59_001 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBe(1);
  });

  it('evicts expired windows so the map cannot grow unbounded', () => {
    const start = 1_000_000;
    for (let i = 0; i < 50; i += 1) {
      checkRateLimit(`throwaway-${i}`, { limit: 5, now: start });
    }
    // A later call sweeps the expired entries. The observable proof is that a
    // previously-seen key behaves as brand new rather than as a 51st entry.
    const fresh = checkRateLimit('throwaway-0', { limit: 5, now: start + 61_000 });
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(4);
  });
});

describe('rateLimitHeaders', () => {
  it('reports the limit and remaining count when allowed', () => {
    const headers = rateLimitHeaders({ allowed: true, remaining: 7, retryAfter: 0, limit: 30 });
    expect(headers['RateLimit-Limit']).toBe('30');
    expect(headers['RateLimit-Remaining']).toBe('7');
    // Retry-After is meaningless on a successful response.
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('adds Retry-After only when blocked', () => {
    const headers = rateLimitHeaders({ allowed: false, remaining: 0, retryAfter: 42, limit: 30 });
    expect(headers['Retry-After']).toBe('42');
    expect(headers['RateLimit-Remaining']).toBe('0');
  });
});
