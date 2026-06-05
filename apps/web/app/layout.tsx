import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from './site-header';
import { StartScanFab } from './start-scan-fab';

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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 fade-in">{children}</main>
        <footer className="border-t border-soft mt-16 sm:mt-24 py-8 text-center text-xs text-dim px-4">
          MVP — public reference data, refine with your own measurements
        </footer>
        <StartScanFab />
      </body>
    </html>
  );
}
