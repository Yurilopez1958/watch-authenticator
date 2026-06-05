'use client';

import { useLang } from '@/lib/i18n';

/** Two-state ES / EN switch shown in the header. */
export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language / Idioma"
      className="inline-flex items-center rounded-full border border-soft overflow-hidden h-9 shrink-0"
    >
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 h-full text-xs font-bold transition-colors ${
            lang === l ? 'bg-accent text-white' : 'text-dim hover:text-foreground'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
