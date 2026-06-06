'use client';

import { usePro } from '@/lib/pro';
import { useLang } from '@/lib/i18n';

/** Compact Simple/Pro switch shown in the header. */
export function ProToggle() {
  const { pro, setPro } = usePro();
  const { t } = useLang();
  return (
    <button
      onClick={() => setPro(!pro)}
      aria-pressed={pro}
      title={pro
        ? t('Modo Pro activado — toca para volver a Simple', 'Pro mode on — tap for Simple')
        : t('Modo Simple — toca para ver controles avanzados (Pro)', 'Simple mode — tap for advanced controls (Pro)')}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border transition-colors shrink-0 ${
        pro ? 'border-accent bg-accent-soft text-accent-bright' : 'border-soft text-dim hover:text-foreground'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <span className="text-xs font-bold hidden xs:inline">{pro ? t('Pro', 'Pro') : t('Simple', 'Simple')}</span>
    </button>
  );
}
