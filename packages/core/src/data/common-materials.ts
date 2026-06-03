import type { Material, ReferenceProfile } from '../types/index';

/**
 * Generic alloys used by Swiss watchmakers other than Rolex.
 * Rolex has proprietary alloys (904L Oystersteel, Everose, etc.) that get
 * their own profiles. Brands like Patek Philippe and Audemars Piguet use
 * standard industry alloys closer to the values below. These profiles can be
 * refined per-brand when reference measurements are available.
 */
export const COMMON_MATERIALS: readonly Material[] = [
  {
    id: 'common-316l-stainless',
    name: '316L stainless steel (generic)',
    kind: 'steel',
    description:
      'Standard AISI 316L austenitic stainless used by Patek Philippe, Audemars Piguet, and most Swiss makers (except Rolex which moved to 904L progressively).',
  },
  {
    id: 'common-18k-yellow-gold',
    name: '18k yellow gold (generic)',
    kind: 'gold',
    description:
      '750‰ gold with silver and copper. Standard Swiss watchmaking yellow gold alloy.',
  },
  {
    id: 'common-18k-white-gold-pd',
    name: '18k white gold, palladium-based',
    kind: 'gold',
    description:
      '750‰ gold with palladium (sometimes a small Ag/Cu addition). Used by Patek Philippe, Audemars Piguet, and other high-end Swiss brands that avoid nickel.',
  },
  {
    id: 'common-18k-rose-gold',
    name: '18k rose / pink gold (generic)',
    kind: 'gold',
    description:
      '750‰ gold with high copper content (≈ 22–23%) and a small silver fraction. Used by Patek Philippe, AP, Vacheron and others (non-proprietary unlike Rolex Everose).',
  },
  {
    id: 'common-950-platinum',
    name: '950 platinum (generic)',
    kind: 'platinum',
    description: '950‰ platinum with iridium or ruthenium for hardness. Industry standard PT950.',
  },
];

/**
 * Generic reference profiles tagged with brandId 'common'. The match algorithm
 * treats this as a wildcard usable by any brand that does not have its own
 * brand-specific profile.
 */
export const COMMON_REFERENCE_PROFILES: readonly ReferenceProfile[] = [
  {
    id: 'ref-common-316l',
    materialId: 'common-316l-stainless',
    brandId: 'common',
    yearStart: 1970,
    source: 'public',
    notes: 'Standard AISI 316L composition. Widely used outside Rolex.',
    elements: [
      { element: 'Fe', minPct: 60, maxPct: 70, toleranceAbs: 1.0, isCritical: true },
      { element: 'Cr', minPct: 16, maxPct: 18, toleranceAbs: 0.5, isCritical: true },
      { element: 'Ni', minPct: 10, maxPct: 14, toleranceAbs: 0.5, isCritical: true },
      { element: 'Mo', minPct: 2.0, maxPct: 3.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Mn', minPct: 0, maxPct: 2.0, toleranceAbs: 0.2 },
      { element: 'Si', minPct: 0, maxPct: 1.0, toleranceAbs: 0.2 },
    ],
  },
  {
    id: 'ref-common-18k-yellow',
    materialId: 'common-18k-yellow-gold',
    brandId: 'common',
    yearStart: 1900,
    source: 'public',
    notes: 'Typical Swiss-watch yellow gold alloy. 750‰ Au.',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Ag', minPct: 9, maxPct: 16, toleranceAbs: 0.5 },
      { element: 'Cu', minPct: 9, maxPct: 16, toleranceAbs: 0.5 },
    ],
  },
  {
    id: 'ref-common-18k-white',
    materialId: 'common-18k-white-gold-pd',
    brandId: 'common',
    yearStart: 1990,
    source: 'public',
    notes: 'Palladium-based white gold typical of high-end Swiss makers.',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Pd', minPct: 12, maxPct: 20, toleranceAbs: 0.5, isCritical: true },
      { element: 'Cu', minPct: 3, maxPct: 10, toleranceAbs: 0.5 },
      { element: 'Ag', minPct: 0, maxPct: 4, toleranceAbs: 0.3 },
      { element: 'Ni', minPct: 0, maxPct: 0.2, toleranceAbs: 0.1, isCritical: true },
    ],
  },
  {
    id: 'ref-common-18k-rose',
    materialId: 'common-18k-rose-gold',
    brandId: 'common',
    yearStart: 1900,
    source: 'public',
    notes: 'Generic 18k rose gold. Higher Cu than yellow gold for the pink tint. Should NOT contain platinum (that is Rolex Everose only).',
    elements: [
      { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
      { element: 'Cu', minPct: 20, maxPct: 24, toleranceAbs: 0.5, isCritical: true },
      { element: 'Ag', minPct: 0, maxPct: 4, toleranceAbs: 0.3 },
    ],
  },
  {
    id: 'ref-common-950-pt',
    materialId: 'common-950-platinum',
    brandId: 'common',
    yearStart: 1900,
    source: 'public',
    notes: 'Generic PT950 alloy with iridium or ruthenium.',
    elements: [
      { element: 'Pt', minPct: 94.5, maxPct: 95.5, toleranceAbs: 0.3, isCritical: true },
      { element: 'Ir', minPct: 0, maxPct: 5.5, toleranceAbs: 0.3 },
      { element: 'Ru', minPct: 0, maxPct: 5.5, toleranceAbs: 0.3 },
    ],
  },
];
