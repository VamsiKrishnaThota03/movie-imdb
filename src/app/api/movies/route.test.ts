import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitForTests } from '@/lib/server/rateLimit';

// Stub the OMDb client so no test makes a network call; the route's own
// validation and error mapping is what is under test.
const omdbMock = vi.fn();
vi.mock('@/lib/server/omdb', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server/omdb')>('@/lib/server/omdb');
  return { ...actual, omdb: (params: Record<string, string>) => omdbMock(params) };
});

const { GET } = await import('./route');
const { OmdbError } = await import('@/lib/server/omdb');

/** Build a request with a client IP, so each test gets its own rate bucket. */
function req(query: string, ip = '203.0.113.1') {
  return new NextRequest(`http://localhost/api/movies${query}`, {
    headers: { 'x-forwarded-for': ip },
  });
}

let ipCounter = 0;
const freshIp = () => `203.0.113.${(ipCounter += 1)}`;

beforeEach(() => {
  resetRateLimitForTests();
  omdbMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/movies validation', () => {
  it('rejects a term shorter than 3 characters without calling OMDb', async () => {
    const res = await GET(req('?q=ab', freshIp()));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/3-100/);
    // The point of validating first: a short query must not spend quota.
    expect(omdbMock).not.toHaveBeenCalled();
  });

  it('rejects a term longer than 100 characters', async () => {
    const res = await GET(req(`?q=${'a'.repeat(101)}`, freshIp()));
    expect(res.status).toBe(400);
    expect(omdbMock).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only term as empty', async () => {
    const res = await GET(req('?q=%20%20%20', freshIp()));
    expect(res.status).toBe(400);
    expect(omdbMock).not.toHaveBeenCalled();
  });

  it('rejects a non-integer, zero, negative or oversized page', async () => {
    for (const page of ['0', '-1', '1.5', '101', 'abc']) {
      const res = await GET(req(`?q=blade&page=${page}`, freshIp()));
      expect(res.status, `page=${page} should be rejected`).toBe(400);
    }
    expect(omdbMock).not.toHaveBeenCalled();
  });

  it('defaults to page 1', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: [], totalResults: '0' });
    await GET(req('?q=blade', freshIp()));
    expect(omdbMock).toHaveBeenCalledWith(expect.objectContaining({ page: '1' }));
  });

  it('only ever asks OMDb for movies, not series or episodes', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: [], totalResults: '0' });
    await GET(req('?q=blade', freshIp()));
    expect(omdbMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'movie' }));
  });
});

describe('GET /api/movies responses', () => {
  it('returns results and a numeric total', async () => {
    omdbMock.mockResolvedValue({
      Response: 'True',
      Search: [{ imdbID: 'tt0083658', Title: 'Blade Runner' }],
      totalResults: '42',
    });

    const res = await GET(req('?q=blade', freshIp()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    // OMDb returns totalResults as a string; the route normalises it.
    expect(body.totalResults).toBe(42);
  });

  it('turns OMDb\'s "Movie not found!" error into an empty result set', async () => {
    // OMDb reports "no matches" as an error, which is not an error for us.
    omdbMock.mockResolvedValue({ Response: 'False', Error: 'Movie not found!' });

    const res = await GET(req('?q=zzzzzznotathing', freshIp()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [], totalResults: 0 });
  });

  it('maps any other OMDb-reported error to 502', async () => {
    omdbMock.mockResolvedValue({ Response: 'False', Error: 'Too many results.' });

    const res = await GET(req('?q=blade', freshIp()));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('Too many results.');
  });

  it('defends against a malformed Search field', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: 'not-an-array', totalResults: 'x' });

    const res = await GET(req('?q=blade', freshIp()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [], totalResults: 0 });
  });

  it('propagates an OmdbError status, including the 503 for a missing key', async () => {
    omdbMock.mockRejectedValue(new OmdbError('OMDB_API_KEY is not configured', 503));

    const res = await GET(req('?q=blade', freshIp()));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/not configured/);
  });

  it('maps an unexpected exception to 500 without leaking its message', async () => {
    omdbMock.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:443'));

    const res = await GET(req('?q=blade', freshIp()));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Search failed');
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
    expect(JSON.stringify(body)).not.toContain('10.0.0.5');
  });
});

describe('GET /api/movies rate limiting', () => {
  it('refuses a burst with 429 and a Retry-After, and stops calling OMDb', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: [], totalResults: '0' });
    const ip = freshIp();

    let blocked: Response | undefined;
    for (let i = 0; i < 40; i += 1) {
      const res = await GET(req('?q=blade', ip));
      if (res.status === 429) {
        blocked = res;
        break;
      }
    }

    expect(blocked, 'expected a 429 within 40 requests').toBeDefined();
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
    expect(blocked!.headers.get('RateLimit-Remaining')).toBe('0');

    const callsAtBlock = omdbMock.mock.calls.length;
    await GET(req('?q=blade', ip));
    // A blocked request must not reach OMDb — that is the quota being saved.
    expect(omdbMock.mock.calls.length).toBe(callsAtBlock);
  });

  it('limits each caller independently', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: [], totalResults: '0' });
    const noisy = freshIp();
    for (let i = 0; i < 40; i += 1) await GET(req('?q=blade', noisy));

    const quiet = await GET(req('?q=blade', freshIp()));
    expect(quiet.status).not.toBe(429);
  });

  it('advertises the limit on successful responses too', async () => {
    omdbMock.mockResolvedValue({ Response: 'True', Search: [], totalResults: '0' });
    const res = await GET(req('?q=blade', freshIp()));
    expect(res.headers.get('RateLimit-Limit')).toBeTruthy();
    expect(res.headers.get('RateLimit-Remaining')).toBeTruthy();
  });

  it('counts rejected requests as well, so validation errors cannot be free', async () => {
    const ip = freshIp();
    const first = await GET(req('?q=ab', ip));
    const second = await GET(req('?q=ab', ip));
    expect(Number(first.headers.get('RateLimit-Remaining'))).toBeGreaterThan(
      Number(second.headers.get('RateLimit-Remaining'))
    );
  });
});
