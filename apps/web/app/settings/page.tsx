'use client';

import { ALL_BRANDS } from '@watch-auth/core';
import { useCompliance, type BrandRule } from '@/lib/compliance';

const OPTIONS: { value: BrandRule | 'none'; label: string; help: string }[] = [
  { value: 'none', label: 'Not represented', help: 'No restriction' },
  { value: 'warn', label: 'Warn', help: 'Show an alert' },
  { value: 'block', label: 'Block', help: 'Restrict the brand' },
];

export default function SettingsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Compliance settings</h1>
        <p className="text-muted text-sm max-w-2xl">
          Mark the brands your business <span className="text-accent-bright">officially represents</span>{' '}
          (authorized dealer / distributor). When you select one of these to authenticate, search or
          register a watch, the app flags a possible conflict of interest — or restricts it — so you
          do not breach a distribution agreement.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold">Officially represented brands</h2>
          <span className="text-xs text-dim">{representedCount} of {ALL_BRANDS.length} flagged</span>
        </div>

        <div className="space-y-3">
          {ALL_BRANDS.map((b) => {
            const current: BrandRule | 'none' = config.rules[b.id] ?? 'none';
            return (
              <div key={b.id} className="flex items-center justify-between gap-3 flex-wrap border-b border-soft last:border-b-0 pb-3 last:pb-0">
                <div className="font-medium">{b.name}</div>
                <div className="inline-flex rounded-lg border border-soft overflow-hidden">
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
                        onClick={() => setRule(b.id, opt.value)}
                        title={opt.help}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? tone : 'text-dim hover:text-foreground'
                        } ${opt.value !== 'none' ? 'border-l border-soft' : ''}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-dim mt-4">
          Stored privately on this device. <span className="text-amber-300">Warn</span> lets you continue
          after an alert; <span className="text-red-300">Block</span> stops the flow for that brand.
        </p>
      </section>
    </div>
  );
}
