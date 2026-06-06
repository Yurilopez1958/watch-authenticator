'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { PAYWALL_EVENT, type PaywallPayload } from '@/lib/paywall';

/** Global paywall sheet. Listens for the paywall event and shows a bottom-sheet. */
export function PaywallSheet() {
  const { lang, t } = useLang();
  const [p, setP] = useState<PaywallPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const handler = (e: Event) => setP((e as CustomEvent).detail ?? {});
    window.addEventListener(PAYWALL_EVENT, handler);
    return () => window.removeEventListener(PAYWALL_EVENT, handler);
  }, []);

  if (!p || !mounted) return null;

  const title = p.title ? p.title[lang] : t('Acción no disponible', 'Action unavailable');
  const message = p.message ? p.message[lang] : t('No puedes continuar ahora mismo.', 'You cannot continue right now.');

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setP(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-md bg-card border border-soft rounded-t-2xl sm:rounded-2xl shadow-2xl fade-in"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3"><div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--border-hover)' }} /></div>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-soft text-accent-bright shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <h2 className="text-xl font-bold leading-tight">{title}</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
          <div className="flex gap-2">
            {p.cta && (
              <Link href={p.cta} onClick={() => setP(null)} className="btn-primary flex-1 text-center">
                {t('Ver planes', 'See plans')}
              </Link>
            )}
            <button onClick={() => setP(null)} className="btn-ghost flex-1">{t('Cerrar', 'Close')}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
