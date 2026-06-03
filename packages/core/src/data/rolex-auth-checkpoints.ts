/**
 * Visual authentication checkpoints for Rolex — what to look for when comparing
 * a watch under examination against a known-authentic reference.
 *
 * Built from publicly documented authentication knowledge (Rolex technical
 * literature, watchmaking references, auction-house condition reports). These
 * are textual guides, NOT photos — pair them with your own verified reference
 * images. None of this guarantees authenticity on its own; final calls require
 * physical inspection in hand.
 */

export type AuthCheckpoint = {
  id: string;
  /** Human label of the part / area being checked. */
  label: string;
  /** Concrete things to verify on a genuine piece. */
  points: readonly string[];
};

/** Brand-wide checkpoints that apply to (almost) every modern Rolex. */
export const ROLEX_AUTH_CHECKPOINTS: readonly AuthCheckpoint[] = [
  {
    id: 'crown-logo',
    label: 'Coronet (crown logo)',
    points: [
      'Five points perfectly symmetric and evenly spaced; the two outer points curve outward gently.',
      'On the dial, the applied coronet sits dead-centre under 12 with crisp, polished edges.',
      'On the winding crown, the coronet is sharply stamped — replicas often show a shallow, mushy, or lopsided crown.',
    ],
  },
  {
    id: 'cyclops',
    label: 'Cyclops date lens',
    points: [
      'Magnifies the date ~2.5×, filling the bubble. Replicas frequently magnify only ~1.5× and leave the date looking small.',
      'The date is centred under the lens, not shifted left/right.',
      'Anti-reflective coating (on modern refs) makes the lens look almost invisible straight-on.',
    ],
  },
  {
    id: 'dial-printing',
    label: 'Dial printing & text',
    points: [
      'All printing razor-sharp under loupe — no fuzzy edges, no ink bleed, perfectly even letter spacing.',
      '"SWISS MADE" at 6 o\'clock is finely printed; the small coronet between SWISS and MADE (post-2002) is crisp.',
      'Applied hour markers are solid metal with even lume; gaps between marker and lume are uniform.',
      'Correct font and depth-of-text for the model/era (e.g. older gilt dials vs modern matte).',
    ],
  },
  {
    id: 'hands',
    label: 'Hands',
    points: [
      'Correct hand style for the model (Mercedes on tool watches, baton on dress models).',
      'Lume on the hands matches the markers in colour and ageing — a mismatch suggests a service or a fake.',
      'Edges cleanly polished; the seconds hand sweeps smoothly and sits centred without wobble.',
    ],
  },
  {
    id: 'rehaut',
    label: 'Rehaut (inner bezel ring)',
    points: [
      'Since ~2005, the rehaut is laser-engraved "ROLEXROLEXROLEX…" repeated around the ring.',
      'The serial number is engraved on the rehaut at 6 o\'clock and must match the serial between the lugs / on the warranty card.',
      'Engraving is even, sharp and perfectly aligned with the dial markers — crooked or shallow text is a red flag.',
    ],
  },
  {
    id: 'case-back',
    label: 'Case back',
    points: [
      'Almost all Rolex case backs are plain, smooth and screwed down — NO display/exhibition glass (Rolex does not use see-through backs on standard production).',
      'No external engravings on genuine pieces (engraved backs are usually after-market or fake), except specific models like some Sea-Dwellers with model text.',
      'Fine, even machining of the fluting on the edge that the case-opening tool grips.',
    ],
  },
  {
    id: 'serial-engraving',
    label: 'Serial & model number',
    points: [
      'Older refs: serial between the lugs at 6, model number between the lugs at 12 — deeply and cleanly diamond-cut, slightly sparkly.',
      'Modern refs: serial on the rehaut. Numbers should be sharp with a faceted, light-catching cut, never sandblasted/etched-looking.',
      'Cross-check the serial against the production years of the reference — an out-of-range serial is a strong warning.',
    ],
  },
  {
    id: 'bracelet-clasp',
    label: 'Bracelet & clasp',
    points: [
      'Solid, hefty links — genuine Rolex bracelets feel dense; hollow or light links are a giveaway.',
      'Clasp stamped with the coronet plus the clasp code and metal stamp; the Glidelock / Easylink extension (where fitted) operates smoothly.',
      'Reference and clasp codes engraved cleanly inside the clasp and consistent with the model.',
    ],
  },
  {
    id: 'weight-feel',
    label: 'Overall weight & finishing',
    points: [
      'Rolex uses dense alloys (904L steel, 18k gold, Pt950) — the watch should feel substantially heavy for its size.',
      'Brushed and polished surfaces meet at perfectly crisp edges; no rounded or hazy transitions.',
      'Bezel action (where rotating) is firm with precise clicks; screw-down crown threads engage smoothly.',
    ],
  },
];

