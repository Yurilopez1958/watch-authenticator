import type { Material, ReferenceProfile } from '../types/index';

/**
 * Publicly documented reference materials for Rolex.
 *
 * IMPORTANT: Ranges come from public data (standard alloy specifications, patents,
 * Rolex technical sheets and industry literature). They should be refined with
 * own measurements on verified authentic watches before being used as clinical
 * reference.
 */
export const ROLEX_MATERIALS: readonly Material[] = [
  {
    id: 'rolex-904l-oystersteel',
    name: '904L Oystersteel',
    kind: 'steel',
    description:
      'Super-austenitic stainless steel UNS N08904. Rolex has called it Oystersteel since 2018. Introduced progressively: Sea-Dweller from 1985, most lines by 2003.',
  },
  {
    id: 'rolex-316l-pre-904l',
    name: '316L (Rolex pre-904L)',
    kind: 'steel',
    description:
      'AISI 316L stainless steel used by Rolex before the transition to 904L. Reference for authenticating pre-transition pieces.',
  },
  {
    id: 'rolex-18k-yellow-gold',
    name: 'Rolex 18k Yellow Gold',
    kind: 'gold',
    description: 'Alloy of 750‰ gold with silver and copper. In-house foundry since 2005.',
  },
  {
    id: 'rolex-18k-white-gold',
    name: 'Rolex 18k White Gold',
    kind: 'gold',
    description:
      'Alloy of 750‰ gold with palladium (no nickel). Rolex avoids nickel to reduce allergic reactions.',
  },
  {
    id: 'rolex-18k-everose-gold',
    name: 'Rolex 18k Everose Gold',
    kind: 'gold',
    description:
      'Proprietary rose alloy patented by Rolex in 2005. Contains a small fraction of platinum that keeps the pink color stable over time and resists fading from chlorine exposure.',
  },
  {
    id: 'rolex-950-platinum',
    name: 'Rolex 950 Platinum',
    kind: 'platinum',
    description: '950‰ platinum alloy with ruthenium for hardness.',
  },
];

/** 904L Oystersteel profile (modern Rolex, brand-wide). */
const PROFILE_904L: ReferenceProfile = {
  id: 'ref-rolex-904l',
  materialId: 'rolex-904l-oystersteel',
  brandId: 'rolex',
  yearStart: 1985,
  source: 'public',
  notes:
    'UNS N08904 / EN 1.4539. Typical published spec ranges. Refine with own measurements per model.',
  elements: [
    { element: 'Fe', minPct: 42, maxPct: 50, toleranceAbs: 1.0, isCritical: true },
    { element: 'Cr', minPct: 19, maxPct: 23, toleranceAbs: 0.5, isCritical: true },
    { element: 'Ni', minPct: 23, maxPct: 28, toleranceAbs: 0.5, isCritical: true },
    { element: 'Mo', minPct: 4.0, maxPct: 5.0, toleranceAbs: 0.3, isCritical: true },
    { element: 'Cu', minPct: 1.0, maxPct: 2.0, toleranceAbs: 0.2 },
    { element: 'Mn', minPct: 0, maxPct: 2.0, toleranceAbs: 0.2 },
    { element: 'Si', minPct: 0, maxPct: 1.0, toleranceAbs: 0.2 },
  ],
};

/** 316L profile (Rolex pre-904L and many replicas). */
const PROFILE_316L: ReferenceProfile = {
  id: 'ref-rolex-316l',
  materialId: 'rolex-316l-pre-904l',
  brandId: 'rolex',
  yearStart: 1950,
  yearEnd: 2003,
  source: 'public',
  notes: 'Standard AISI 316L composition. Used by Rolex before the progressive switch to 904L.',
  elements: [
    { element: 'Fe', minPct: 60, maxPct: 70, toleranceAbs: 1.0, isCritical: true },
    { element: 'Cr', minPct: 16, maxPct: 18, toleranceAbs: 0.5, isCritical: true },
    { element: 'Ni', minPct: 10, maxPct: 14, toleranceAbs: 0.5, isCritical: true },
    { element: 'Mo', minPct: 2.0, maxPct: 3.0, toleranceAbs: 0.3, isCritical: true },
    { element: 'Mn', minPct: 0, maxPct: 2.0, toleranceAbs: 0.2 },
    { element: 'Si', minPct: 0, maxPct: 1.0, toleranceAbs: 0.2 },
  ],
};

