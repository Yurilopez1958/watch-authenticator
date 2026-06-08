'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { usePaidPlan } from '@/lib/use-plan';

type Bi = { es: string; en: string };

/**
 * Wraps a page/feature that is only available on a PAID plan (Pro or Business).
 *
 * - Billing not configured (dev / missing env) → renders children (never locks).
 * - Plan couldn't be read (transient error) → renders children (fail-open).
 * - Signed-in user on the free plan → shows an upgrade card instead.
 */
export function PaidGate({ title, desc, children }: { title: Bi; desc?: Bi; children: React.ReactNode }) {
  const { t, lang } = useLang();
  const { paid, enabled, loading, known } = usePaidPlan();

  if (!enabled) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-soft border-t-accent-bright animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!known || paid) return <>{children}</>;

  // Signed-in user on the free plan → upsell.
  return (
    <div className="max-w-lg mx-auto py-6">
      <div className="card p-6 sm:p-8 text-center space-y-5">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft text-accent-bright mx-auto">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title[lang]}</h1>
          <p className="text-sm text-muted leading-relaxed">
            {t('Esta función está disponible en los planes de pago.', 'This feature is available on the paid plans.')}
            {desc ? ' ' + desc[lang] : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/billing" className="btn-primary">{t('Ver planes', 'See plans')}</Link>
        </div>
        <p className="text-xs text-dim">
          {t('¿Ya tienes un plan? Puede tardar unos segundos en activarse tras el pago.', 'Already subscribed? It can take a few seconds to activate after payment.')}
        </p>
      </div>
    </div>
  );
}
