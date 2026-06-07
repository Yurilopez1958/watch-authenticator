import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/i18n';
import { ProProvider } from '@/lib/pro';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { SkipLink } from './skip-link';
import { StartScanFab } from './start-scan-fab';
import { PaywallSheet } from './paywall-sheet';

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
        <LangProvider>
          <ProProvider>
          <SkipLink />
          <SiteHeader />
          {/* No `fade-in` here: its lingering transform would make <main> the
              containing block for position:fixed modals (camera, warnings),
              clamping them to the content box instead of the viewport. */}
          <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">{children}</main>
          <SiteFooter />
          <StartScanFab />
          <PaywallSheet />
          </ProProvider>
        </LangProvider>
      </body>
    </html>
  );
}
