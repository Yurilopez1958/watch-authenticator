'use client';

import { useLang } from '@/lib/i18n';

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-soft mt-16 sm:mt-24 py-8 text-center text-xs text-dim px-4 leading-relaxed">
      <p className="font-medium text-soft">Watch Authenticator</p>
      <p className="mt-1">
        {t(
          'Datos de referencia públicos; afina con tus propias mediciones. No constituye una garantía legal de autenticidad.',
          'Public reference data; refine with your own measurements. Not a legal guarantee of authenticity.',
        )}
      </p>
    </footer>
  );
}
