import axios from 'axios';
import { Movie } from '../store/features/movieSlice';

const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_OMDB_BASE_URL;

if (!API_KEY) {
  console.error('OMDB API key is not set');
}

if (!BASE_URL) {
  console.error('OMDB base URL is not set');
}

const api = axios.create({
  baseURL: BASE_URL,
});

export const searchMovies = async (searchTerm: string) => {
  if (!searchTerm || searchTerm.length <= 2) {
    return [];
  }

  try {
    console.log('Searching for:', searchTerm);
    // First request to get total results
    const firstResponse = await api.get('', {
      params: {
        apikey: API_KEY,
        s: searchTerm,
        type: 'movie',
        page: 1,
      },
    });

    if (firstResponse.data.Response === 'False') {
      if (firstResponse.data.Error === 'Movie not found!') {
        return [];
      }
      throw new Error(firstResponse.data.Error);
    }

    const totalResults = parseInt(firstResponse.data.totalResults, 10);
    const firstPageResults = firstResponse.data.Search || [];

    // If we have more than 10 results, fetch the second page
    if (totalResults > 10) {
      try {
        const secondResponse = await api.get('', {
          params: {
            apikey: API_KEY,
            s: searchTerm,
            type: 'movie',
            page: 2,
          },
        });

        if (secondResponse.data.Response === 'True') {
          return [...firstPageResults, ...(secondResponse.data.Search || [])];
        }
      } catch (error) {
        console.error('Error fetching second page:', error);
      }
    }

    return firstPageResults;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getMovieDetails = async (imdbId: string) => {
  try {
    const response = await api.get('', {
      params: {
        apikey: API_KEY,
        i: imdbId,
        plot: 'full',
      },
    });

    if (response.data.Response === 'True') {
      return response.data as Movie;
    }
    throw new Error(response.data.Error || 'Failed to fetch movie details');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 