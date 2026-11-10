import { NextRequest, NextResponse } from 'next/server';
import { omdb, OmdbError } from '@/lib/server/omdb';
import { checkRateLimit, clientKey, rateLimitHeaders } from '@/lib/server/rateLimit';

const MAX_QUERY_LENGTH = 100;

/** GET /api/movies?q=<title>&page=<1-100> -> { results, totalResults } */
export async function GET(request: NextRequest) {
  // Keeping the API key server-side stops it being stolen, but this route
  // still spends it — so an unthrottled caller could burn the daily quota.
  const limit = checkRateLimit(clientKey(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many searches. Please slow down.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }
  const headers = rateLimitHeaders(limit);

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  const page = Number(request.nextUrl.searchParams.get('page') || '1');

  if (q.length < 3 || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Search term must be 3-${MAX_QUERY_LENGTH} characters` },
      { status: 400, headers }
    );
  }
  if (!Number.isInteger(page) || page < 1 || page > 100) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400, headers });
  }

  try {
    const data = await omdb({ s: q, type: 'movie', page: String(page) });
    if (data.Response === 'False') {
      // OMDb reports "no results" as an error
      if (data.Error === 'Movie not found!') {
        return NextResponse.json({ results: [], totalResults: 0 }, { headers });
      }
      return NextResponse.json(
        { error: String(data.Error || 'Search failed') },
        { status: 502, headers }
      );
    }
    return NextResponse.json(
      {
        results: Array.isArray(data.Search) ? data.Search : [],
        totalResults: Number(data.totalResults) || 0,
      },
      { headers }
    );
  } catch (error) {
    const status = error instanceof OmdbError ? error.status : 500;
    const message = error instanceof OmdbError ? error.message : 'Search failed';
    return NextResponse.json({ error: message }, { status, headers });
  }
}
