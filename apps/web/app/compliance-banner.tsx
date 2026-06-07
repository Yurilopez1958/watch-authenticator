'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import type { BrandRule } from '@/lib/compliance';

/**
 * Conflict-of-interest banner shown when the selected brand is one the business
 * officially represents. 'warn' = amber alert; 'block' = red restriction.
 */
export function ComplianceBanner({ brandName, rule }: { brandName: string; rule: BrandRule }) {
  const { t } = useLang();
  const isBlock = rule === 'block';
  return (
    <div
      role="alert"
      className={`rounded-xl border-2 p-4 flex items-start gap-3 ${
        isBlock ? 'border-red-500/60 bg-red-500/10' : 'border-amber-500/60 bg-amber-500/10'
      }`}
    >
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`shrink-0 mt-0.5 ${isBlock ? 'text-red-400' : 'text-amber-400'}`}
        aria-hidden="true"
      >
        {isBlock ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </>
        ) : (
          <>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </>
        )}
      </svg>
      <div>
        <div className={`font-bold text-sm uppercase tracking-wide mb-1 ${isBlock ? 'text-red-300' : 'text-amber-300'}`}>
          {isBlock ? t('Restringido — conflicto de interés', 'Restricted — conflict of interest') : t('Posible conflicto de interés', 'Possible conflict of interest')}
        </div>
        <p className={`text-sm leading-relaxed ${isBlock ? 'text-red-100/90' : 'text-amber-100/90'}`}>
          <span className="font-semibold">{brandName}</span>{' '}
          {t('está en tu lista de marcas representadas oficialmente.', 'is on your list of officially represented brands.')}{' '}
          {isBlock
            ? t('Autenticar o registrar esta marca está restringido por tus ajustes de cumplimiento.', 'Authenticating or registering this brand is restricted by your compliance settings.')
            : t('Continúa solo si esto no incumple tu acuerdo de distribución / distribuidor.', 'Continue only if this does not breach your distribution / dealer agreement.')}{' '}
          {t('Gestiónalo en', 'Manage this in')}{' '}
          <Link href="/settings" className="underline font-medium">{t('Ajustes de cumplimiento', 'Compliance settings')}</Link>.
        </p>
      </div>
    </div>
  );
}
