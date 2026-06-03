import type { Movement } from '../types/index';

/**
 * Reference data for the Rolex calibers used by the models in this catalog.
 * Specs come from publicly documented sources (Rolex official material,
 * monochrome-watches, bobswatches, watchbase). Hardcoded because the data is
 * small, stable, and changes only when Rolex releases a new movement.
 */
export const ROLEX_MOVEMENTS: readonly Movement[] = [
  // === Time-only / Chronergy ===
  {
    id: 'rolex-cal-3230',
    caliber: '3230',
    yearStart: 2020,
    jewels: 31,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: [],
    notes: 'Time-only Chronergy movement. Used in Submariner no-date 124060, Oyster Perpetual 36/41, Explorer 36/40, and Air-King 126900.',
  },

  // === Date movements ===
  {
    id: 'rolex-cal-3135',
    caliber: '3135',
    yearStart: 1988,
    yearEnd: 2020,
    jewels: 31,
    powerReserveHours: 48,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['date'],
    notes: 'Long-running workhorse of Submariner Date, Sea-Dweller, Datejust and many other models. Replaced progressively by the 3235.',
  },
  {
    id: 'rolex-cal-3235',
    caliber: '3235',
    yearStart: 2015,
    jewels: 31,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: ['date'],
    notes: 'Chronergy escapement (asymmetric pallet fork), Syloxi hairspring, +90% efficiency over 3135. Found in Submariner Date 126610, Sea-Dweller 126600, Deepsea 126660/136660, Datejust 41 126334.',
  },
  {
    id: 'rolex-cal-2236',
    caliber: '2236',
    yearStart: 2014,
    jewels: 31,
    powerReserveHours: 55,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['date'],
    notes: 'Small-size movement with Syloxi (silicon) hairspring. Used in Lady-Datejust 28 (279xxx), Pearlmaster 34, Yacht-Master 37 (268xxx) and Datejust 31 (some refs).',
  },

  // === Day-Date movements ===
  {
    id: 'rolex-cal-3255',
    caliber: '3255',
    yearStart: 2015,
    jewels: 31,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: ['day', 'date'],
    notes: 'Same Chronergy platform as 3235 with day + date module. Found in Day-Date 40 (228xxx) and Day-Date 36 (128xxx).',
  },

  // === GMT movements ===
  {
    id: 'rolex-cal-3186',
    caliber: '3186',
    yearStart: 2007,
    yearEnd: 2018,
    jewels: 31,
    powerReserveHours: 48,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['gmt', 'date'],
    notes: 'Predecessor to 3285. Used in GMT-Master II 116710LN/116710BLNR. Parachrom hairspring, Paraflex shock absorbers.',
  },
  {
    id: 'rolex-cal-3187',
    caliber: '3187',
    yearStart: 2011,
    yearEnd: 2021,
    jewels: 31,
    powerReserveHours: 48,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['gmt', 'date'],
    notes: 'Predecessor to 3285 in Explorer II 216570. Same platform as 3186.',
  },
  {
    id: 'rolex-cal-3285',
    caliber: '3285',
    yearStart: 2018,
    jewels: 31,
    powerReserveHours: 70,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: ['gmt', 'date'],
    notes: 'Chronergy with GMT 24-hour hand module. Found in GMT-Master II 126710 and Explorer II 226570.',
  },

  // === Chronograph ===
  {
    id: 'rolex-cal-4130',
    caliber: '4130',
    yearStart: 2000,
    yearEnd: 2023,
    jewels: 44,
    powerReserveHours: 72,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['chronograph'],
    notes: 'Self-winding chronograph with vertical clutch and column wheel. In-house Daytona movement 2000–2023. Distinctive Microstella regulating system.',
  },
  {
    id: 'rolex-cal-4131',
    caliber: '4131',
    yearStart: 2023,
    jewels: 44,
    powerReserveHours: 72,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: ['chronograph'],
    notes: 'Successor to the 4130 introduced with the 126500LN. Adds Chronergy escapement and openworked bridge layout visible through the sapphire case-back (only on platinum and gold ref. 126506).',
  },

  // === Sky-Dweller annual calendar ===
  {
    id: 'rolex-cal-9002',
    caliber: '9002',
    yearStart: 2017,
    jewels: 40,
    powerReserveHours: 72,
    vph: 28800,
    escapement: 'lever',
    cosc: true,
    features: ['date', 'gmt'],
    notes: 'Annual calendar with second time zone (Saros system). Found in Sky-Dweller 336xxx series. The 12 month indicators around the dial differentiate it instantly from a regular GMT.',
  },

  // === Perpetual 1908 ===
  {
    id: 'rolex-cal-7140',
    caliber: '7140',
    yearStart: 2023,
    jewels: 31,
    powerReserveHours: 66,
    vph: 28800,
    escapement: 'chronergy',
    cosc: true,
    features: ['date'],
    notes: 'High-end refined Chronergy movement introduced with the Perpetual 1908 (2023). Visible through the open case-back with a thin openworked oscillating weight on a ball-bearing rim.',
  },
];

