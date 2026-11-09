'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Movie } from '@/lib/types';
import { posterSrc } from '@/lib/api/movies';
import { useAppSelector } from '@/lib/store/store';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const rating = useAppSelector((state) => state.movies.ratings[movie.imdbID]);

  return (
    <Link
      href={`/movies/${movie.imdbID}`}
      className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <article className="h-full overflow-hidden rounded-xl border bg-card shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc(movie.Poster)}
            alt={`${movie.Title} poster`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/poster-placeholder.svg';
            }}
          />
          {rating ? (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
              <Star className="size-3 fill-brand text-brand" aria-hidden="true" />
              {rating}/5
            </span>
          ) : null}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug">{movie.Title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{movie.Year}</p>
        </div>
      </article>
    </Link>
  );
};

export default MovieCard;
