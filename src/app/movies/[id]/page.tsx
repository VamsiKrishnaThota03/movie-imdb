'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setMovieRating } from '@/lib/store/features/movieSlice';
import { getMovieDetails, posterSrc } from '@/lib/api/movies';
import StarRating from '@/components/movies/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorNotice } from '@/components/Notice';

const present = (v?: string) => (v && v !== 'N/A' ? v : undefined);

export default function MovieDetailsPage() {
  const params = useParams<{ id: string }>();
  const movieId = params.id;
  const dispatch = useAppDispatch();
  const rating = useAppSelector((state) => state.movies.ratings[movieId] ?? 0);

  const { data: movie, isLoading, error, refetch } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => getMovieDetails(movieId),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/movies"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to search
      </Link>

      {isLoading ? (
        <div className="grid gap-8 md:grid-cols-[300px_1fr]" aria-busy="true">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : error || !movie ? (
        <ErrorNotice message={(error as Error)?.message || 'Movie not found'} onRetry={() => refetch()} />
      ) : (
        <article className="grid gap-8 md:grid-cols-[300px_1fr]">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[300px] overflow-hidden rounded-xl border bg-muted shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterSrc(movie.Poster)}
              alt={`${movie.Title} poster`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/poster-placeholder.svg';
              }}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{movie.Title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{movie.Year}</span>
              {present(movie.Rated) && <span className="rounded border px-1.5 py-0.5 text-xs">{movie.Rated}</span>}
              {present(movie.Runtime) && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" /> {movie.Runtime}
                </span>
              )}
              {present(movie.imdbRating) && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-3.5 fill-brand text-brand" aria-hidden="true" /> {movie.imdbRating}/10 IMDb
                </span>
              )}
            </div>

            {present(movie.Genre) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.Genre!.split(',').map((g) => (
                  <span key={g} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-medium">Your rating</p>
              <StarRating value={rating} onChange={(r) => dispatch(setMovieRating({ imdbID: movie.imdbID, rating: r }))} />
            </div>

            {present(movie.Plot) && (
              <section className="mt-6">
                <h2 className="mb-2 font-semibold">Plot</h2>
                <p className="leading-relaxed text-muted-foreground">{movie.Plot}</p>
              </section>
            )}

            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ['Director', movie.Director],
                ['Cast', movie.Actors],
                ['Released', movie.Released],
                ['Language', movie.Language],
              ]
                .filter(([, v]) => present(v))
                .map(([label, v]) => (
                  <div key={label}>
                    <dt className="font-medium">{label}</dt>
                    <dd className="mt-0.5 text-muted-foreground">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </article>
      )}
    </main>
  );
}
