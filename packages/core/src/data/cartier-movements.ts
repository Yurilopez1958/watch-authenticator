import type { Movement } from '../types/index';

/**
 * Key Cartier (Manufacture Cartier) calibers.
 *
 * The "MC" suffix stands for "Manufacture Cartier". Cartier produces its own
 * Cal. 1847 / 1904 family in-house since 2010–2015 and uses ETA-based bases
 * for thinner movements (430, 049). All references here are mechanical;
 * quartz Cartier references are out of scope.
 */
export const CARTIER_MOVEMENTS: readonly Movement[] = [
  // ============== IN-HOUSE SELF-WINDING ==============
  {
    id: 'cartier-cal-1847-mc',
    caliber: '1847 MC',
    yearStart: 2015,
    jewels: 23,
    powerReserveHours: 42,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'Manufacture Cartier self-winding workhorse. Powers the modern Santos de Cartier (Medium and Large), Drive de Cartier and Pasha 41 mm. Skeletonized rotor; antimagnetic shielding via nickel-phosphorus components.',
  },
  {
    id: 'cartier-cal-1904-mc',
    caliber: '1904 MC',
    yearStart: 2010,
    jewels: 27,
    powerReserveHours: 48,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'First fully in-house Cartier automatic, named after the year Louis Cartier built the Santos. Twin barrels, stop-second function. Powers Calibre de Cartier, Tank MC and earlier Drive.',
  },
  {
    id: 'cartier-cal-1904-ch-mc',
    caliber: '1904-CH MC',
    yearStart: 2013,
    jewels: 35,
    powerReserveHours: 48,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['chronograph', 'date', 'flyback'],
    notes: 'In-house integrated chronograph variant of 1904 MC with column wheel and vertical clutch. Powers Santos Chronograph and Pasha Chronograph.',
  },
  {
    id: 'cartier-cal-049-mc',
    caliber: '049 MC',
    yearStart: 2008,
    jewels: 21,
    powerReserveHours: 42,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['date'],
    notes: 'ETA 2892-A2 base finished by Cartier. Used in older Ballon Bleu Automatic, Tank Anglaise XL and Tank Solo automatic.',
  },

  // ============== HAND-WOUND ==============
  {
    id: 'cartier-cal-430-mc',
    caliber: '430 MC',
    yearStart: 1986,
    jewels: 18,
    powerReserveHours: 36,
    vph: 21600,
    escapement: 'lever',
    cosc: false,
    features: [],
    notes: 'Ultra-thin hand-wound based on the Frédéric Piguet 21 (later Piaget 9P-derived). 2.1 mm thick. Powers Santos-Dumont (small/large) and Tank Américaine smaller dress refs.',
  },
  {
    id: 'cartier-cal-8971-mc',
    caliber: '8971 MC',
    yearStart: 2013,
    jewels: 19,
    powerReserveHours: 38,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: [],
    notes: 'Hand-wound dedicated to the Tank Louis Cartier Large (W1529856 and gold variants). Finely-finished bridges visible through sapphire caseback on select refs.',
  },
  {
    id: 'cartier-cal-9908-mc',
    caliber: '9908 MC',
    yearStart: 2020,
    jewels: 22,
    powerReserveHours: 40,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['small-seconds'],
    notes: 'Hand-wound for Tank Asymétrique Privé and other Cartier Privé limited editions. Shaped movement with bridges that follow the case geometry.',
  },

  // ============== HAUTE HORLOGERIE ==============
  {
    id: 'cartier-cal-9611-mc',
    caliber: '9611 MC',
    yearStart: 2014,
    jewels: 22,
    powerReserveHours: 50,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['small-seconds'],
    notes: 'Skeleton flying tourbillon with hour bridge forming the Roman numerals. Powers Ballon Bleu Skeleton Flying Tourbillon and selected Santos-Dumont Skeleton refs.',
  },
  {
    id: 'cartier-cal-9780-mc',
    caliber: '9780 MC',
    yearStart: 2021,
    jewels: 21,
    powerReserveHours: 38,
    vph: 28800,
    escapement: 'lever',
    cosc: false,
    features: ['small-seconds'],
    notes: 'Shaped hand-wound for Cartier Privé limited editions (Tank Cintrée Privé). Movement bridges follow the elongated curved silhouette of the case.',
  },
];

/** Maps each Cartier model ID to its expected caliber. */
export const CARTIER_MODEL_TO_CALIBER: Readonly<Record<string, string>> = {
  // Santos de Cartier
  'cartier-santos-wssa0009':              '1847 MC',
  'cartier-santos-wssa0010':              '1847 MC',
  'cartier-santos-wssa0029':              '1847 MC',
  'cartier-santos-w2sa0006':              '1847 MC',
  'cartier-santos-wssa0017':              '1847 MC',
  'cartier-santos-chrono-w2sa0008':       '1904-CH MC',
  // Santos Dumont
  'cartier-santos-dumont-wgsa0021':       '430 MC',
  'cartier-santos-dumont-wgsa0029':       '430 MC',
  'cartier-santos-dumont-wssa0032':       '430 MC',
  'cartier-santos-dumont-wgsa0054':       '9611 MC',
  // Tank Louis Cartier
  'cartier-tank-lc-w1529856':             '8971 MC',
  'cartier-tank-lc-wgta0011':             '8971 MC',
  'cartier-tank-lc-w6700355':             '8971 MC',
  // Tank MC
  'cartier-tank-mc-w5330001':             '1904 MC',
  'cartier-tank-mc-w5330004':             '1904 MC',
  // Tank Américaine
  'cartier-tank-americaine-wgta0114':     '430 MC',
  'cartier-tank-americaine-wsta0017':     '1847 MC',
  // Tank Asymétrique Privé
  'cartier-tank-asymetrique-whta0006':    '9908 MC',
  // Pasha
  'cartier-pasha-wspa0009':               '1847 MC',
  'cartier-pasha-wspa0013':               '1847 MC',
  'cartier-pasha-chrono-wspa0018':        '1904-CH MC',
  // Ballon Bleu
  'cartier-ballon-bleu-w6920033':         '049 MC',
  'cartier-ballon-bleu-w6920046':         '049 MC',
  'cartier-ballon-bleu-skel-wjbb0049':    '9611 MC',
  // Calibre de Cartier
  'cartier-calibre-w7100015':             '1904 MC',
  'cartier-calibre-diver-wsca0006':       '1904 MC',
  // Drive
  'cartier-drive-wsnm0014':               '1847 MC',
  // Tank Française (XL automatic)
  'cartier-tank-francaise-wgta0123':      '1847 MC',
  'cartier-tank-francaise-wgta0129':      '1847 MC',
  // Tank Anglaise
  'cartier-tank-anglaise-w5310003':       '049 MC',
  // Tank Solo
  'cartier-tank-solo-w5200027':           '049 MC',
  // Tank Cintrée Privé
  'cartier-tank-cintree-prive-whta0012':  '9780 MC',
  // Clé de Cartier
  'cartier-cle-wscl0007':                 '1847 MC',
  'cartier-cle-wjcl0010':                 '1847 MC',
  // Ronde de Cartier
  'cartier-ronde-solo-w6701005':          '049 MC',
  'cartier-ronde-louis-w6800251':         '430 MC',
  // Baignoire Allongée
  'cartier-baignoire-allongee-wb520006':  '430 MC',
  // Coussin de Cartier
  'cartier-coussin-wcco0002':             '1847 MC',
  'cartier-coussin-wcco0007':             '1847 MC',
  // Panthère Mécanique
  'cartier-panthere-mecanique-wspn0005':  '049 MC',
};
