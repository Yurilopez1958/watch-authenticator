'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';

type Tool = {
  href: string;
  es: string; en: string;
  esBody: string; enBody: string;
  icon: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    href: '/authenticate',
    es: 'Autenticar un reloj', en: 'Authenticate a watch',
    esBody: 'El asistente completo que te lleva paso a paso hasta el veredicto.',
    enBody: 'The full wizard that walks you step by step to a verdict.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v3l2 1.5" />
      </svg>
    ),
  },
  {
    href: '/timegrapher',
    es: 'Oír el reloj', en: 'Listen to the watch',
    esBody: 'Mide la precisión escuchando el tic-tac con el micrófono del teléfono.',
    enBody: 'Measure accuracy by listening to the ticking with your phone mic.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    ),
  },
  {
    href: '/market',
    es: 'Precio y oferta', en: 'Price & offer',
    esBody: 'Valor de mercado orientativo y cuánto ofrecer si lo compras.',
    enBody: 'Orientative market value and how much to offer if you buy.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/gallery',
    es: 'Galería de fotos', en: 'Photo gallery',
    esBody: 'Guarda fotos de relojes auténticos por partes para comparar.',
    enBody: 'Save photos of genuine watches by part to compare.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { t, lang } = useLang();

  const steps = [
    {
      es: 'Elige el reloj', en: 'Pick the watch',
      esBody: 'Marca, modelo y año. Puedes buscar por la referencia del reloj.',
      enBody: 'Brand, model and year. You can search by the watch reference.',
    },
    {
      es: 'Mídelo y fotografíalo', en: 'Measure & photograph',
      esBody: 'Mide el metal con la pistola y haz fotos de las partes clave.',
      enBody: 'Measure the metal with the gun and photograph the key parts.',
    },
    {
      es: 'Lee el resultado', en: 'Read the result',
      esBody: 'Verde = auténtico, ámbar = dudoso, rojo = sospechoso. Y un informe.',
      enBody: 'Green = genuine, amber = unsure, red = suspicious. Plus a report.',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="text-center space-y-5">
        <div className="inline-flex chip pulse-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
          {t('Autentica relojes de lujo, fácil', 'Authenticate luxury watches, easily')}
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          {t('¿Tu reloj es', 'Is your watch')}<br />
          <span className="text-gradient">{t('auténtico?', 'genuine?')}</span>
        </h1>
        <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
          {t(
            'Esta app te lo dice paso a paso. No necesitas saber de relojería ni de química: te guía en todo momento.',
            'This app tells you step by step. No watch or chemistry knowledge needed: it guides you the whole way.',
          )}
        </p>
        <div className="flex flex-col items-center gap-3 pt-2">
          <Link
            href="/authenticate"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {t('Empezar', 'Start')}
          </Link>
          <p className="text-xs text-dim">
            {t('¿Primera vez? Toca el botón ', 'First time? Tap the ')}
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[0.6rem] font-bold align-middle">?</span>
            {t(' arriba en cualquier momento.', ' button up top anytime.')}
          </p>
        </div>
      </section>

      {/* How it works in 3 steps */}
      <section className="space-y-6">
        <h2 className="text-center text-xl sm:text-2xl font-bold">
          {t('Cómo funciona, en 3 pasos', 'How it works, in 3 steps')}
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {steps.map((s, i) => (
            <div key={i} className="card p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent text-white text-xl font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold">{lang === 'es' ? s.es : s.en}</h3>
              <p className="text-sm text-muted leading-relaxed">{lang === 'es' ? s.esBody : s.enBody}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/authenticate" className="btn-primary inline-flex items-center gap-2">
            {t('Empezar ahora', 'Start now')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Tools */}
      <section className="space-y-6">
        <h2 className="text-center text-xl sm:text-2xl font-bold">
          {t('Todas las herramientas', 'All the tools')}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {TOOLS.map((c) => (
            <Link key={c.href} href={c.href} className="card card-hover p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent-bright flex items-center justify-center shrink-0">
                {c.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{lang === 'es' ? c.es : c.en}</h3>
                <p className="text-sm text-muted leading-relaxed">{lang === 'es' ? c.esBody : c.enBody}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
