'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/lib/store/store';
import { MIN_SEARCH_LENGTH, searchMovies } from '@/lib/api/movies';
import SearchBar from '@/components/movies/SearchBar';
import { MovieGrid, MovieGridSkeleton } from '@/components/movies/MovieGrid';
import { EmptyNotice, ErrorNotice } from '@/components/Notice';

const FEATURED_SEARCHES = ['star wars', 'avengers', 'lord of the rings'];

async function fetchFeatured() {
  const results = await Promise.allSettled(FEATURED_SEARCHES.map((term) => searchMovies(term, 1)));
  const ok = results.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof searchMovies>>> => r.status === 'fulfilled');
  if (ok.length === 0) throw (results[0] as PromiseRejectedResult).reason;
  // Interleave the lists so the grid mixes franchises
  const lists = ok.map((r) => r.value.results);
  const mixed = [];
  for (let i = 0; mixed.length < 15 && i < 10; i++) {
    for (const list of lists) if (list[i]) mixed.push(list[i]);
  }
  return mixed.slice(0, 15);
}

export default function MoviesPage() {
  const searchTerm = useAppSelector((state) => state.movies.searchTerm);
  const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH;

  const featured = useQuery({ queryKey: ['featured'], queryFn: fetchFeatured, enabled: !isSearching, staleTime: Infinity });
  const search = useQuery({
    queryKey: ['movies', searchTerm],
    queryFn: () => searchMovies(searchTerm),
    enabled: isSearching,
  });

  const active = isSearching ? search : featured;
  const movies = isSearching ? search.data?.results : featured.data;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your next movie</h1>
        <p className="mt-2 mb-6 text-muted-foreground">Search the OMDb catalogue by title, open a movie for details and rate it.</p>
        <SearchBar />
        {searchTerm.length > 0 && !isSearching && (
          <p className="mt-2 text-sm text-muted-foreground">Type at least {MIN_SEARCH_LENGTH} characters to search.</p>
        )}
      </section>

      <section aria-live="polite">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {isSearching ? <>Results for &ldquo;{searchTerm}&rdquo;</> : 'Popular picks'}
          </h2>
          {isSearching && search.data && search.data.totalResults > 0 && (
            <span className="text-sm text-muted-foreground">
              Showing {search.data.results.length} of {search.data.totalResults.toLocaleString()}
            </span>
          )}
        </div>

        {active.isPending && active.fetchStatus !== 'idle' ? (
          <MovieGridSkeleton />
        ) : active.error ? (
          <ErrorNotice message={(active.error as Error).message} onRetry={() => active.refetch()} />
        ) : movies && movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <EmptyNotice title={isSearching ? 'No movies found' : 'Nothing to show yet'}>
            {isSearching ? 'Check the spelling or try a different title.' : 'Start typing to search for movies.'}
          </EmptyNotice>
        )}
      </section>
    </main>
  );
}
