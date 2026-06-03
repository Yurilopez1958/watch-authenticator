import type { AuthCheckpoint } from './rolex-auth-checkpoints';
import { ROLEX_AUTH_CHECKPOINTS } from './rolex-auth-checkpoints';

/**
 * Visual authentication checkpoints per brand. Textual guides built from
 * publicly documented authentication knowledge — pair with your own verified
 * reference photos. None of this guarantees authenticity; final calls require
 * physical inspection.
 */

const OMEGA_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'omega-logo',
    label: 'Omega logo & branding',
    points: [
      'The Ω symbol and "OMEGA" wordmark are crisply applied/printed; the Greek omega has even, symmetric legs.',
      'On Co-Axial models the dial reads "Co-Axial" / "Master Chronometer" with correct fonts and spacing for the era.',
      'No spelling slips or uneven kerning — a classic replica giveaway.',
    ],
  },
  {
    id: 'omega-caseback',
    label: 'Case back medallion',
    points: [
      'Seamaster: the Seahorse (Hippocampus) medallion is finely embossed with sharp relief and correct proportions.',
      'Speedmaster Moonwatch: case back engraving "FLIGHT-QUALIFIED BY NASA…" / "THE FIRST WATCH WORN ON THE MOON" is deep and evenly stamped.',
      'Sapphire-back models show beautifully finished movements (see movement check) — a cloudy or rough movement is a red flag.',
    ],
  },
  {
    id: 'omega-movement',
    label: 'Movement (Co-Axial / Master Chronometer)',
    points: [
      'Co-Axial escapement (three-level) and free-sprung balance on modern calibers — visibly different from a standard Swiss lever.',
      'Arabesque Côtes de Genève in a distinctive radial/wave pattern; rhodium- or Sedna-gold-plated bridges.',
      'Master Chronometer movements are anti-magnetic to 15,000 gauss (METAS) — a higher bar than COSC; the rotor and bridges are cleanly engraved.',
      'Caliber number should match the reference (e.g. 3861 Moonwatch, 8800/8900 time-date, 9300/9900 chronograph).',
    ],
  },
  {
    id: 'omega-bracelet',
    label: 'Bracelet, clasp & helium valve',
    points: [
      'Clasp engraved with the Ω logo; ratchet/extension systems operate smoothly with no play.',
      'Seamaster Diver 300M: the helium escape valve at 10 o\'clock screws/operates correctly.',
      'Solid end-links and links; the watch has a substantial, quality heft.',
    ],
  },
  {
    id: 'omega-bezel-dial',
    label: 'Bezel & dial detail',
    points: [
      'Ceramic/aluminium bezels: numerals and indices are sharp; on the Diver 300M the wave-pattern dial is laser-engraved with fine, even lines.',
      'Applied indices have even lume; the date wheel (where present) aligns centrally in the window.',
      'Lollipop/broad-arrow hands match the model and have lume consistent with the markers.',
    ],
  },
];

const PATEK_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'patek-seal',
    label: 'Patek Philippe Seal & finishing',
    points: [
      'Since 2009 every movement carries the Patek Philippe Seal (replacing the Geneva Seal) — an exacting in-house standard.',
      'Hand-finished movement: anglage (bevelled, polished bridge edges), Côtes de Genève, gold-filled engravings, polished countersinks. Industrial/flat finishing is a strong fake signal.',
      'On sapphire-back models inspect for the signed rotor (21K/22K gold) and the caliber number.',
    ],
  },
  {
    id: 'patek-dial-logo',
    label: 'Dial, logo & printing',
    points: [
      'The Calatrava cross logo is finely applied/printed with crisp, symmetric arms.',
      'Applied markers and "PATEK PHILIPPE GENEVE" text are razor-sharp; baton/Breguet numerals correct for the model.',
      'Guilloché and enamel dials (where fitted) show flawless, even patterns — replicas blur the fine work.',
    ],
  },
  {
    id: 'patek-case-hallmarks',
    label: 'Case, hallmarks & engraving',
    points: [
      'Case-side and lugs show crisp hallmarks (gold purity, assay marks) and the reference/movement numbers deeply, cleanly engraved.',
      'Geneva hallmark / Sigma marks on older dials where applicable.',
      'Sharp polished/satined surfaces; on the Nautilus the "ears" and porthole bezel are perfectly symmetric with crisp brushing.',
    ],
  },
  {
    id: 'patek-nautilus-aquanaut',
    label: 'Nautilus / Aquanaut specifics',
    points: [
      'Horizontally-embossed (gradient) dial with fine, even relief lines; the texture is precise, never shallow or muddy.',
      'Integrated bracelet links are solid with perfectly aligned brushing/polishing transitions.',
      'Caliber matches (e.g. 26-330 S C in 5711/5167; 240 PS IRM C LU in 5712).',
    ],
  },
  {
    id: 'patek-bracelet-strap',
    label: 'Bracelet / strap & buckle',
    points: [
      'Fold-over clasp engraved with the Calatrava cross; precise action and solid feel.',
      'Aquanaut "Tropical" composite strap has a crisp embossed pattern matching the dial.',
      'Overall substantial weight for precious-metal references.',
    ],
  },
];

