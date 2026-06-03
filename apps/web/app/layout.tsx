import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from './site-header';

export const metadata: Metadata = {
  title: 'Watch Authenticator',
  description: 'Watch authentication by XRF composition and visual analysis',
  applicationName: 'Watch Authenticator',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WatchAuth',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0f1f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 fade-in">{children}</main>
        <footer className="border-t border-soft mt-16 sm:mt-24 py-8 text-center text-xs text-dim px-4">
          MVP — public reference data, refine with your own measurements
        </footer>
      </body>
    </html>
  );
}
