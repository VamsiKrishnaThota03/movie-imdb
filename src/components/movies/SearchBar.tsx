'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import { setSearchTerm } from '@/lib/store/features/movieSlice';
import { useDebounce } from '@/lib/hooks/useDebounce';

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

  useEffect(() => {
    // Always dispatch the search term, even if empty
    dispatch(setSearchTerm(debouncedSearchTerm));
  }, [debouncedSearchTerm, dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  return (
    <div className="w-full max-w-xl">
      <Input
        type="search"
        placeholder="Search movies..."
        value={localSearchTerm}
        onChange={handleSearch}
        className="w-full"
      />
    </div>
  );
} 