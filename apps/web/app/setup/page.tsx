'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';

type Status = {
  saasEnabled: boolean;
  core: { stripeSecret: boolean; stripeWebhook: boolean; supabaseServiceRole: boolean; supabaseUrl: boolean; appUrl: boolean; ai: boolean };
  plans: { proMonthly: boolean; businessMonthly: boolean; proYearly: boolean; businessYearly: boolean; credits: boolean };
  email: { resend: boolean; from: boolean; adminEmail: boolean };
};

function Row({ ok, label, env }: { ok: boolean; label: string; env: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-soft last:border-0">
      <span className="flex items-center gap-2">
        <span className={ok ? 'text-emerald-400' : 'text-red-400'}>{ok ? '✓' : '✗'}</span>
        {label}
      </span>
      <code className="text-[0.7rem] text-dim font-mono">{env}</code>
    </div>
  );
}

export default function SetupPage() {
  const { t } = useLang();
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState(false);

  const load = () => {
    fetch('/api/saas-status').then((r) => r.json()).then(setS).catch(() => setErr(true));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Configuración del SaaS', 'SaaS setup')}</h1>
        <p className="text-muted text-sm">
          {t('Esta página comprueba qué variables de entorno están puestas (no muestra los valores). Ve añadiéndolas en Vercel y pulsa "Actualizar".', 'This page checks which environment variables are set (it never shows the values). Add them in Vercel and press "Refresh".')}
        </p>
      </section>

      <button onClick={load} className="btn-ghost text-sm">{t('Actualizar', 'Refresh')}</button>

      {err && <div className="card p-4 text-sm text-amber-300">{t('No se pudo leer el estado.', 'Could not read status.')}</div>}

      {s && (
        <>
          <div className={`card p-4 ${s.saasEnabled ? 'border-emerald-500/40' : 'border-amber-500/40'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('SaaS activo', 'SaaS active')}</span>
              <span className={s.saasEnabled ? 'text-emerald-300' : 'text-amber-300'}>
                {s.saasEnabled ? t('Sí (SAAS_ENABLED=true)', 'Yes (SAAS_ENABLED=true)') : t('No — la app funciona normal hasta activarlo', 'No — app runs normally until enabled')}
              </span>
            </div>
          </div>

          <section className="card p-4">
            <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Núcleo (obligatorio)', 'Core (required)')}</div>
            <Row ok={s.core.stripeSecret} label="Stripe secret" env="STRIPE_SECRET_KEY" />
            <Row ok={s.core.stripeWebhook} label="Stripe webhook" env="STRIPE_WEBHOOK_SECRET" />
            <Row ok={s.core.supabaseServiceRole} label="Supabase service role" env="SUPABASE_SERVICE_ROLE_KEY" />
            <Row ok={s.core.supabaseUrl} label="Supabase URL" env="SUPABASE_URL" />
            <Row ok={s.core.appUrl} label="App URL" env="NEXT_PUBLIC_APP_URL" />
            <Row ok={s.core.ai} label={t('IA (análisis/valuación)', 'AI (analysis/valuation)')} env="ANTHROPIC_API_KEY" />
          </section>

          <section className="card p-4">
            <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Precios (planes y créditos)', 'Prices (plans & credits)')}</div>
            <Row ok={s.plans.proMonthly} label="Pro / mes" env="STRIPE_PRICE_PRO" />
            <Row ok={s.plans.businessMonthly} label="Business / mes" env="STRIPE_PRICE_BUSINESS" />
            <Row ok={s.plans.proYearly} label={t('Pro / año (opcional)', 'Pro / year (optional)')} env="STRIPE_PRICE_PRO_YEAR" />
            <Row ok={s.plans.businessYearly} label={t('Business / año (opcional)', 'Business / year (optional)')} env="STRIPE_PRICE_BUSINESS_YEAR" />
            <Row ok={s.plans.credits} label={t('Pack de créditos (opcional)', 'Credit pack (optional)')} env="STRIPE_PRICE_CREDITS" />
          </section>

          <section className="card p-4">
            <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Email (opcional)', 'Email (optional)')}</div>
            <Row ok={s.email.resend} label="Resend" env="RESEND_API_KEY" />
            <Row ok={s.email.from} label={t('Remitente', 'From address')} env="EMAIL_FROM" />
            <Row ok={s.email.adminEmail} label={t('Email del admin (alertas)', 'Admin email (alerts)')} env="ADMIN_EMAIL" />
          </section>

          <section className="card p-4 text-xs text-muted space-y-1 border-l-4 border-l-accent">
            <div className="font-semibold text-neutral-200">{t('Pasos restantes', 'Remaining steps')}</div>
            <p>{t('1) Corre las migraciones SQL (0001, 0002, 0003) en Supabase.', '1) Run the SQL migrations (0001, 0002, 0003) in Supabase.')}</p>
            <p>{t('2) Crea los precios en Stripe (mensual/anual + pack de créditos) y el webhook → /api/billing/webhook.', '2) Create the Stripe prices (monthly/yearly + credit pack) and the webhook → /api/billing/webhook.')}</p>
            <p>{t('3) Añade las variables arriba en Vercel y pon SAAS_ENABLED=true.', '3) Add the variables above in Vercel and set SAAS_ENABLED=true.')}</p>
            <p>{t('4) Hazte admin en Supabase: update profiles set role=\'admin\'.', "4) Make yourself admin in Supabase: update profiles set role='admin'.")}</p>
          </section>
        </>
      )}
    </div>
  );
}
