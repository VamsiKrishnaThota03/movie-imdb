const BASE_URL = 'https://www.omdbapi.com/';

export class OmdbError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function apiKey(): string {
  // OMDB_API_KEY is server-only. NEXT_PUBLIC_OMDB_API_KEY is accepted for older
  // deployments but is only read here, on the server.
  const key = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY;
  if (!key) {
    throw new OmdbError('Movie search is unavailable: OMDB_API_KEY is not configured on the server.', 503);
  }
  return key;
}

/** Call OMDb and return its JSON. Responses are cached by Next for an hour. */
export async function omdb(params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({ ...params, apikey: apiKey() }).toString();

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new OmdbError('Could not reach the OMDb API. Please try again.', 502);
  }
  if (response.status === 401) throw new OmdbError('The OMDb API key was rejected.', 502);
  if (!response.ok) throw new OmdbError(`OMDb API error (${response.status})`, 502);
  return response.json();
}
