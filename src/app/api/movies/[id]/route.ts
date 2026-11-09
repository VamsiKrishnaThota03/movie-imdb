import { NextResponse } from 'next/server';
import { omdb, OmdbError } from '@/lib/server/omdb';

const IMDB_ID_RE = /^tt\d{5,10}$/;

/** GET /api/movies/:imdbId -> full OMDb record */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!IMDB_ID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid IMDb id' }, { status: 400 });
  }

  try {
    const data = await omdb({ i: id, plot: 'full' });
    if (data.Response === 'False') {
      return NextResponse.json({ error: String(data.Error || 'Movie not found') }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof OmdbError ? error.status : 500;
    const message = error instanceof OmdbError ? error.message : 'Failed to load movie';
    return NextResponse.json({ error: message }, { status });
  }
}
