import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // tsconfigPaths resolves the "@/*" alias the app uses, so tests import the
  // same way the application code does.
  plugins: [tsconfigPaths(), react()],

  // Tailwind 4's PostCSS plugin is not loadable by Vite's PostCSS pipeline, and
  // nothing under test depends on compiled CSS. Supplying an inline (empty)
  // PostCSS config stops Vite discovering postcss.config.mjs at all.
  css: {
    postcss: { plugins: [] },
  },

  test: {
    css: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/components/ui/**', // generated shadcn primitives
        'src/app/**/layout.tsx',
      ],
    },
  },
});
