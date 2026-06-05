'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavLink = { href: string; label: string; primary?: boolean };

const LINKS: readonly NavLink[] = [
  { href: '/authenticate', label: 'Authenticate', primary: true },
  { href: '/connect', label: 'Connect Niton' },
  { href: '/timegrapher', label: 'Timegrapher' },
  { href: '/verify', label: 'Quick verify' },
  { href: '/gallery', label: 'Reference gallery' },
  { href: '/market', label: 'Market' },
  { href: '/import', label: 'Import CSV' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/settings', label: 'Compliance' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(10,15,31,0.8)] border-b border-soft"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide shrink-0"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-soft border border-soft text-accent-bright shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="6" />
              <polyline points="12 9 12 12 13.5 13.5" />
              <path d="M9 4.55a8 8 0 0 1 6 0M9 19.45a8 8 0 0 0 6 0M21 12h-3M6 12H3" />
            </svg>
          </span>
          <span className="text-gradient hidden xs:inline">Watch Authenticator</span>
          <span className="text-gradient xs:hidden">WatchAuth</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-5 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${l.primary ? 'font-semibold' : ''} ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-soft text-foreground hover:border-accent transition-colors shrink-0"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="md:hidden border-t border-soft bg-[rgba(10,15,31,0.97)] px-4 py-2 fade-in">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block py-3 px-2 rounded-lg text-base border-b border-[var(--border)] last:border-0 ${
                pathname === l.href
                  ? 'text-accent-bright font-semibold'
                  : l.primary
                    ? 'text-foreground font-semibold'
                    : 'text-muted'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