/** Maps each model ID in the Rolex catalog to its expected caliber. */
export const ROLEX_MODEL_TO_CALIBER: Readonly<Record<string, string>> = {
  // Submariner
  'rolex-submariner-124060':         '3230',
  'rolex-submariner-date-126610ln':  '3235',
  'rolex-submariner-date-126610lv':  '3235',
  'rolex-submariner-date-116610ln':  '3135',
  'rolex-submariner-date-126618ln':  '3235',
  'rolex-submariner-date-126613lb':  '3235',
  // GMT-Master II
  'rolex-gmt-master-ii-126710blro':  '3285',
  'rolex-gmt-master-ii-126710blnr':  '3285',
  'rolex-gmt-master-ii-126711chnr':  '3285',
  'rolex-gmt-master-ii-126720vtnr':  '3285',
  'rolex-gmt-master-ii-116710ln':    '3186',
  // Sea-Dweller / Deepsea
  'rolex-sea-dweller-126600':        '3235',
  'rolex-deepsea-126660':            '3235',
  'rolex-deepsea-136660':            '3235',
  // Daytona
  'rolex-daytona-116500ln':          '4130',
  'rolex-daytona-126500ln':          '4131',
  'rolex-daytona-126506':            '4131',
  'rolex-daytona-126508':            '4131',
  'rolex-daytona-126515ln':          '4131',
  // Explorer
  'rolex-explorer-124270':           '3230',
  'rolex-explorer-224270':           '3230',
  'rolex-explorer-ii-226570':        '3285',
  'rolex-explorer-ii-216570':        '3187',
  // Yacht-Master
  'rolex-yacht-master-126622':       '3235',
  'rolex-yacht-master-126655':       '3235',
  'rolex-yacht-master-226627':       '3235',
  'rolex-yacht-master-37-268621':    '2236',
  'rolex-yacht-master-37-268622':    '2236',
  // Air-King / Sky-Dweller
  'rolex-air-king-126900':           '3230',
  'rolex-sky-dweller-336934':        '9002',
  'rolex-sky-dweller-336935':        '9002',
  // Datejust 41 / 36
  'rolex-datejust-41-126300':        '3235',
  'rolex-datejust-41-126334':        '3235',
  'rolex-datejust-36-126200':        '3235',
  'rolex-datejust-36-126234':        '3235',
  'rolex-datejust-36-126284rbr':     '3235',
  // Day-Date 40 / 36
  'rolex-day-date-40-228206':        '3255',
  'rolex-day-date-40-228235':        '3255',
  'rolex-day-date-40-228238':        '3255',
  'rolex-day-date-36-128235':        '3255',
  'rolex-day-date-36-128238':        '3255',
  // Lady-Datejust 28 / Datejust 31
  'rolex-lady-datejust-28-279160':   '2236',
  'rolex-lady-datejust-28-279163':   '2236',
  'rolex-lady-datejust-28-279174':   '2236',
  'rolex-datejust-31-278240':        '2236',
  'rolex-datejust-31-278274':        '2236',
  'rolex-datejust-31-278285rbr':     '2236',
  // Pearlmaster
  'rolex-pearlmaster-34-81348':      '2236',
  'rolex-pearlmaster-39-86409rbr':   '3235',
  // Oyster Perpetual
  'rolex-op-28-276200':              '2236',
  'rolex-op-31-277200':              '2236',
  'rolex-op-34-124200':              '3230',
  'rolex-op-36-126000':              '3230',
  'rolex-op-41-124300':              '3230',
  // Perpetual 1908
  'rolex-perpetual-1908-52508':      '7140',
  'rolex-perpetual-1908-52509':      '7140',
};

/** Returns the Movement entry for a given Rolex model id, or undefined if unknown. */
export function getMovementForModel(modelId: string): Movement | undefined {
  const caliber = ROLEX_MODEL_TO_CALIBER[modelId];
  if (!caliber) return undefined;
  return ROLEX_MOVEMENTS.find((m) => m.caliber === caliber);
}
