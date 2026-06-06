'use client';

import { ALL_BRANDS } from '@watch-auth/core';
import { useCompliance, type BrandRule } from '@/lib/compliance';
import { useLang } from '@/lib/i18n';

/** Bilingual string pair. */
type Bi = { es: string; en: string };

const OPTIONS: { value: BrandRule | 'none'; label: Bi; help: Bi }[] = [
  { value: 'none', label: { es: 'No representada', en: 'Not represented' }, help: { es: 'Sin restricción', en: 'No restriction' } },
  { value: 'warn', label: { es: 'Avisar', en: 'Warn' }, help: { es: 'Mostrar una alerta', en: 'Show an alert' } },
  { value: 'block', label: { es: 'Bloquear', en: 'Block' }, help: { es: 'Restringir la marca', en: 'Restrict the brand' } },
];

export default function SettingsPage() {
  const { t, lang } = useLang();
  const { config, update } = useCompliance();

  const setRule = (brandId: string, value: BrandRule | 'none') => {
    const rules = { ...config.rules };
    if (value === 'none') delete rules[brandId];
    else rules[brandId] = value;
    update({ rules });
  };

  const representedCount = Object.keys(config.rules).length;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Ajustes de cumplimiento', 'Compliance settings')}</h1>
        <p className="text-muted text-sm max-w-2xl">
          {t('Marca las marcas que tu negocio', 'Mark the brands your business')}{' '}
          <span className="text-accent-bright">{t('representa oficialmente', 'officially represents')}</span>{' '}
          {t(
            '(distribuidor autorizado / distribuidor). Cuando selecciones una de estas para autenticar, buscar o registrar un reloj, la app señala un posible conflicto de interés — o lo restringe — para que no incumplas un acuerdo de distribución.',
            '(authorized dealer / distributor). When you select one of these to authenticate, search or register a watch, the app flags a possible conflict of interest — or restricts it — so you do not breach a distribution agreement.',
          )}
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold">{t('Marcas representadas oficialmente', 'Officially represented brands')}</h2>
          <span className="text-xs text-dim">{representedCount} {t('de', 'of')} {ALL_BRANDS.length} {t('marcadas', 'flagged')}</span>
        </div>

        <div className="space-y-3">
          {ALL_BRANDS.map((b) => {
            const current: BrandRule | 'none' = config.rules[b.id] ?? 'none';
            return (
              <div key={b.id} className="flex items-center justify-between gap-3 flex-wrap border-b border-soft last:border-b-0 pb-3 last:pb-0">
                <div className="font-medium" id={`brand-${b.id}-label`}>{b.name}</div>
                <div
                  role="radiogroup"
                  aria-labelledby={`brand-${b.id}-label`}
                  className="inline-flex rounded-lg border border-soft overflow-hidden"
                >
                  {OPTIONS.map((opt) => {
                    const active = current === opt.value;
                    const tone =
                      opt.value === 'block'
                        ? 'bg-red-500/20 text-red-200'
                        : opt.value === 'warn'
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-accent-soft text-accent-bright';
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRule(b.id, opt.value)}
                        title={opt.help[lang]}
                        aria-label={`${b.name}: ${opt.label[lang]} — ${opt.help[lang]}`}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? tone : 'text-dim hover:text-foreground'
                        } ${opt.value !== 'none' ? 'border-l border-soft' : ''}`}
                      >
                        {opt.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-dim mt-4">
          {t('Almacenado de forma privada en este dispositivo.', 'Stored privately on this device.')}{' '}
          <span className="text-amber-300">{t('Avisar', 'Warn')}</span>{' '}
          {t('te permite continuar tras una alerta;', 'lets you continue after an alert;')}{' '}
          <span className="text-red-300">{t('Bloquear', 'Block')}</span>{' '}
          {t('detiene el flujo para esa marca.', 'stops the flow for that brand.')}
        </p>
      </section>
    </div>
  );
}
