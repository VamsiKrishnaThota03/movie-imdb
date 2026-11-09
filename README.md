# Movie Search (OMDb)

A responsive movie search app built with Next.js 15, React 19 and the OMDb API. Search titles as you type, open a movie's details and give it a 1-5 star rating.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2-764ABC?logo=redux&logoColor=white)

## Live demo

**https://movie-imdb-omega.vercel.app/movies**

| Search (light) | Movie detail (dark) | Mobile |
| --- | --- | --- |
| ![Search page](docs/screenshots/search.png) | ![Movie detail page in dark mode](docs/screenshots/movie-detail-dark.png) | ![Mobile layout](docs/screenshots/mobile.png) |

_Screenshots use sample data with generated posters._

## Overview

The app uses the Next.js App Router, and `/` redirects to `/movies` on the server. The movies page starts with a grid of popular titles (mixed results for "star wars", "avengers" and "lord of the rings"). Typing in the search bar searches [OMDb](https://www.omdbapi.com/) once you have entered at least 3 characters, with a 400 ms debounce, and fetches up to two result pages (about 20 movies).

The browser never talks to OMDb directly: it calls the app's own route handlers (`/api/movies`, `/api/movies/[id]`), which add the API key on the server and cache OMDb responses for an hour. TanStack Query handles fetching and client caching; Redux Toolkit holds the search term and your ratings.

## Features

- **Live, debounced search:** searches as you type (400 ms debounce, minimum 3 characters) with a clear button; the query is kept when you go back from a movie
- **Initial suggestions:** a grid of 15 popular movies before you search
- **Movie detail page** (`/movies/[id]`): poster, year, rating certificate, runtime, IMDb score, genres, director, cast, release date, language and full plot
- **Star rating (1-5):** keyboard-accessible star picker; click the same star again to clear. Ratings are saved in `localStorage` and shown as a badge on movie cards.
- **Light/dark theme toggle:** `next-themes`, defaults to the OS preference
- **Loading skeletons**, empty results and error states with retry (including a clear message when the server has no API key)
- **Server-side API key:** `OMDB_API_KEY` is only read by route handlers, and inputs (search term length, IMDb id format, page) are validated
- **Responsive grid** built with Tailwind CSS 4 and shadcn/ui-style components (`lucide-react` icons)

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 15 (App Router, route handlers, Turbopack dev), React 19, TypeScript |
| Data | TanStack Query 5, axios, OMDb API |
| State | Redux Toolkit, React Redux |
| UI | Tailwind CSS 4, `next-themes`, shadcn/ui components (`@radix-ui/react-slot`, `class-variance-authority`, `tailwind-merge`), `lucide-react` |
| Hosting | Vercel |

## Project structure

```
movie-imdb/
├── public/                      # placeholder poster
└── src/
    ├── app/
    │   ├── page.tsx             # redirects to /movies
    │   ├── api/movies/route.ts       # GET /api/movies?q=&page=  (OMDb search proxy)
    │   ├── api/movies/[id]/route.ts  # GET /api/movies/:imdbId (OMDb details proxy)
    │   ├── movies/page.tsx      # search + results grid
    │   └── movies/[id]/page.tsx # movie details + rating
    ├── components/
    │   ├── movies/              # MovieCard, MovieGrid, SearchBar, StarRating
    │   ├── providers/           # next-themes, Redux and React Query providers
    │   ├── SiteHeader.tsx, Notice.tsx
    │   └── ui/                  # button, card, input, skeleton
    └── lib/
        ├── api/movies.ts        # client calls to the app's API routes
        ├── server/omdb.ts       # server-side OMDb client (reads OMDB_API_KEY)
        ├── hooks/useDebounce.ts
        └── store/               # Redux store and movie slice (search term, ratings)
```

## Getting started

### Prerequisites

- Node.js 18.18+ (required by Next.js 15) and npm
- An OMDb API key ([get one free](https://www.omdbapi.com/apikey.aspx))

### Install and run

```bash
git clone https://github.com/VamsiKrishnaThota03/movie-imdb.git
cd movie-imdb
npm install
cp .env.example .env.local   # then set OMDB_API_KEY
npm run dev            # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | Required | Description |
| --- | --- | --- |
| `OMDB_API_KEY` | Yes | OMDb API key, read only on the server by the `/api/movies` route handlers. Without it the app shows a configuration error. |

For older deployments the server also falls back to `NEXT_PUBLIC_OMDB_API_KEY`, but it is no longer used in browser code. Prefer `OMDB_API_KEY`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Next.js ESLint |

## Known limitations

- Ratings are stored per browser in `localStorage`; there are no accounts or sync.
- Search covers movies only (`type=movie`) and shows at most the first two OMDb pages.
- The free OMDb tier allows 1,000 requests per day; responses are cached for an hour to stay under it.
