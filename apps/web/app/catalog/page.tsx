'use client';

import {
  ALL_BRANDS,
  ALL_MODELS,
  ALL_MOVEMENTS,
  ALL_REFERENCE_PROFILES,
  ALL_MATERIALS,
} from '@watch-auth/core';
import { useLang, type Lang } from '@/lib/i18n';

type Model = typeof ALL_MODELS[number];

/** Bilingual string pair. */
type Bi = { es: string; en: string };

function groupByCollection(models: readonly Model[]): [string, Model[]][] {
  const map = new Map<string, Model[]>();
  for (const m of models) {
    const arr = map.get(m.collection) ?? [];
    arr.push(m);
    map.set(m.collection, arr);
  }
  return Array.from(map.entries());
}

const AUDIENCE_LABELS: Record<Model['audience'], Bi> = {
  men: { es: 'Hombre', en: "Men's" },
  women: { es: 'Mujer', en: "Women's" },
  unisex: { es: 'Unisex', en: 'Unisex' },
};

function audienceLabel(a: Model['audience'], lang: Lang) {
  return AUDIENCE_LABELS[a][lang];
}

export default function CatalogPage() {
  const { t, lang } = useLang();
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Catálogo', 'Catalog')}</h1>
        <p className="text-muted text-sm">
          {ALL_BRANDS.map((b) => (
            <span key={b.id} className="chip mr-2">{b.name}</span>
          ))}
          <span className="ml-1">
            {ALL_MODELS.length} {t('modelo(s)', 'model(s)')} · {ALL_MOVEMENTS.length} {t('calibre(s)', 'caliber(s)')} · {ALL_MATERIALS.length} {t('material(es)', 'material(s)')} · {ALL_REFERENCE_PROFILES.length} {t('perfil(es) de referencia.', 'reference profile(s).')}
          </span>
        </p>
      </section>

      {ALL_BRANDS.map((brand) => {
        const brandModels = ALL_MODELS.filter((m) => m.brandId === brand.id);
        const grouped = groupByCollection(brandModels);
        return (
          <section key={brand.id} className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-gradient">{brand.name}</h2>
              <p className="text-xs text-dim mt-1">
                {brand.country} · {t('fundada en', 'founded')} {brand.foundedYear} · {brandModels.length} {t('referencia(s) en', 'reference(s) across')} {grouped.length} {t('colección(es)', 'collection(s)')}
              </p>
            </header>
            {grouped.map(([collection, models]) => (
              <div key={collection}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-lg font-semibold text-accent-bright">{collection}</h3>
                  <span className="text-xs text-dim">{models.length} {t('referencia(s)', 'reference(s)')}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {models.map((m) => (
                    <div key={m.id} className="card p-4 card-hover">
                      <div className="flex justify-between items-baseline gap-2">
                        <div className="font-semibold">{m.name}</div>
                        <span className="chip text-[0.65rem]">{audienceLabel(m.audience, lang)}</span>
                      </div>
                      <div className="text-sm text-dim mt-1">
                        Ref. <span className="font-mono text-muted">{m.reference}</span> · {m.yearStart}–{m.yearEnd ?? t('presente', 'present')} · {m.caliber} · ⌀ {m.caseDiameterMm} mm
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('Todos los calibres', 'All calibers')}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {ALL_MOVEMENTS.map((mov) => (
            <div key={mov.id} className="card p-4">
              <div className="flex justify-between items-baseline">
                <div className="text-lg font-semibold text-gradient">Cal. {mov.caliber}</div>
                <span className="chip text-[0.65rem]">{mov.yearStart}–{mov.yearEnd ?? t('presente', 'present')}</span>
              </div>
              <div className="text-xs text-dim mt-1">
                {mov.jewels} {t('rubíes', 'jewels')} · {mov.powerReserveHours} {t('h de reserva', 'h PR')} · {mov.vph.toLocaleString()} vph · {mov.escapement} · {mov.cosc ? 'COSC' : t('cert. propia', 'in-house cert.')}
              </div>
              {mov.features.length > 0 && (
                <div className="text-xs text-muted mt-1 capitalize">{t('Funciones', 'Functions')}: {mov.features.join(', ')}</div>
              )}
              {mov.notes && <p className="text-xs text-muted mt-2 leading-relaxed">{mov.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('Materiales y perfiles de referencia', 'Materials and reference profiles')}</h2>
        <div className="space-y-4">
          {ALL_MATERIALS.map((material) => {
            const profile = ALL_REFERENCE_PROFILES.find((p) => p.materialId === material.id);
            return (
              <div key={material.id} className="card p-5">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-semibold text-lg">{material.name}</h3>
                  <span className="chip">{material.kind}</span>
                </div>
                {material.description && (
                  <p className="text-sm text-muted mb-4 leading-relaxed">{material.description}</p>
                )}
                {profile && (
                  <table className="w-full text-sm">
                    <thead className="text-[0.7rem] text-dim uppercase tracking-wider">
                      <tr>
                        <th className="text-left py-2">{t('Elemento', 'Element')}</th>
                        <th className="text-left py-2">{t('Rango (%)', 'Range (%)')}</th>
                        <th className="text-left py-2">{t('Tolerancia', 'Tolerance')}</th>
                        <th className="text-left py-2">{t('Crítico', 'Critical')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.elements.map((el) => (
                        <tr key={el.element} className="border-t border-soft">
                          <td className="py-2 font-mono">{el.element}</td>
                          <td className="py-2">{el.minPct}–{el.maxPct}</td>
                          <td className="py-2 text-dim">±{el.toleranceAbs ?? '—'}</td>
                          <td className="py-2">{el.isCritical ? <span className="text-accent-bright">✓</span> : <span className="text-dim">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
