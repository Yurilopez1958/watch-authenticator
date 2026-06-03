import type { Brand, Model } from '../types/index';

export const AUDEMARS_BRAND: Brand = {
  id: 'audemars-piguet',
  name: 'Audemars Piguet',
  country: 'Switzerland',
  foundedYear: 1875,
};

/**
 * Comprehensive Audemars Piguet catalog covering Royal Oak Selfwinding (41/39/37mm),
 * Royal Oak "Jumbo" Extra-Thin, Royal Oak Chronograph, Royal Oak Perpetual Calendar,
 * Royal Oak Flying Tourbillon, Royal Oak Offshore, Code 11.59 and historical refs.
 */
export const AUDEMARS_MODELS: readonly Model[] = [
  // ============== ROYAL OAK SELFWINDING 41mm ==============
  { id: 'ap-royal-oak-15510st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15510ST (steel)',           reference: '15510ST',  yearStart: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15510or',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15510OR (rose gold)',       reference: '15510OR',  yearStart: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15510ba',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15510BA (yellow gold)',     reference: '15510BA',  yearStart: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15500st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15500ST',                   reference: '15500ST',  yearStart: 2019, yearEnd: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15400st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15400ST',                   reference: '15400ST',  yearStart: 2012, yearEnd: 2019, caliber: 'Cal. 3120', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15400or',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Selfwinding 15400OR (rose gold)',       reference: '15400OR',  yearStart: 2012, yearEnd: 2019, caliber: 'Cal. 3120', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-15407st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'men',     name: 'Royal Oak Openworked 15407ST (steel)',            reference: '15407ST',  yearStart: 2021, caliber: 'Cal. 4302', caseDiameterMm: 41 },

  // ============== ROYAL OAK "JUMBO" 39mm ==============
  { id: 'ap-royal-oak-16202st',          brandId: 'audemars-piguet', collection: 'Royal Oak Jumbo',               audience: 'unisex',  name: 'Royal Oak "Jumbo" Extra-Thin 16202ST',            reference: '16202ST',  yearStart: 2022, caliber: 'Cal. 7121', caseDiameterMm: 39 },
  { id: 'ap-royal-oak-16202or',          brandId: 'audemars-piguet', collection: 'Royal Oak Jumbo',               audience: 'unisex',  name: 'Royal Oak "Jumbo" Extra-Thin 16202OR (rose)',     reference: '16202OR',  yearStart: 2022, caliber: 'Cal. 7121', caseDiameterMm: 39 },
  { id: 'ap-royal-oak-16202ba',          brandId: 'audemars-piguet', collection: 'Royal Oak Jumbo',               audience: 'unisex',  name: 'Royal Oak "Jumbo" Extra-Thin 16202BA (yellow)',   reference: '16202BA',  yearStart: 2022, caliber: 'Cal. 7121', caseDiameterMm: 39 },
  { id: 'ap-royal-oak-15202st',          brandId: 'audemars-piguet', collection: 'Royal Oak Jumbo',               audience: 'unisex',  name: 'Royal Oak "Jumbo" Extra-Thin 15202ST',            reference: '15202ST',  yearStart: 2000, yearEnd: 2022, caliber: 'Cal. 2121', caseDiameterMm: 39 },
  { id: 'ap-royal-oak-15202ba',          brandId: 'audemars-piguet', collection: 'Royal Oak Jumbo',               audience: 'unisex',  name: 'Royal Oak "Jumbo" Extra-Thin 15202BA (yellow)',   reference: '15202BA',  yearStart: 2000, yearEnd: 2022, caliber: 'Cal. 2121', caseDiameterMm: 39 },

  // ============== ROYAL OAK SELFWINDING 37mm ==============
  { id: 'ap-royal-oak-15550st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'unisex',  name: 'Royal Oak Selfwinding 15550ST (37mm)',            reference: '15550ST',  yearStart: 2021, caliber: 'Cal. 4302', caseDiameterMm: 37 },
  { id: 'ap-royal-oak-15450st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'unisex',  name: 'Royal Oak Selfwinding 15450ST (37mm, older)',     reference: '15450ST',  yearStart: 2013, yearEnd: 2021, caliber: 'Cal. 3120', caseDiameterMm: 37 },
  { id: 'ap-royal-oak-15551st',          brandId: 'audemars-piguet', collection: 'Royal Oak',                     audience: 'women',   name: 'Royal Oak 15551ST (37mm, women, diamonds)',       reference: '15551ST',  yearStart: 2017, caliber: 'Cal. 5800', caseDiameterMm: 37 },
  { id: 'ap-royal-oak-15551ba',          brandId: 'audemars-piguet', collection: 'Royal Oak Frosted Gold',         audience: 'women',   name: 'Royal Oak Frosted Gold 15551BA (yellow gold)',    reference: '15551BA',  yearStart: 2017, caliber: 'Cal. 5800', caseDiameterMm: 37 },
  { id: 'ap-royal-oak-15551or',          brandId: 'audemars-piguet', collection: 'Royal Oak Frosted Gold',         audience: 'women',   name: 'Royal Oak Frosted Gold 15551OR (rose gold)',      reference: '15551OR',  yearStart: 2017, caliber: 'Cal. 5800', caseDiameterMm: 37 },

  // ============== ROYAL OAK CHRONOGRAPH 41mm ==============
  { id: 'ap-royal-oak-26240st',          brandId: 'audemars-piguet', collection: 'Royal Oak Chronograph',          audience: 'men',     name: 'Royal Oak Chronograph 26240ST (steel, integrated)',reference: '26240ST',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26240or',          brandId: 'audemars-piguet', collection: 'Royal Oak Chronograph',          audience: 'men',     name: 'Royal Oak Chronograph 26240OR (rose gold)',       reference: '26240OR',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26240bc',          brandId: 'audemars-piguet', collection: 'Royal Oak Chronograph',          audience: 'men',     name: 'Royal Oak Chronograph 26240BC (white gold)',      reference: '26240BC',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26331st',          brandId: 'audemars-piguet', collection: 'Royal Oak Chronograph',          audience: 'men',     name: 'Royal Oak Chronograph 26331ST (older, modular)',  reference: '26331ST',  yearStart: 2017, yearEnd: 2021, caliber: 'Cal. 2385', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26331or',          brandId: 'audemars-piguet', collection: 'Royal Oak Chronograph',          audience: 'men',     name: 'Royal Oak Chronograph 26331OR (rose gold, older)',reference: '26331OR',  yearStart: 2017, yearEnd: 2021, caliber: 'Cal. 2385', caseDiameterMm: 41 },

  // ============== ROYAL OAK PERPETUAL CALENDAR ==============
  { id: 'ap-royal-oak-26574st',          brandId: 'audemars-piguet', collection: 'Royal Oak Perpetual Calendar',   audience: 'men',     name: 'Royal Oak Perpetual Calendar 26574ST (steel)',    reference: '26574ST',  yearStart: 2015, caliber: 'Cal. 5134', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26579st',          brandId: 'audemars-piguet', collection: 'Royal Oak Perpetual Calendar',   audience: 'men',     name: 'Royal Oak Perpetual Calendar 26579ST (openworked)',reference: '26579ST',  yearStart: 2019, caliber: 'Cal. 5134', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26579cb',          brandId: 'audemars-piguet', collection: 'Royal Oak Perpetual Calendar',   audience: 'men',     name: 'Royal Oak Perpetual Calendar 26579CB (black ceramic)', reference: '26579CB', yearStart: 2017, caliber: 'Cal. 5134', caseDiameterMm: 41 },

  // ============== ROYAL OAK FLYING TOURBILLON ==============
  { id: 'ap-royal-oak-26510st',          brandId: 'audemars-piguet', collection: 'Royal Oak Tourbillon',           audience: 'men',     name: 'Royal Oak Tourbillon Openworked 26510ST',         reference: '26510ST',  yearStart: 2019, caliber: 'Cal. 2950', caseDiameterMm: 41 },
  { id: 'ap-royal-oak-26615st',          brandId: 'audemars-piguet', collection: 'Royal Oak Tourbillon',           audience: 'men',     name: 'Royal Oak Selfwinding Flying Tourbillon 26615ST', reference: '26615ST',  yearStart: 2022, caliber: 'Cal. 2950', caseDiameterMm: 41 },

  // ============== ROYAL OAK FROSTED GOLD OPENWORKED ==============
  { id: 'ap-royal-oak-15466ba',          brandId: 'audemars-piguet', collection: 'Royal Oak Frosted Gold',         audience: 'unisex',  name: 'Royal Oak Frosted Gold Openworked 15466BA',       reference: '15466BA',  yearStart: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },

  // ============== ROYAL OAK OFFSHORE CHRONOGRAPH ==============
  { id: 'ap-royal-oak-offshore-26420st', brandId: 'audemars-piguet', collection: 'Royal Oak Offshore',             audience: 'men',     name: 'Royal Oak Offshore Chronograph 26420ST (steel)',  reference: '26420ST',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 43 },
  { id: 'ap-royal-oak-offshore-26420or', brandId: 'audemars-piguet', collection: 'Royal Oak Offshore',             audience: 'men',     name: 'Royal Oak Offshore Chronograph 26420OR (rose)',   reference: '26420OR',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 43 },
  { id: 'ap-royal-oak-offshore-26420so', brandId: 'audemars-piguet', collection: 'Royal Oak Offshore',             audience: 'men',     name: 'Royal Oak Offshore Chronograph 26420SO (steel+rubber)', reference: '26420SO', yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 43 },
  { id: 'ap-royal-oak-offshore-26420cb', brandId: 'audemars-piguet', collection: 'Royal Oak Offshore',             audience: 'men',     name: 'Royal Oak Offshore Chronograph 26420CB (ceramic)',reference: '26420CB',  yearStart: 2021, caliber: 'Cal. 4401', caseDiameterMm: 43 },
  { id: 'ap-royal-oak-offshore-15720st', brandId: 'audemars-piguet', collection: 'Royal Oak Offshore Diver',       audience: 'men',     name: 'Royal Oak Offshore Diver 15720ST (steel)',        reference: '15720ST',  yearStart: 2021, caliber: 'Cal. 4302', caseDiameterMm: 42 },

  // ============== CODE 11.59 ==============
  { id: 'ap-code-11-59-15210cr',         brandId: 'audemars-piguet', collection: 'Code 11.59',                     audience: 'men',     name: 'Code 11.59 Selfwinding 15210CR (rose gold)',      reference: '15210CR',  yearStart: 2019, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-code-11-59-15210bc',         brandId: 'audemars-piguet', collection: 'Code 11.59',                     audience: 'men',     name: 'Code 11.59 Selfwinding 15210BC (white gold)',     reference: '15210BC',  yearStart: 2019, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-code-11-59-15211bc',         brandId: 'audemars-piguet', collection: 'Code 11.59',                     audience: 'men',     name: 'Code 11.59 Selfwinding 15211BC (white gold, sunburst)', reference: '15211BC', yearStart: 2022, caliber: 'Cal. 4302', caseDiameterMm: 41 },
  { id: 'ap-code-11-59-26393bc',         brandId: 'audemars-piguet', collection: 'Code 11.59',                     audience: 'men',     name: 'Code 11.59 Chronograph 26393BC (white gold)',     reference: '26393BC',  yearStart: 2019, caliber: 'Cal. 4400', caseDiameterMm: 41 },
  { id: 'ap-code-11-59-26393cr',         brandId: 'audemars-piguet', collection: 'Code 11.59',                     audience: 'men',     name: 'Code 11.59 Chronograph 26393CR (rose gold)',      reference: '26393CR',  yearStart: 2019, caliber: 'Cal. 4400', caseDiameterMm: 41 },

  // ============== HISTORICAL ==============
  { id: 'ap-royal-oak-14790st',          brandId: 'audemars-piguet', collection: 'Royal Oak (historical)',         audience: 'men',     name: 'Royal Oak 14790ST (36mm, 1992–2005)',             reference: '14790ST',  yearStart: 1992, yearEnd: 2005, caliber: 'Cal. 2225', caseDiameterMm: 36 },
  { id: 'ap-royal-oak-5402st',           brandId: 'audemars-piguet', collection: 'Royal Oak (historical)',         audience: 'men',     name: 'Royal Oak 5402ST (the original Jumbo, 1972)',     reference: '5402ST',   yearStart: 1972, yearEnd: 1992, caliber: 'Cal. 2121', caseDiameterMm: 39 },
];
