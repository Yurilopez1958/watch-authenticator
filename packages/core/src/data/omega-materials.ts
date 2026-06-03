import type { Material, ReferenceProfile } from '../types/index';

/**
 * Omega's proprietary 18k gold alloys.
 *
 * Unlike Patek/AP/Cartier — who use industry-standard 18k variants — Omega
 * patented three distinct alloys in the 2010s, each with an XRF fingerprint
 * that lets the authentication algorithm distinguish them from generic 18k
 * gold of the same color:
 *
 *  • **Sedna Gold** (rose gold, 2013) — adds palladium to standard Au/Cu/Ag;
 *    the Pd is the key marker because generic 18k rose gold has none.
 *  • **Moonshine Gold** (pale yellow gold, 2019) — higher silver content and
 *    a touch of palladium for a paler hue than standard yellow gold.
 *  • **Canopus Gold** (white gold, 2015) — palladium-platinum-rhodium mix
 *    that produces a noticeably whiter tone than standard 18k white gold.
 *
 * IMPORTANT: exact compositions are not fully published. The ranges below are
 * built from Omega patent filings, marketing material and published spec
 * sheets. Refine with own measurements on verified authentic pieces before
 * treating them as clinical reference.
 */
export const OMEGA_MATERIALS: readonly Material[] = [
  {
    id: 'omega-sedna-gold',
    name: 'Sedna® Gold (Omega 18k rose)',
    kind: 'gold',
    description:
      'Patented Omega 18k rose gold introduced in 2013. Adds palladium (~3%) to the standard Au/Cu/Ag formula, which stabilises the pink tone against fading. Distinctive vs generic rose gold because of the Pd content.',
  },
  {
    id: 'omega-moonshine-gold',
    name: 'Moonshine® Gold (Omega 18k pale yellow)',
    kind: 'gold',
    description:
      'Patented Omega 18k pale yellow gold introduced in 2019 for the Apollo 11 50th anniversary Speedmaster. Higher silver content than standard yellow gold and a small palladium fraction give it a softer, paler hue inspired by moonlight.',
  },
  {
    id: 'omega-canopus-gold',
    name: 'Canopus® Gold (Omega 18k white)',
    kind: 'gold',
    description:
      'Patented Omega 18k white gold with a palladium-platinum-rhodium mix that produces a brilliantly white tone — whiter than standard 18k white gold. Used in Constellation, Speedmaster Moonphase and selected Seamaster references.',
  },
];

/**
 * Brand-specific XRF reference profiles for Omega proprietary alloys. Tagged
 * with brandId: 'omega' so getReferenceProfilesForBrand('omega') picks them
 * up alongside the common profiles.
 */
export const OMEGA_REFERENCE_PROFILES: readonly ReferenceProfile[] = [
  {
    id: 'ref-omega-sedna',
    materialId: 'omega-sedna-gold',
    brandId: 'omega',
    yearStart: 2013,
    source: 'public',
    notes:
      'Au 75% standard 18k. The marker for Sedna vs generic rose gold is the palladium presence (~1.5–4%). Absence of Pd in a piece sold as Sedna is a red flag.',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Cu', minPct: 18, maxPct: 22, toleranceAbs: 0.5, isCritical: true },
      { element: 'Pd', minPct: 1.5, maxPct: 4.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Ag', minPct: 0, maxPct: 3.0, toleranceAbs: 0.3 },
    ],
  },
  {
    id: 'ref-omega-moonshine',
    materialId: 'omega-moonshine-gold',
    brandId: 'omega',
    yearStart: 2019,
    source: 'public',
    notes:
      'Pale yellow gold variant. Distinctive vs standard 18k yellow gold by higher Ag content and a small Pd addition that desaturates the colour.',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Ag', minPct: 12, maxPct: 17, toleranceAbs: 0.5, isCritical: true },
      { element: 'Cu', minPct: 7, maxPct: 11, toleranceAbs: 0.5 },
      { element: 'Pd', minPct: 0.5, maxPct: 3.0, toleranceAbs: 0.3, isCritical: true },
    ],
  },
  {
    id: 'ref-omega-canopus',
    materialId: 'omega-canopus-gold',
    brandId: 'omega',
    yearStart: 2015,
    source: 'public',
    notes:
      'White gold with Pd + Pt + Rh. The simultaneous presence of platinum AND palladium AND rhodium is the fingerprint — generic 18k white gold uses only Pd. Nickel must be near zero (Omega is nickel-free for skin contact).',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Pd', minPct: 12, maxPct: 16, toleranceAbs: 0.5, isCritical: true },
      { element: 'Pt', minPct: 2.0, maxPct: 4.5, toleranceAbs: 0.3, isCritical: true },
      { element: 'Rh', minPct: 0.5, maxPct: 2.5, toleranceAbs: 0.2 },
      { element: 'Cu', minPct: 4, maxPct: 10, toleranceAbs: 0.5 },
      { element: 'Ni', minPct: 0, maxPct: 0.2, toleranceAbs: 0.1, isCritical: true },
    ],
  },
];
