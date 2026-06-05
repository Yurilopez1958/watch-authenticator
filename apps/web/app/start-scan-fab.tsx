'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Floating "Start scan" button shown on every page so the user can begin the
 * authentication process with one tap from anywhere. Hidden inside the scan
 * flow itself (/authenticate) to avoid covering the wizard's own controls.
 */
export function StartScanFab() {
  const pathname = usePathname();
  if (pathname?.startsWith('/authenticate')) return null;

  return (
    <Link
      href="/authenticate"
      aria-label="Start scan"
      className="fixed right-5 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 sm:px-5 sm:py-3.5 text-white font-semibold shadow-xl shadow-black/40 ring-1 ring-white/10 transition-transform hover:scale-105 active:scale-95"
      style={{
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      }}
    >
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      </svg>
      <span className="hidden xs:inline">Start scan</span>
    </Link>
  );
}
