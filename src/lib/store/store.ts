import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import movieReducer, { RATINGS_STORAGE_KEY } from './features/movieSlice';

export const store = configureStore({
  reducer: {
    movies: movieReducer,
  },
});

// Persist ratings in the browser so they survive a reload
if (typeof window !== 'undefined') {
  let lastRatings = store.getState().movies.ratings;
  store.subscribe(() => {
    const { ratings } = store.getState().movies;
    if (ratings === lastRatings) return;
    lastRatings = ratings;
    try {
      localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // storage unavailable
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
