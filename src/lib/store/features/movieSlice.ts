import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type { Movie } from '../../types';

export const RATINGS_STORAGE_KEY = 'movie-ratings';

interface MovieState {
  searchTerm: string;
  /** imdbID -> 1..5 stars */
  ratings: Record<string, number>;
}

const initialState: MovieState = {
  searchTerm: '',
  ratings: {},
};

export function loadRatings(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(RATINGS_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number' && v >= 1 && v <= 5)
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    /** Set a rating; passing the current rating again clears it. */
    setMovieRating: (state, action: PayloadAction<{ imdbID: string; rating: number }>) => {
      const { imdbID, rating } = action.payload;
      if (state.ratings[imdbID] === rating || rating === 0) delete state.ratings[imdbID];
      else state.ratings[imdbID] = Math.min(5, Math.max(1, Math.round(rating)));
    },
    hydrateRatings: (state, action: PayloadAction<Record<string, number>>) => {
      state.ratings = action.payload;
    },
  },
});

export const { setSearchTerm, setMovieRating, hydrateRatings } = movieSlice.actions;

export default movieSlice.reducer;
