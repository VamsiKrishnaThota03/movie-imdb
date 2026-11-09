import axios from 'axios';
import type { Movie, SearchResponse } from '../types';

// The browser only talks to this app's API routes; the OMDb key stays on the server.
const api = axios.create({ baseURL: '/api' });

function toError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error;
    if (typeof message === 'string') return new Error(message);
    if (!error.response) return new Error('Network error. Check your connection and try again.');
  }
  return error instanceof Error ? error : new Error(fallback);
}

export const MIN_SEARCH_LENGTH = 3;

/** Search movies by title. Fetches up to `pages` pages of 10 results each. */
export const searchMovies = async (searchTerm: string, pages = 2): Promise<SearchResponse> => {
  const q = searchTerm.trim();
  if (q.length < MIN_SEARCH_LENGTH) return { results: [], totalResults: 0 };

  try {
    const first = await api.get<SearchResponse>('/movies', { params: { q, page: 1 } });
    let results = first.data.results;
    const { totalResults } = first.data;

    for (let page = 2; page <= pages && results.length < totalResults; page++) {
      try {
        const next = await api.get<SearchResponse>('/movies', { params: { q, page } });
        results = results.concat(next.data.results);
      } catch {
        break; // keep what we have
      }
    }

    // OMDb occasionally repeats a title across pages
    const unique = Array.from(new Map(results.map((m) => [m.imdbID, m])).values());
    return { results: unique, totalResults };
  } catch (error) {
    throw toError(error, 'Search failed');
  }
};

export const getMovieDetails = async (imdbId: string): Promise<Movie> => {
  try {
    const response = await api.get<Movie>(`/movies/${encodeURIComponent(imdbId)}`);
    return response.data;
  } catch (error) {
    throw toError(error, 'Failed to fetch movie details');
  }
};

export const posterSrc = (poster?: string) =>
  poster && poster !== 'N/A' ? poster : '/poster-placeholder.svg';
