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

## Overview

The app uses the Next.js App Router, and `/` redirects to `/movies`. The movies page starts with a grid of popular titles (results for "star wars", "avengers" and "lord of the rings"). Typing in the search bar queries [OMDb](https://www.omdbapi.com/) once you have entered at least 3 characters, with a 500 ms debounce. Up to two result pages (about 20 movies) are fetched. Data fetching and caching use TanStack Query, while search term, results, selected movie, and ratings live in Redux Toolkit.

## Features

- **Live, debounced search:** searches OMDb as you type (500 ms debounce, minimum 3 characters)
- **Initial suggestions:** a grid of 12 popular movies before you search
- **Movie detail page** (`/movies/[id]`): poster, year, genre, director, actors and full plot
- **Star rating (1-5):** your rating shows on the detail page and the movie card. It is kept in app state for the current session.
- **Light/dark theme toggle:** uses `next-themes`, defaults to the OS preference and is saved to `localStorage`
- **Loading skeletons** and empty or error states
- **Responsive grid** built with Tailwind CSS 4 and shadcn/ui-style components (Radix UI primitives, `lucide-react` icons)

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack dev), React 19, TypeScript |
| Data | TanStack Query 5, axios, OMDb API |
| State | Redux Toolkit, React Redux |
| UI | Tailwind CSS 4, `next-themes`, shadcn/ui components (Radix UI, `class-variance-authority`, `tailwind-merge`), `lucide-react` |
| Hosting | Vercel |

## Project structure

```
movie-imdb/
├── public/                      # static assets, placeholder poster
└── src/
    ├── app/
    │   ├── page.tsx             # redirects to /movies
    │   ├── movies/page.tsx      # search + results grid
    │   └── movies/[id]/page.tsx # movie details + rating
    ├── components/
    │   ├── movies/              # MovieCard, SearchBar
    │   ├── providers/           # Redux / React Query providers, ThemeProvider
    │   └── ui/                  # button, card, dialog, input, skeleton, toggle
    └── lib/
        ├── api/movies.ts        # OMDb search + details
        ├── hooks/useDebounce.ts
        └── store/               # Redux store, movie + theme slices
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
echo "NEXT_PUBLIC_OMDB_API_KEY=<your-omdb-api-key>" > .env.local
npm run dev            # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_OMDB_API_KEY` | Yes | OMDb API key. It is exposed to the browser because requests are made client-side. |

The OMDb base URL (`https://www.omdbapi.com`) is set in `src/lib/api/movies.ts`.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Next.js ESLint |
