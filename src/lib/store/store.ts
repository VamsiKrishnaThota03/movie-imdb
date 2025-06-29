import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import themeReducer from './features/themeSlice';
import movieReducer, { Movie } from './features/movieSlice';

export interface RootState {
  theme: {
    isDarkMode: boolean;
  };
  movies: {
    searchResults: Movie[];
    selectedMovie: Movie | null;
    loading: boolean;
    error: string | null;
    searchTerm: string;
  };
}

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    movies: movieReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 