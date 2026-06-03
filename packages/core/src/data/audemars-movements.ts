import type { Movement } from '../types/index';

/**
 * Key Audemars Piguet calibers powering the references in this catalog.
 * Specs from AP official material, monochrome-watches and watchbase.
 */
export const AUDEMARS_MOVEMENTS: readonly Movement[] = [
  // ============== HISTORIC ULTRA-THIN ==============
  {
    id: 'ap-cal-2121',
    caliber: '2121',
    yearStart: 1972,
    yearEnd: 2022,
    jewels: 36,
    powerReserveHours: 40,
    vph: 19800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Historic ultra-thin AP/JLC-based caliber (derived from JLC 920). Just 3.05 mm thick. Powered the original Royal Oak "Jumbo" 5402 (1972) and the 15202 (2000–2022). Beats at 19800 vph (2.75 Hz), a giveaway vs the modern 7121.',
  },
  {
    id: 'ap-cal-2225',
    caliber: '2225',
    yearStart: 1992,
    yearEnd: 2005,
    jewels: 36,
    powerReserveHours: 40,
    vph: 21600,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'AP-modified Frédéric Piguet ultra-thin self-winding. Powered the historic Royal Oak 14790 (36 mm, 1992–2005) and the Royal Oak Day-Date 14802. 3 Hz beat.',
  },

  // ============== ROYAL OAK SELFWINDING (current line) ==============
  {
    id: 'ap-cal-3120',
    caliber: '3120',
    yearStart: 2002,
    yearEnd: 2019,
    jewels: 40,
    powerReserveHours: 60,
    vph: 21600,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Original in-house Royal Oak Selfwinding caliber. Beats at 3 Hz (21600 vph). 22K solid gold rotor. Powers Royal Oak 15400, 15450 and many earlier RO references. Replaced by the 4302 in 2019.',
  },
  {
    id: 'ap-cal-4302',
    caliber: '4302',
    yearStart: 2019,
    jewels: 32,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Modern AP Selfwinding caliber. 4 Hz beat, 70 h power reserve, larger balance wheel. Powers Royal Oak 15500/15510, Royal Oak 41mm Openworked, Royal Oak Frosted Gold 41 mm, and Code 11.59 Selfwinding 15210.',
  },
  {
    id: 'ap-cal-7121',
    caliber: '7121',
    yearStart: 2022,
    jewels: 27,
    powerReserveHours: 55,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Ultra-thin Selfwinding successor to the legendary 2121. Used in Royal Oak "Jumbo" Extra-Thin 16202. Same 39 mm case keeps the original profile thanks to a 3.2 mm movement height.',
  },
  {
    id: 'ap-cal-5800',
    caliber: '5800',
    yearStart: 2015,
    jewels: 36,
    powerReserveHours: 50,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Smaller-diameter Selfwinding for the 37 mm and 34 mm Royal Oak women references (15451, 15551 Frosted Gold). 4 Hz, 36 jewels.',
  },

  // ============== CHRONOGRAPHS ==============
  {
    id: 'ap-cal-2385',
    caliber: '2385',
    yearStart: 2002,
    yearEnd: 2021,
    jewels: 37,
    powerReserveHours: 40,
    vph: 21600,
    escapement: 'lever',
    cosc: false,
    features: ['chronograph', 'date'],
    notes: 'AP-finished Frédéric Piguet F. 1185 chronograph base (3 Hz, 40 h PR). Powered the older Royal Oak Chronograph 26300, 26315 and 26331 (2002–2021). Replaced by the in-house Cal. 4401.',
  },
  {
    id: 'ap-cal-4400',
    caliber: '4400',
    yearStart: 2019,
    jewels: 40,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['chronograph', 'date', 'flyback'],
    notes: 'AP\'s first in-house fully integrated chronograph with flyback. Column wheel + vertical clutch. 70 h PR. Used in Code 11.59 Chronograph 26393. Date at 3 o\'clock.',
  },
  {
    id: 'ap-cal-4401',
    caliber: '4401',
    yearStart: 2019,
    jewels: 40,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['chronograph', 'date', 'flyback'],
    notes: 'In-house flyback integrated chronograph derived from the 4400. Date at 4:30 alignment. Powers Royal Oak Chronograph 26240 and Royal Oak Offshore Chronograph 26420 (with cosmetic finish variants).',
  },

  // ============== PERPETUAL CALENDAR ==============
  {
    id: 'ap-cal-5134',
    caliber: '5134',
    yearStart: 2015,
    jewels: 38,
    powerReserveHours: 40,
    vph: 19800,
    escapement: 'lever',
    cosc: false,
    features: ['perpetual-calendar', 'moon-phase'],
    notes: 'Self-winding perpetual calendar with moon phase, week indicator and astronomical moon. Slim 4.31 mm thick. Powers Royal Oak Perpetual Calendar 26574 / 26579 / 26579CB.',
  },

  // ============== TOURBILLON ==============
  {
    id: 'ap-cal-2950',
    caliber: '2950',
    yearStart: 2022,
    jewels: 27,
    powerReserveHours: 65,
    vph: 21600,
    escapement: 'lever',
    cosc: false,
    features: ['small-seconds'],
    notes: 'Self-winding flying tourbillon, openworked construction. Found in Royal Oak Selfwinding Flying Tourbillon 26615 and openworked tourbillon references.',
  },
];

