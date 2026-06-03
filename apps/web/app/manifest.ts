import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Watch Authenticator',
    short_name: 'WatchAuth',
    description: 'Watch authentication by XRF composition and visual analysis',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0f1f',
    theme_color: '#3b82f6',
    categories: ['productivity', 'utilities'],
    lang: 'en',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