const AP_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'ap-tapisserie',
    label: 'Tapisserie dial',
    points: [
      'The "Grande/Petite Tapisserie" guilloché is razor-sharp with perfectly square, even pyramids — the single hardest thing for fakes to replicate.',
      'Applied white-gold hour markers and AP logo are crisp with even lume.',
      'Correct dial text and "AP" monogram alignment for the model/era.',
    ],
  },
  {
    id: 'ap-octagonal-bezel',
    label: 'Octagonal bezel & screws',
    points: [
      'The eight hexagonal screws on the bezel are perfectly aligned (all slots facing the same way) and finely finished.',
      'The bezel octagon edges are crisply chamfered; brushed top with polished bevels.',
    ],
  },
  {
    id: 'ap-movement',
    label: 'Movement finishing',
    points: [
      'High-grade finishing: Côtes de Genève, perlage, polished bevels and a 22K/21K gold signed rotor (e.g. Cal. 4302/3120/7121/2121).',
      'Caliber must match the reference (2121 in vintage 15202; 7121 in 16202; 4302 in 15500/15510).',
      'The 2121-family movements are ultra-thin — a thick movement in a "Jumbo" is wrong.',
    ],
  },
  {
    id: 'ap-bracelet',
    label: 'Integrated bracelet & clasp',
    points: [
      'Tapered links with flawless brushed/polished transitions; the bracelet flows seamlessly from the case.',
      'AP-signed folding clasp with precise action; solid, heavy links.',
      'Case-back and clasp engravings (reference, AP, hallmarks) are deep and clean.',
    ],
  },
];

const CARTIER_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'cartier-secret-signature',
    label: 'Secret signature & dial',
    points: [
      'Cartier hides "Cartier" within a Roman numeral (often the "X" at 10 or "VII" at 7) — a micro-printed secret signature; check under a loupe.',
      'Roman-numeral dial: numerals are precisely printed, the railway minute track is crisp, and the blued-steel sword hands are evenly tempered.',
      'On Santos/Tank, the "Cartier" wordmark and printing are sharp with correct fonts.',
    ],
  },
  {
    id: 'cartier-cabochon-crown',
    label: 'Crown & cabochon',
    points: [
      'The winding crown holds a faceted blue sapphire/spinel cabochon (synthetic on steel models) — well-set, even, and clear.',
      'Crown action is smooth; the cabochon is centred with no glue residue.',
    ],
  },
  {
    id: 'cartier-case-screws',
    label: 'Case, screws & finishing',
    points: [
      'Santos: the eight exposed screws on the bezel and bracelet are real, aligned and finely finished (not cast/decorative).',
      'Crisp brushed/polished surfaces; on the Tank the brancards (case sides) are clean and symmetric.',
      'Case-back and lug engravings (reference, serial, "Swiss Made") are deep and even.',
    ],
  },
  {
    id: 'cartier-movement',
    label: 'Movement (mechanical refs)',
    points: [
      'Manufacture Cartier "MC" calibers (1847 MC, 1904 MC, 430 MC, etc.) — finishing with Côtes de Genève and a signed rotor on automatics.',
      'Caliber should match the reference and be mechanical where claimed (a quartz movement in a watch sold as automatic is an obvious tell).',
    ],
  },
  {
    id: 'cartier-bracelet',
    label: 'Bracelet & SmartLink / clasp',
    points: [
      'Santos QuickSwitch strap-change and SmartLink adjustment operate cleanly; links are solid.',
      'Deployant/folding clasp is Cartier-signed with precise action and good heft.',
    ],
  },
];

/** Returns the visual authentication checkpoints for a brand id. */
export function getBrandCheckpoints(brandId: string): readonly AuthCheckpoint[] {
  switch (brandId) {
    case 'rolex': return ROLEX_AUTH_CHECKPOINTS;
    case 'omega': return OMEGA_CHECKPOINTS;
    case 'patek-philippe': return PATEK_CHECKPOINTS;
    case 'audemars-piguet': return AP_CHECKPOINTS;
    case 'cartier': return CARTIER_CHECKPOINTS;
    default: return [];
  }
}

export const BRAND_CHECKPOINTS = {
  omega: OMEGA_CHECKPOINTS,
  'patek-philippe': PATEK_CHECKPOINTS,
  'audemars-piguet': AP_CHECKPOINTS,
  cartier: CARTIER_CHECKPOINTS,
} as const;
