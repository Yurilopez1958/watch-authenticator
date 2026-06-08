'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { usePro } from '@/lib/pro';
import { HelpButton } from './help-button';
import { LangToggle } from './lang-toggle';
import { ProToggle } from './pro-toggle';
import { LogoutButton } from './logout-button';

type NavLink = { href: string; es: string; en: string; primary?: boolean; pro?: boolean };

// `pro: true` links only appear in Pro mode (advanced/technical screens).
const LINKS: readonly NavLink[] = [
  { href: '/authenticate', es: 'Autenticar', en: 'Authenticate', primary: true },
  { href: '/timegrapher', es: 'Cronocomparador', en: 'Timegrapher' },
  { href: '/verify', es: 'Verificación rápida', en: 'Quick verify' },
  { href: '/gallery', es: 'Galería', en: 'Reference gallery' },
  { href: '/market', es: 'Mercado', en: 'Market' },
  { href: '/billing', es: 'Planes', en: 'Plans' },
  { href: '/connect', es: 'Conectar Niton', en: 'Connect Niton', pro: true },
  { href: '/import', es: 'Importar CSV', en: 'Import CSV', pro: true },
  { href: '/developer', es: 'API', en: 'API', pro: true },
  { href: '/admin', es: 'Admin', en: 'Admin', pro: true },
];

function Logo({ onClick = () => {} }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
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
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t, lang } = useLang();
  const { pro } = usePro();
  const links = LINKS.filter((l) => pro || !l.pro);

  // Close the mobile menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* ===== Desktop (PC): left vertical sidebar ===== */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 z-30 h-screen w-60 border-r border-soft bg-[rgba(10,15,31,0.85)] backdrop-blur-md">
        <div className="px-5 py-5 border-b border-soft">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === l.href
                  ? 'bg-accent-soft text-accent-bright font-semibold'
                  : l.primary
                    ? 'text-foreground font-semibold hover:bg-white/5'
                    : 'text-muted hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {l[lang]}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-soft flex flex-wrap items-center gap-2">
          <ProToggle />
          <LangToggle />
          <HelpButton />
          <LogoutButton />
        </div>
      </aside>

      {/* ===== Mobile / tablet: top bar with hamburger ===== */}
      <header
        className="lg:hidden sticky top-0 z-30 backdrop-blur-md bg-[rgba(10,15,31,0.8)] border-b border-soft"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Logo onClick={() => setOpen(false)} />

          <div className="flex items-center gap-2 shrink-0">
            <ProToggle />
            <LangToggle />
            <HelpButton />
            <LogoutButton />

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t('Cerrar menú', 'Close menu') : t('Abrir menú', 'Open menu')}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-soft text-foreground hover:border-accent transition-colors shrink-0"
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
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <nav id="mobile-nav" className="border-t border-soft bg-[rgba(10,15,31,0.97)] px-4 py-2 fade-in">
            {links.map((l) => (
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
                {l[lang]}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
