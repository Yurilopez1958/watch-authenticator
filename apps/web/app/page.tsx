import Link from 'next/link';

type Card = {
  href: string | null;
  title: string;
  body: string;
  icon: React.ReactNode;
};

const cards: Card[] = [
  {
    href: '/connect',
    title: 'Connect your Niton',
    body: 'Pick your XRF model and set up CSV import, folder watcher, or Bluetooth scan.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 3v18M18 3v18M6 8h12M6 16h12" />
      </svg>
    ),
  },
  {
    href: '/verify',
    title: 'Verify a watch',
    body: 'Enter brand, model, year and the measured XRF composition. Get a verdict, score, and concrete flags.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
        <path d="M11 8v3l2 1.5" />
      </svg>
    ),
  },
  {
    href: '/import',
    title: 'Import CSV',
    body: 'Drop a CSV exported by NDT or NitonConnect. Each reading is parsed and analyzed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    href: '/catalog',
    title: 'Catalog',
    body: 'Browse Rolex models, materials, and reference profiles with the full element ranges.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 19.5V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15.5" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
        <path d="M8 7h8M8 11h8" />
      </svg>
    ),
  },
  {
    href: null,
    title: 'Reference gallery',
    body: 'Coming soon. Authentic photos of movement, hands, logo, crown, dial, and serial — side-by-side compare.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: null,
    title: 'AI visual analysis',
    body: 'Coming soon. Claude Vision compares parts and points out subtle discrepancies in natural language.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-5">
        <div className="inline-flex chip pulse-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
          XRF + AI · multi-platform MVP
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Watch authentication<br />
          <span className="text-gradient">by composition</span>
        </h1>
        <p className="text-muted text-base max-w-2xl mx-auto leading-relaxed">
          Compare metal composition measured with your Thermo Scientific Niton XL against a
          reference database by brand, model, and year. Reinforced with a gallery of authentic
          photos and AI vision analysis.
        </p>
        <div className="flex justify-center gap-3 pt-3">
          <Link href="/verify" className="btn-primary">Verify a watch</Link>
          <Link href="/connect" className="btn-ghost">Connect Niton</Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {cards.map((c) => {
          const inner = (
            <>
              <div className="w-10 h-10 rounded-lg bg-accent-soft text-accent-bright flex items-center justify-center mb-4">
                {c.icon}
              </div>
              <h2 className="text-lg font-semibold mb-2">{c.title}</h2>
              <p className="text-sm text-muted leading-relaxed">{c.body}</p>
            </>
          );
          if (c.href) {
            return (
              <Link key={c.title} href={c.href} className="card card-hover p-6 block">
                {inner}
              </Link>
            );
          }
          return (
            <div key={c.title} className="card p-6 opacity-60">{inner}</div>
          );
        })}
      </section>
    </div>
  );
}