/**
 * Movement-specific authentication points keyed by caliber number. These
 * supplement the per-caliber `notes` already on each Movement record.
 */
export const ROLEX_MOVEMENT_CHECKPOINTS: Readonly<Record<string, readonly string[]>> = {
  // Modern Chronergy family
  '3230': [
    'Chronergy escapement (skeletonised, asymmetric pallet fork) in nickel-phosphorus.',
    'Blue Parachrom hairspring with Rolex overcoil; Paraflex shock absorbers on the balance.',
    'Côtes de Genève on the bridges; perlage on the baseplate; engraved Rolex rotor.',
  ],
  '3235': [
    'Chronergy escapement; +70 h power reserve from a redesigned barrel.',
    'Blue Parachrom hairspring, freesprung Microstella balance, Paraflex shock protection.',
    'High-precision finishing: Côtes de Genève bridges, perlage baseplate.',
  ],
  '3255': [
    'Same Chronergy platform as 3235 with the day/date module of the Day-Date.',
    'Instantaneous day and date jump at midnight.',
  ],
  '3285': [
    'Chronergy GMT movement with independently-set 24-hour hand and local-hour jump.',
    'Blue Parachrom hairspring; 70 h reserve.',
  ],
  // Classic 3135 family
  '3135': [
    'Workhorse 4 Hz date movement (1988–2020). Full balance bridge (two-point support) — a key tell vs cheaper clones that use a balance cock.',
    'Microstella regulating nuts on the balance; Breguet/Parachrom hairspring depending on era.',
    'Côtes de Genève, perlage, and a heavy engraved rotor.',
  ],
  '3130': ['Time-only sibling of the 3135 (no date) — same full balance bridge and Microstella balance.'],
  '3186': ['GMT-Master II caliber with Parachrom hairspring; independent 24-hour hand.'],
  // Chronographs
  '4130': [
    'In-house Daytona chronograph: vertical clutch + column wheel, far fewer parts than a modular chrono.',
    'Microstella balance with full bridge; no running-seconds at 6 (the small seconds sits where expected for the layout).',
  ],
  '4131': ['Successor to 4130 with Chronergy escapement; openworked bridge layout on sapphire-back gold/Pt refs.'],
  // Vintage
  '1570': ['Vintage 19,800 vph date caliber (1965–88). Hacking seconds from ~1972. Côtes de Genève bridges, gilt finishing on early examples.'],
  '1520': ['Vintage time-only 19,800 vph, non-chronometer sibling of the 1530. Simple, robust finishing.'],
  '3035': ['First 28,800 vph quickset-date caliber (1977–88). Bridge-style balance support.'],
  '3085': ['First GMT-Master II movement with truly independent 24-hour hand ("Fat Lady" 16760).'],
  '4030': ['The "Zenith" Daytona movement — modified El Primero base run at 28,800 vph; ~50% Rolex-made parts, Rolex finishing and Microstella balance.'],
  '727': ['Hand-wound Valjoux 72 base — no rotor. Column-wheel chronograph; the manual winding itself is a primary authenticity check for 6263/6265.'],
};

/** Returns the movement-specific checkpoints for a caliber, if any. */
export function getMovementCheckpoints(caliber: string): readonly string[] {
  const key = caliber.replace(/^cal\.?\s*/i, '').trim();
  return ROLEX_MOVEMENT_CHECKPOINTS[key] ?? [];
}
