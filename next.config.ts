import type { NextConfig } from 'next';

/**
 * Content-Security-Policy for a Next.js app.
 *
 * `'unsafe-inline'` on script-src is unavoidable here: Next injects inline
 * bootstrap scripts, and `next-themes` writes an inline script to apply the
 * saved theme before first paint. Removing it would require threading a nonce
 * through the document, which Next only supports via middleware. Stating the
 * reason rather than pretending the policy is stricter than it is.
 *
 * Poster images come from OMDb's CDN, so img-src has to allow it; everything
 * else is same-origin.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://m.media-amazon.com https://ia.media-imdb.com",
  "font-src 'self' data:",
  // The browser only ever calls this app's own /api routes; OMDb is reached
  // server-side, so no third-party origin belongs here.
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // No feature in this app needs any of these.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // Responses already say what they are; this header only helps fingerprinting.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'ia.media-imdb.com' },
    ],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
