import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  userRating?: number;
}

interface MovieState {
  searchResults: Movie[];
  selectedMovie: Movie | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
}

const initialState: MovieState = {
  searchResults: [],
  selectedMovie: null,
  loading: false,
  error: null,
  searchTerm: '',
};

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<Movie[]>) => {
      state.searchResults = action.payload;
    },
    setSelectedMovie: (state, action: PayloadAction<Movie | null>) => {
      state.selectedMovie = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setMovieRating: (state, action: PayloadAction<{ imdbID: string; rating: number }>) => {
      const movie = state.searchResults.find(m => m.imdbID === action.payload.imdbID);
      if (movie) {
        movie.userRating = action.payload.rating;
      }
      if (state.selectedMovie?.imdbID === action.payload.imdbID) {
        state.selectedMovie.userRating = action.payload.rating;
      }
    },
  },
});

export const {
  setSearchResults,
  setSelectedMovie,
  setLoading,
  setError,
  setSearchTerm,
  setMovieRating,
} = movieSlice.actions;

export default movieSlice.reducer; 