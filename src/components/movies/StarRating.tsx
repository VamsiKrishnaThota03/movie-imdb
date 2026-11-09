'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md';
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

/** Accessible 1-5 star picker. Clicking the current value clears it. */
export default function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const iconSize = size === 'sm' ? 'size-5' : 'size-7';

  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Your rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            className="rounded-sm p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Star
              className={cn(
                iconSize,
                star <= shown ? 'fill-brand text-brand' : 'text-muted-foreground/40'
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {shown ? LABELS[shown] : 'Not rated'}
      </span>
    </div>
  );
}
