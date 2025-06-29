'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from '@/lib/store/store';
import { setSelectedMovie, setMovieRating } from '@/lib/store/features/movieSlice';
import { getMovieDetails } from '@/lib/api/movies';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const MovieDetailsPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const movieId = params.id as string;

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => getMovieDetails(movieId),
  });

  useEffect(() => {
    if (movie) {
      dispatch(setSelectedMovie(movie));
    }
  }, [movie, dispatch]);

  const handleRating = (rating: number) => {
    if (movie) {
      dispatch(setMovieRating({ imdbID: movie.imdbID, rating }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-[600px] animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p>{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-lg text-muted-foreground">Movie not found</p>
        </div>
      </div>
    );
  }

  const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg';

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl}
                  alt={movie.Title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="mb-2 text-3xl font-bold">{movie.Title}</h1>
                <p className="mb-4 text-lg text-muted-foreground">{movie.Year}</p>

                <div className="mb-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-lg">Your Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRating(rating)}
                          className={`text-2xl ${
                            movie.userRating && rating <= movie.userRating
                              ? 'text-yellow-500'
                              : 'text-gray-300 hover:text-yellow-500'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {movie.Genre && (
                    <p>
                      <strong>Genre:</strong> {movie.Genre}
                    </p>
                  )}
                  {movie.Director && (
                    <p>
                      <strong>Director:</strong> {movie.Director}
                    </p>
                  )}
                  {movie.Actors && (
                    <p>
                      <strong>Actors:</strong> {movie.Actors}
                    </p>
                  )}
                  {movie.Plot && (
                    <div>
                      <strong>Plot:</strong>
                      <p className="mt-2 text-muted-foreground">{movie.Plot}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default MovieDetailsPage; 