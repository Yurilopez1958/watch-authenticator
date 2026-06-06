'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import { helpForPath } from '@/lib/help-content';

/**
 * Universal "?" help button. Available on every screen (rendered in the header).
 * Opens a bottom-sheet with plain-language, step-by-step instructions for the
 * current page, in the active language.
 */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { lang, t } = useLang();
  const topic = helpForPath(pathname);

  useEffect(() => { setMounted(true); }, []);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  // The sheet is PORTALED to <body>: the header has a backdrop-filter, which makes
  // it the containing block for position:fixed descendants — without the portal the
  // overlay would be clamped inside the ~60px header bar instead of the viewport.
  const sheet = (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
          <div
            className="w-full sm:max-w-lg bg-card border border-soft rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85dvh] overflow-y-auto fade-in"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--border-hover)' }} />
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white text-xl font-bold shrink-0">?</span>
                  <h2 className="text-xl font-bold leading-tight">{topic.title[lang]}</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label={t('Cerrar', 'Close')}
                  className="shrink-0 w-9 h-9 rounded-lg border border-soft text-foreground hover:border-accent transition-colors inline-flex items-center justify-center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-muted leading-relaxed">{topic.intro[lang]}</p>

              <ol className="space-y-3">
                {topic.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-accent-soft text-accent-bright font-bold text-sm inline-flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{s[lang]}</span>
                  </li>
                ))}
              </ol>

              {topic.tip && (
                <div className="text-sm text-emerald-200 bg-emerald-500/10 border-l-4 border-l-emerald-500 rounded-lg p-3 leading-relaxed">
                  <span className="font-semibold">💡 {t('Consejo', 'Tip')}: </span>
                  {topic.tip[lang]}
                </div>
              )}

              <button onClick={() => setOpen(false)} className="btn-primary w-full">
                {t('Entendido', 'Got it')}
              </button>
            </div>
          </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('Ayuda', 'Help')}
        title={t('Ayuda paso a paso', 'Step-by-step help')}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-soft text-accent-bright hover:border-accent hover:bg-accent-soft transition-colors shrink-0"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold">?</span>
        <span className="text-sm font-medium hidden xs:inline">{t('Ayuda', 'Help')}</span>
      </button>

      {open && mounted && createPortal(sheet, document.body)}
    </>
  );
}
