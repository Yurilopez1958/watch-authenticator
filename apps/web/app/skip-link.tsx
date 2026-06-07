'use client';

import { useLang } from '@/lib/i18n';

/** Accessibility "skip to main content" link (first focusable element). */
export function SkipLink() {
  const { t } = useLang();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
    >
      {t('Saltar al contenido', 'Skip to content')}
    </a>
  );
}
