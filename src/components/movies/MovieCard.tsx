'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Movie } from '@/lib/store/features/movieSlice';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg';

  return (
    <a href={`/movies/${movie.imdbID}`} className="block transition-transform hover:scale-105">
      <Card className="h-full overflow-hidden bg-card dark:bg-card/80">
        <CardHeader className="p-0">
          <div className="relative aspect-[2/3] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={movie.Title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-lg font-semibold">{movie.Title}</h3>
          <p className="text-sm text-muted-foreground">{movie.Year}</p>
        </CardContent>
        {movie.userRating && (
          <CardFooter className="p-4 pt-0">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm">{movie.userRating}/5</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </a>
  );
};

export default MovieCard; 