/** Rolex 18k yellow gold profile. */
const PROFILE_18K_YELLOW: ReferenceProfile = {
  id: 'ref-rolex-18k-yellow',
  materialId: 'rolex-18k-yellow-gold',
  brandId: 'rolex',
  yearStart: 1950,
  source: 'public',
  notes: '750‰ Au with Ag and Cu. Verify purity with XRF; Ag+Cu should complement to 25%.',
  elements: [
    { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
    { element: 'Ag', minPct: 9, maxPct: 16, toleranceAbs: 0.5 },
    { element: 'Cu', minPct: 9, maxPct: 16, toleranceAbs: 0.5 },
  ],
};

/** Rolex 18k white gold profile (nickel-free). */
const PROFILE_18K_WHITE: ReferenceProfile = {
  id: 'ref-rolex-18k-white',
  materialId: 'rolex-18k-white-gold',
  brandId: 'rolex',
  yearStart: 1950,
  source: 'public',
  notes:
    'Rolex uses palladium instead of nickel. Significant Ni presence is a strong signal of non-Rolex (or generic white gold from another brand).',
  elements: [
    { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
    { element: 'Pd', minPct: 12, maxPct: 20, toleranceAbs: 0.5, isCritical: true },
    { element: 'Cu', minPct: 3, maxPct: 10, toleranceAbs: 0.5 },
    { element: 'Ag', minPct: 0, maxPct: 4, toleranceAbs: 0.3 },
    { element: 'Ni', minPct: 0, maxPct: 0.2, toleranceAbs: 0.1, isCritical: true },
  ],
};

/** Rolex 18k Everose profile (patented, contains platinum). */
const PROFILE_EVEROSE: ReferenceProfile = {
  id: 'ref-rolex-everose',
  materialId: 'rolex-18k-everose-gold',
  brandId: 'rolex',
  yearStart: 2005,
  source: 'public',
  notes:
    'Alloy patented by Rolex. The small platinum content is distinctive: no Pt means it is not genuine Everose. Absence of Pt in a piece sold as Everose is a red flag.',
  elements: [
    { element: 'Au', minPct: 74.5, maxPct: 76.0, toleranceAbs: 0.3, isCritical: true },
    { element: 'Cu', minPct: 20, maxPct: 24, toleranceAbs: 0.5, isCritical: true },
    { element: 'Pt', minPct: 1.5, maxPct: 3.5, toleranceAbs: 0.3, isCritical: true },
    { element: 'Ag', minPct: 0, maxPct: 1.5, toleranceAbs: 0.2 },
  ],
};

/** Rolex 950 platinum profile. */
const PROFILE_950_PT: ReferenceProfile = {
  id: 'ref-rolex-950-pt',
  materialId: 'rolex-950-platinum',
  brandId: 'rolex',
  yearStart: 1950,
  source: 'public',
  notes: '950‰ platinum with 50‰ ruthenium.',
  elements: [
    { element: 'Pt', minPct: 94.5, maxPct: 95.5, toleranceAbs: 0.3, isCritical: true },
    { element: 'Ru', minPct: 4.5, maxPct: 5.5, toleranceAbs: 0.3, isCritical: true },
  ],
};

export const ROLEX_REFERENCE_PROFILES: readonly ReferenceProfile[] = [
  PROFILE_904L,
  PROFILE_316L,
  PROFILE_18K_YELLOW,
  PROFILE_18K_WHITE,
  PROFILE_EVEROSE,
  PROFILE_950_PT,
];
