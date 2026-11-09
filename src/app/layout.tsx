import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers/Providers';
import SiteHeader from '@/components/SiteHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Movie Search',
    template: '%s · Movie Search',
  },
  description: 'Search movies, read plot and cast details and keep your own 1-5 star ratings. Powered by the OMDb API.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <footer className="border-t py-6 text-center text-xs text-muted-foreground">
            Movie data from the{' '}
            <a href="https://www.omdbapi.com/" className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noopener noreferrer">
              OMDb API
            </a>
            . Ratings are saved in this browser.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