/** Maps each Audemars Piguet model ID to its expected caliber. */
export const AUDEMARS_MODEL_TO_CALIBER: Readonly<Record<string, string>> = {
  // Royal Oak Selfwinding 41mm
  'ap-royal-oak-15510st':          '4302',
  'ap-royal-oak-15510or':          '4302',
  'ap-royal-oak-15510ba':          '4302',
  'ap-royal-oak-15500st':          '4302',
  'ap-royal-oak-15400st':          '3120',
  'ap-royal-oak-15400or':          '3120',
  'ap-royal-oak-15407st':          '4302',

  // Royal Oak Jumbo 39mm
  'ap-royal-oak-16202st':          '7121',
  'ap-royal-oak-16202or':          '7121',
  'ap-royal-oak-16202ba':          '7121',
  'ap-royal-oak-15202st':          '2121',
  'ap-royal-oak-15202ba':          '2121',

  // Royal Oak Selfwinding 37mm
  'ap-royal-oak-15550st':          '4302',
  'ap-royal-oak-15450st':          '3120',
  'ap-royal-oak-15551st':          '5800',
  'ap-royal-oak-15551ba':          '5800',
  'ap-royal-oak-15551or':          '5800',

  // Royal Oak Chronograph 41mm
  'ap-royal-oak-26240st':          '4401',
  'ap-royal-oak-26240or':          '4401',
  'ap-royal-oak-26240bc':          '4401',
  'ap-royal-oak-26331st':          '2385',
  'ap-royal-oak-26331or':          '2385',

  // Royal Oak Perpetual Calendar
  'ap-royal-oak-26574st':          '5134',
  'ap-royal-oak-26579st':          '5134',
  'ap-royal-oak-26579cb':          '5134',

  // Royal Oak Flying Tourbillon
  'ap-royal-oak-26510st':          '2950',
  'ap-royal-oak-26615st':          '2950',

  // Royal Oak Frosted Gold Openworked
  'ap-royal-oak-15466ba':          '4302',

  // Royal Oak Offshore
  'ap-royal-oak-offshore-26420st': '4401',
  'ap-royal-oak-offshore-26420or': '4401',
  'ap-royal-oak-offshore-26420so': '4401',
  'ap-royal-oak-offshore-26420cb': '4401',
  'ap-royal-oak-offshore-15720st': '4302',

  // Code 11.59
  'ap-code-11-59-15210cr':         '4302',
  'ap-code-11-59-15210bc':         '4302',
  'ap-code-11-59-15211bc':         '4302',
  'ap-code-11-59-26393bc':         '4400',
  'ap-code-11-59-26393cr':         '4400',

  // Historical Royal Oak
  'ap-royal-oak-14790st':          '2225',
  'ap-royal-oak-5402st':           '2121',
};
