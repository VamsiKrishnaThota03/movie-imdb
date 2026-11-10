import { beforeEach, describe, expect, it } from 'vitest';
import reducer, {
  RATINGS_STORAGE_KEY,
  hydrateRatings,
  loadRatings,
  setMovieRating,
  setSearchTerm,
} from './movieSlice';

const initial = reducer(undefined, { type: '@@INIT' });

beforeEach(() => {
  localStorage.clear();
});

describe('setSearchTerm', () => {
  it('stores the term verbatim', () => {
    const state = reducer(initial, setSearchTerm('blade runner'));
    expect(state.searchTerm).toBe('blade runner');
  });
});

describe('setMovieRating', () => {
  it('sets a rating', () => {
    const state = reducer(initial, setMovieRating({ imdbID: 'tt0083658', rating: 4 }));
    expect(state.ratings).toEqual({ tt0083658: 4 });
  });

  it('clears the rating when the same value is set again', () => {
    // This is the "click the same star to unrate" behaviour.
    let state = reducer(initial, setMovieRating({ imdbID: 'tt0083658', rating: 4 }));
    state = reducer(state, setMovieRating({ imdbID: 'tt0083658', rating: 4 }));
    expect(state.ratings).toEqual({});
  });

  it('treats a rating of 0 as clearing', () => {
    let state = reducer(initial, setMovieRating({ imdbID: 'tt0083658', rating: 3 }));
    state = reducer(state, setMovieRating({ imdbID: 'tt0083658', rating: 0 }));
    expect(state.ratings).toEqual({});
  });

  it('clamps out-of-range values into 1..5 instead of storing them', () => {
    let state = reducer(initial, setMovieRating({ imdbID: 'a', rating: 99 }));
    expect(state.ratings.a).toBe(5);

    state = reducer(state, setMovieRating({ imdbID: 'b', rating: -4 }));
    expect(state.ratings.b).toBe(1);
  });

  it('rounds a fractional rating', () => {
    const state = reducer(initial, setMovieRating({ imdbID: 'c', rating: 3.7 }));
    expect(state.ratings.c).toBe(4);
  });

  it('keeps other movies\' ratings untouched', () => {
    let state = reducer(initial, setMovieRating({ imdbID: 'first', rating: 2 }));
    state = reducer(state, setMovieRating({ imdbID: 'second', rating: 5 }));
    state = reducer(state, setMovieRating({ imdbID: 'first', rating: 2 })); // clears 'first'
    expect(state.ratings).toEqual({ second: 5 });
  });
});

describe('hydrateRatings', () => {
  it('replaces the whole ratings map', () => {
    const state = reducer(initial, hydrateRatings({ x: 3, y: 1 }));
    expect(state.ratings).toEqual({ x: 3, y: 1 });
  });
});

describe('loadRatings', () => {
  it('returns an empty object when nothing is stored', () => {
    expect(loadRatings()).toEqual({});
  });

  it('reads back valid stored ratings', () => {
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify({ tt1: 3, tt2: 5 }));
    expect(loadRatings()).toEqual({ tt1: 3, tt2: 5 });
  });

  it('survives malformed JSON rather than throwing on boot', () => {
    // localStorage is user-writable, so this is reachable in a real browser.
    localStorage.setItem(RATINGS_STORAGE_KEY, 'not json at all');
    expect(loadRatings()).toEqual({});
  });

  it('drops entries that are not numbers in 1..5', () => {
    localStorage.setItem(
      RATINGS_STORAGE_KEY,
      JSON.stringify({
        good: 4,
        tooHigh: 9,
        tooLow: 0,
        negative: -2,
        text: 'five',
        nested: { a: 1 },
        nothing: null,
      })
    );
    expect(loadRatings()).toEqual({ good: 4 });
  });

  it('ignores a stored JSON value that is not an object', () => {
    for (const raw of ['null', '"a string"', '42']) {
      localStorage.setItem(RATINGS_STORAGE_KEY, raw);
      expect(loadRatings()).toEqual({});
    }
  });

  it('accepts a stored array without producing array-shaped state', () => {
    // JSON.parse('[1,2]') is an object, so the guard has to survive it.
    localStorage.setItem(RATINGS_STORAGE_KEY, '[3,4]');
    const result = loadRatings();
    expect(Array.isArray(result)).toBe(false);
    // Indices are kept only if the values pass the 1..5 number check.
    expect(Object.values(result).every((v) => typeof v === 'number')).toBe(true);
  });
});
