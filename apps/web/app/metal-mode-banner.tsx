'use client';

import { useLang } from '@/lib/i18n';

/**
 * Fixed reminder shown wherever a Niton reading is taken/entered: the gun must
 * be in METAL (General Metals / Alloy) mode, not Precious Metals mode, or the
 * Cr/Ni/Mo composition needed to authenticate steel/gold cases will be wrong.
 *
 * The Niton device labels (General Metals / Alloy Mode / Precious Metals) are
 * kept in English on purpose: that is exactly how they appear on the gun.
 */
export function MetalModeBanner() {
  const { t } = useLang();
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-amber-500/60 bg-amber-500/10 p-4 flex items-start gap-3"
    >
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="text-amber-400 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>
        <div className="font-bold text-amber-300 text-sm uppercase tracking-wide mb-1">
          {t('Importante — modo de la pistola', 'Important — gun mode')}
        </div>
        <p className="text-sm text-amber-100/90 leading-relaxed">
          {t('Asegúrate de que la pistola Niton está en ', 'Make sure the Niton gun is set to ')}
          <span className="font-bold">{t('modo METAL (General Metals / Alloy Mode)', 'METAL mode (General Metals / Alloy Mode)')}</span>
          {t(', ', ', ')}
          <span className="font-bold">{t('NO en modo Precious Metals', 'NOT Precious Metals mode')}</span>
          {t(', para garantizar lecturas correctas de la composición de la aleación en la caja y los componentes del reloj.', ', to guarantee correct alloy-composition readings on the case and watch components.')}
        </p>
      </div>
    </div>
  );
}
