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
  Runtime?: string;
  Rated?: string;
  Released?: string;
  imdbRating?: string;
  Language?: string;
}

export interface SearchResponse {
  results: Movie[];
  totalResults: number;
}
