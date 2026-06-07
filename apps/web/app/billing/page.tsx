'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useSession } from '@/lib/use-session';
import { getBillingMe, startCheckout, openPortal, buyCredits, type BillingMe, type PlanId, type BillingInterval } from '@/lib/billing-client';

type Card = { id: PlanId; price: string; auth: string; val: string; dev: number; highlight?: boolean };
const CARDS: Card[] = [
  { id: 'free',     price: '0',  auth: '5',   val: '10',  dev: 1 },
  { id: 'pro',      price: '29', auth: '100', val: '500', dev: 2, highlight: true },
  { id: 'business', price: '99', auth: '∞',   val: '∞',   dev: 5 },
];
const NAME: Record<PlanId, string> = { free: 'Free', pro: 'Pro', business: 'Business' };

export default function BillingPage() {
  const { t, lang } = useLang();
  const { enabled, session, email, signInWithEmail } = useSession();
  const [me, setMe] = useState<BillingMe | null>(null);
  const [busy, setBusy] = useState<PlanId | 'portal' | 'credits' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [signEmail, setSignEmail] = useState('');
  const [signSent, setSignSent] = useState(false);
  const [interval, setIntervalState] = useState<BillingInterval>('month');

  // Success / cancel banners from the Stripe redirect.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('success')) setNotice(t('¡Gracias! Tu suscripción se está activando.', 'Thank you! Your subscription is being activated.'));
    if (p.get('credits')) setNotice(t('¡Gracias! Tus créditos se están añadiendo.', 'Thank you! Your credits are being added.'));
    if (p.get('canceled')) setNotice(t('Pago cancelado. No se ha cobrado nada.', 'Payment canceled. Nothing was charged.'));
  }, [t]);

  useEffect(() => { if (session) void getBillingMe().then(setMe); }, [session]);

  const currentPlan: PlanId = me?.plan ?? 'free';

  const subscribe = async (plan: 'pro' | 'business') => {
    setBusy(plan); setNotice(null);
    const url = await startCheckout(plan, interval);
    setBusy(null);
    if (url) window.location.href = url;
    else setNotice(t('El sistema de suscripciones aún no está activo. Vuelve a intentarlo más tarde.', 'The subscription system is not active yet. Please try again later.'));
  };
  const purchaseCredits = async () => {
    setBusy('credits'); setNotice(null);
    const url = await buyCredits(1);
    setBusy(null);
    if (url) window.location.href = url;
    else setNotice(t('La compra de créditos aún no está disponible.', 'Buying credits is not available yet.'));
  };
  const manage = async () => {
    setBusy('portal'); setNotice(null);
    const url = await openPortal();
    setBusy(null);
    if (url) window.location.href = url;
    else setNotice(t('La gestión de la suscripción aún no está disponible.', 'Subscription management is not available yet.'));
  };
  const doSignIn = async () => {
    if (!signEmail.trim()) return;
    const { error } = await signInWithEmail(signEmail.trim(), '/billing');
    if (!error) setSignSent(true);
    else setNotice(error);
  };

  const pct = (used: number, limit: number | null) => (limit == null || limit === 0 ? 0 : Math.min(100, (used / limit) * 100));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Planes y suscripción', 'Plans & subscription')}</h1>
        <p className="text-muted text-sm max-w-2xl">
          {t('Elige el plan que se ajusta a tu volumen de autenticaciones y valuaciones. Puedes cambiar o cancelar cuando quieras.', 'Pick the plan that fits your authentication and valuation volume. Change or cancel anytime.')}
        </p>
      </section>

      {notice && <div className="card p-3 border-l-4 border-l-accent text-sm">{notice}</div>}

      {/* Estado actual / uso */}
      {session && (
        <section className="card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-dim">{t('Tu plan', 'Your plan')}</div>
              <div className="text-xl font-bold">{NAME[currentPlan]} <span className="text-sm font-normal text-dim">· {email}</span></div>
            </div>
            {currentPlan !== 'free' && (
              <button onClick={() => void manage()} disabled={busy === 'portal'} className="btn-ghost text-sm">
                {busy === 'portal' ? t('Abriendo…', 'Opening…') : t('Gestionar suscripción', 'Manage subscription')}
              </button>
            )}
          </div>
          {me && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Usage label={t('Autenticaciones este mes', 'Authentications this month')} used={me.used.auth} limit={me.limits.auth} pct={pct(me.used.auth, me.limits.auth)} t={t} />
                <Usage label={t('Valuaciones este mes', 'Valuations this month')} used={me.used.valuation} limit={me.limits.valuation} pct={pct(me.used.valuation, me.limits.valuation)} t={t} />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 border-t border-soft pt-3">
                <div className="text-sm">
                  <span className="text-dim">{t('Créditos extra', 'Extra credits')}:</span> <span className="font-bold font-mono">{me.credits}</span>
                  <span className="text-xs text-dim ml-2">{t('(se usan al pasar el límite del plan)', '(used when you exceed the plan limit)')}</span>
                </div>
                <button onClick={() => void purchaseCredits()} disabled={busy === 'credits'} className="btn-ghost text-sm">
                  {busy === 'credits' ? t('Abriendo…', 'Opening…') : t('Comprar créditos', 'Buy credits')}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Login si no hay sesión */}
      {!session && (
        <section className="card p-5 space-y-3">
          <div className="text-sm font-semibold">{t('Inicia sesión para suscribirte', 'Sign in to subscribe')}</div>
          {!enabled ? (
            <p className="text-sm text-amber-300">{t('El inicio de sesión aún no está configurado en este entorno.', 'Sign-in is not configured in this environment yet.')}</p>
          ) : signSent ? (
            <p className="text-sm text-emerald-300">{t('Revisa tu correo: te enviamos un enlace para entrar.', 'Check your email: we sent you a sign-in link.')}</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <input value={signEmail} onChange={(e) => setSignEmail(e.target.value)} type="email" placeholder={t('tu@correo.com', 'you@email.com')} className="field max-w-xs" />
              <button onClick={() => void doSignIn()} className="btn-primary text-sm">{t('Enviar enlace', 'Send link')}</button>
            </div>
          )}
        </section>
      )}

      {/* Intervalo */}
      <div className="flex items-center gap-2">
        {(['month', 'year'] as BillingInterval[]).map((iv) => (
          <button key={iv} onClick={() => setIntervalState(iv)} className={`chip cursor-pointer ${interval === iv ? '!bg-accent !text-white !border-transparent' : ''}`}>
            {iv === 'month' ? t('Mensual', 'Monthly') : t('Anual', 'Yearly')}
          </button>
        ))}
        {interval === 'year' && <span className="text-xs text-emerald-300">{t('Ahorra ~2 meses', 'Save ~2 months')}</span>}
      </div>

      {/* Tarjetas de planes */}
      <section className="grid sm:grid-cols-3 gap-4">
        {CARDS.map((c) => {
          const isCurrent = session && currentPlan === c.id;
          return (
            <div key={c.id} className={`card p-5 space-y-3 ${c.highlight ? 'border-accent' : ''}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">{NAME[c.id]}</h3>
                <div className="text-right"><span className="text-2xl font-bold">{c.price === '0' ? t('Gratis', 'Free') : `${c.price} €`}</span>{c.price !== '0' && <span className="text-xs text-dim">/{t('mes', 'mo')}</span>}</div>
              </div>
              <ul className="text-sm text-muted space-y-1">
                <li>{c.auth} {t('autenticaciones/mes', 'authentications/mo')}</li>
                <li>{c.val} {t('valuaciones/mes', 'valuations/mo')}</li>
                <li>{c.dev} {t('dispositivo(s)', 'device(s)')}</li>
              </ul>
              {isCurrent ? (
                <div className="text-sm font-semibold text-emerald-300 text-center py-2">✓ {t('Tu plan actual', 'Your current plan')}</div>
              ) : c.id === 'free' ? (
                <div className="text-xs text-dim text-center py-2">{t('Incluido por defecto', 'Included by default')}</div>
              ) : (
                <button onClick={() => void subscribe(c.id as 'pro' | 'business')} disabled={busy === c.id} className="btn-primary w-full text-sm">
                  {busy === c.id ? t('Abriendo…', 'Opening…') : (currentPlan !== 'free' ? t('Cambiar a este plan', 'Switch to this plan') : t('Suscribirse', 'Subscribe'))}
                </button>
              )}
            </div>
          );
        })}
      </section>

      <p className="text-xs text-dim">{t('Los pagos se procesan de forma segura por un proveedor externo. Puedes cancelar en cualquier momento desde "Gestionar suscripción".', 'Payments are processed securely by an external provider. You can cancel anytime from “Manage subscription”.')}</p>
    </div>
  );
}

function Usage({ label, used, limit, pct, t }: { label: string; used: number; limit: number | null; pct: number; t: (es: string, en: string) => string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-dim uppercase tracking-wide">{label}</span>
        <span className="font-mono">{used} / {limit == null ? '∞' : limit}</span>
      </div>
      <div className="h-2.5 rounded-full bg-blue-950/50 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#f87171' : pct >= 80 ? '#fbbf24' : 'linear-gradient(90deg,#34d399,#60a5fa)' }} />
      </div>
      {limit != null && used >= limit && <div className="text-[0.7rem] text-red-300 mt-1">{t('Límite alcanzado — sube de plan.', 'Limit reached — upgrade your plan.')}</div>}
    </div>
  );
}
