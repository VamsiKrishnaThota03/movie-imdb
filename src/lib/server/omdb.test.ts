import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OmdbError, omdb } from './omdb';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv('OMDB_API_KEY', 'test-key');
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
});

/** Replace fetch and capture the URL it was called with. */
function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const calls: string[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      ...response,
    } as Response;
  }) as typeof fetch;
  return calls;
}

describe('omdb', () => {
  it('fails with a 503 when no key is configured, and says so', async () => {
    vi.stubEnv('OMDB_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_OMDB_API_KEY', '');

    await expect(omdb({ s: 'blade' })).rejects.toMatchObject({
      status: 503,
    });
    await expect(omdb({ s: 'blade' })).rejects.toThrow(/not configured/i);
  });

  it('sends the key as a query parameter and passes through the caller params', async () => {
    const calls = stubFetch({ json: async () => ({ Response: 'True' }) });
    await omdb({ s: 'blade runner', type: 'movie' });

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]);
    expect(url.origin + url.pathname).toBe('https://www.omdbapi.com/');
    expect(url.searchParams.get('apikey')).toBe('test-key');
    expect(url.searchParams.get('s')).toBe('blade runner');
    expect(url.searchParams.get('type')).toBe('movie');
  });

  it('accepts the legacy NEXT_PUBLIC_ key, but only server-side', async () => {
    // The variable name is public by convention; reading it here (on the
    // server) is what keeps the value off the client bundle.
    vi.stubEnv('OMDB_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_OMDB_API_KEY', 'legacy-key');
    const calls = stubFetch({ json: async () => ({ Response: 'True' }) });

    await omdb({ i: 'tt0083658' });
    expect(new URL(calls[0]).searchParams.get('apikey')).toBe('legacy-key');
  });

  it('maps a network failure to 502 without leaking the URL or key', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    const error = await omdb({ s: 'x' }).catch((e) => e);
    expect(error).toBeInstanceOf(OmdbError);
    expect(error.status).toBe(502);
    expect(error.message).not.toContain('test-key');
    expect(error.message).not.toContain('apikey');
  });

  it('maps a rejected key to 502 rather than surfacing 401 to the browser', async () => {
    // A 401 from OMDb is our configuration problem, not the caller's.
    stubFetch({ ok: false, status: 401 });

    const error = await omdb({ s: 'x' }).catch((e) => e);
    expect(error.status).toBe(502);
    expect(error.message).toMatch(/rejected/i);
  });

  it('maps any other non-ok status to 502 and includes it for diagnosis', async () => {
    stubFetch({ ok: false, status: 500 });

    const error = await omdb({ s: 'x' }).catch((e) => e);
    expect(error.status).toBe(502);
    expect(error.message).toContain('500');
  });

  it('never puts the API key in an error message', async () => {
    for (const stub of [{ ok: false, status: 401 }, { ok: false, status: 503 }]) {
      stubFetch(stub);
      const error = await omdb({ s: 'x' }).catch((e) => e);
      expect(String(error.message)).not.toContain('test-key');
    }
  });

  it('returns the parsed JSON on success', async () => {
    stubFetch({ json: async () => ({ Response: 'True', Title: 'Blade Runner' }) });
    await expect(omdb({ i: 'tt0083658' })).resolves.toEqual({
      Response: 'True',
      Title: 'Blade Runner',
    });
  });
});
