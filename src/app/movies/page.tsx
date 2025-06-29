'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setSearchResults, setError, setLoading, Movie } from '@/lib/store/features/movieSlice';
import { searchMovies } from '@/lib/api/movies';
import SearchBar from '@/components/movies/SearchBar';
import MovieCard from '@/components/movies/MovieCard';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const INITIAL_SEARCHES = ['star wars', 'avengers', 'lord of the rings'];

export default function MoviesPage() {
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector((state) => state.movies.searchTerm);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [initialMovies, setInitialMovies] = useState<Movie[]>([]);

  useEffect(() => {
    setMounted(true);
    // Fetch initial movies
    const fetchInitialMovies = async () => {
      try {
        const results = await Promise.all(
          INITIAL_SEARCHES.map(term => searchMovies(term))
        );
        const combinedMovies = results.flat().slice(0, 12); // Take first 12 movies
        setInitialMovies(combinedMovies);
      } catch (error) {
        console.error('Error fetching initial movies:', error);
      }
    };
    fetchInitialMovies();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['movies', searchTerm],
    queryFn: () => searchMovies(searchTerm),
    enabled: searchTerm.length > 2,
  });

  useEffect(() => {
    dispatch(setLoading(isLoading));
    if (error) {
      dispatch(setError((error as Error).message));
    } else if (data) {
      dispatch(setSearchResults(data));
    } else if (searchTerm.length === 0) {
      // Clear search results when search term is empty
      dispatch(setSearchResults([]));
    }
  }, [data, isLoading, error, dispatch, searchTerm]);

  const displayMovies = searchTerm.length > 2 ? data : initialMovies;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Movie Search</h1>
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {mounted && theme === 'dark' ? '🌙' : '☀️'}
            </Button>
          )}
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p>{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && displayMovies && displayMovies.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayMovies.map((movie: Movie) => (
                <MovieCard key={movie.imdbID} movie={movie} />
              ))}
            </div>
            {searchTerm.length > 2 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Showing {displayMovies.length} results for "{searchTerm}"
              </div>
            )}
          </>
        )}

        {!isLoading && !error && searchTerm.length > 2 && (!displayMovies || displayMovies.length === 0) && (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No movies found</p>
          </div>
        )}

        {searchTerm.length <= 2 && !displayMovies && (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Start typing to search for movies
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 