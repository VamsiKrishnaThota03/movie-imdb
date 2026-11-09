'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setSearchTerm } from '@/lib/store/features/movieSlice';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const storedTerm = useAppSelector((state) => state.movies.searchTerm);
  // Start from the stored term so the query survives navigating to a movie and back
  const [localSearchTerm, setLocalSearchTerm] = useState(storedTerm);
  const debouncedSearchTerm = useDebounce(localSearchTerm, 400);

  useEffect(() => {
    dispatch(setSearchTerm(debouncedSearchTerm.trim()));
  }, [debouncedSearchTerm, dispatch]);

  return (
    <form role="search" className="relative w-full max-w-2xl" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="movie-search" className="sr-only">
        Search movies by title
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id="movie-search"
        type="search"
        placeholder="Search movies by title…"
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)}
        autoComplete="off"
        className="h-12 rounded-xl pl-11 pr-11 text-base shadow-sm md:text-base [&::-webkit-search-cancel-button]:hidden"
      />
      {localSearchTerm && (
        <button
          type="button"
          onClick={() => setLocalSearchTerm('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
