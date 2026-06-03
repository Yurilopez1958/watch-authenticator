import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

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
        <header className="sticky top-0 z-20 backdrop-blur-md bg-[rgba(10,15,31,0.7)] border-b border-soft">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-wide">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-soft border border-soft text-accent-bright">
                {/* Watch / target SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="6" />
                  <polyline points="12 9 12 12 13.5 13.5" />
                  <path d="M9 4.55a8 8 0 0 1 6 0M9 19.45a8 8 0 0 0 6 0M21 12h-3M6 12H3" />
                </svg>
              </span>
              <span className="text-gradient">Watch Authenticator</span>
            </Link>
            <nav className="flex gap-5 text-sm">
              <Link href="/authenticate" className="nav-link font-semibold">Authenticate</Link>
              <Link href="/connect" className="nav-link">Connect Niton</Link>
              <Link href="/verify" className="nav-link">Quick verify</Link>
              <Link href="/photos" className="nav-link">Photos</Link>
              <Link href="/import" className="nav-link">Import CSV</Link>
              <Link href="/catalog" className="nav-link">Catalog</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12 fade-in">{children}</main>
        <footer className="border-t border-soft mt-24 py-8 text-center text-xs text-dim">
          MVP — public reference data, refine with your own measurements
        </footer>
      </body>
    </html>
  );
}
