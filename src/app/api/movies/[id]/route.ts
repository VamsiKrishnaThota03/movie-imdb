import { NextResponse } from 'next/server';
import { omdb, OmdbError } from '@/lib/server/omdb';
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/server/rateLimit';

const IMDB_ID_RE = /^tt\d{5,10}$/;

/** GET /api/movies/:imdbId -> full OMDb record */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Same reasoning as the search route: the key is hidden, but this route
  // spends it, so it needs a ceiling of its own.
  const limit = checkRateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }
  const headers = rateLimitHeaders(limit);

  const { id } = await params;
  if (!IMDB_ID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid IMDb id' }, { status: 400, headers });
  }

  try {
    const data = await omdb({ i: id, plot: 'full' });
    if (data.Response === 'False') {
      return NextResponse.json(
        { error: String(data.Error || 'Movie not found') },
        { status: 404, headers }
      );
    }
    return NextResponse.json(data, { headers });
  } catch (error) {
    const status = error instanceof OmdbError ? error.status : 500;
    const message = error instanceof OmdbError ? error.message : 'Failed to load movie';
    return NextResponse.json({ error: message }, { status, headers });
  }
}
