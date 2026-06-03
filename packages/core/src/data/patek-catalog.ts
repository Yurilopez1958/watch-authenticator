import type { Brand, Model } from '../types/index';

export const PATEK_BRAND: Brand = {
  id: 'patek-philippe',
  name: 'Patek Philippe',
  country: 'Switzerland',
  foundedYear: 1839,
};

/**
 * Comprehensive Patek Philippe catalog covering Calatrava, Nautilus, Aquanaut,
 * Twenty~4, Grand Complications, Complications, Cubitus, Golden Ellipse and
 * Gondolo across current and recently discontinued production.
 *
 * Patek's catalog is large because metal/dial combinations of the same case
 * receive distinct reference numbers. This list focuses on the most
 * representative references for each combination.
 */
export const PATEK_MODELS: readonly Model[] = [
  // ============== CALATRAVA ==============
  { id: 'patek-calatrava-5196g',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5196G (white gold)',                  reference: '5196G',         yearStart: 2003, caliber: 'Cal. 215 PS',           caseDiameterMm: 37 },
  { id: 'patek-calatrava-5196r',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5196R (rose gold)',                   reference: '5196R',         yearStart: 2003, caliber: 'Cal. 215 PS',           caseDiameterMm: 37 },
  { id: 'patek-calatrava-5196j',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5196J (yellow gold)',                 reference: '5196J',         yearStart: 2003, caliber: 'Cal. 215 PS',           caseDiameterMm: 37 },
  { id: 'patek-calatrava-5196p',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5196P (platinum)',                    reference: '5196P',         yearStart: 2003, caliber: 'Cal. 215 PS',           caseDiameterMm: 37 },
  { id: 'patek-calatrava-6119g',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 6119G (white gold, hobnail)',         reference: '6119G',         yearStart: 2021, caliber: 'Cal. 30-255 PS',        caseDiameterMm: 39 },
  { id: 'patek-calatrava-6119r',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 6119R (rose gold)',                   reference: '6119R',         yearStart: 2021, caliber: 'Cal. 30-255 PS',        caseDiameterMm: 39 },
  { id: 'patek-calatrava-5227g',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5227G (white gold, officer auto)',    reference: '5227G',         yearStart: 2013, caliber: 'Cal. 324 S C',          caseDiameterMm: 39 },
  { id: 'patek-calatrava-5227r',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5227R (rose gold, officer auto)',     reference: '5227R',         yearStart: 2013, caliber: 'Cal. 324 S C',          caseDiameterMm: 39 },
  { id: 'patek-calatrava-5226g',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 5226G (white gold, traveler dial)',   reference: '5226G',         yearStart: 2022, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-calatrava-6007a',          brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'men',     name: 'Calatrava 6007A (steel, anniversary edition)',  reference: '6007A',         yearStart: 2020, caliber: 'Cal. 324 S C',          caseDiameterMm: 40 },

  // ============== NAUTILUS ==============
  { id: 'patek-nautilus-5711-1a-010',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5711/1A-010 (steel, blue dial)',       reference: '5711/1A-010',   yearStart: 2006, yearEnd: 2021, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-nautilus-5711-1a-014',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5711/1A-014 (steel, olive green dial)',reference: '5711/1A-014',   yearStart: 2021, yearEnd: 2022, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-nautilus-5711-1r-001',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5711/1R-001 (rose gold)',              reference: '5711/1R-001',   yearStart: 2010, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-nautilus-5712-1a-001',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5712/1A-001 (steel, moon, PR, date)',  reference: '5712/1A-001',   yearStart: 2006, caliber: 'Cal. 240 PS IRM C LU',  caseDiameterMm: 40 },
  { id: 'patek-nautilus-5712r-001',       brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5712R-001 (rose gold)',                reference: '5712R-001',     yearStart: 2010, caliber: 'Cal. 240 PS IRM C LU',  caseDiameterMm: 40 },
  { id: 'patek-nautilus-5726-1a-014',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5726/1A-014 (annual calendar moon)',   reference: '5726/1A-014',   yearStart: 2010, caliber: 'Cal. 324 S QA LU',      caseDiameterMm: 40.5 },
  { id: 'patek-nautilus-5740-1g-001',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5740/1G-001 (white gold perpetual)',   reference: '5740/1G-001',   yearStart: 2018, caliber: 'Cal. 240 Q',            caseDiameterMm: 40 },
  { id: 'patek-nautilus-5811-1g-001',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5811/1G-001 (white gold, 41mm)',       reference: '5811/1G-001',   yearStart: 2022, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 41 },
  { id: 'patek-nautilus-5980-1a-001',     brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5980/1A-001 (chronograph, steel)',     reference: '5980/1A-001',   yearStart: 2006, yearEnd: 2021, caliber: 'Cal. CH 28-520 C',      caseDiameterMm: 40.5 },
  { id: 'patek-nautilus-5990-1a',         brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 5990/1A (travel time chronograph)',    reference: '5990/1A',       yearStart: 2014, caliber: 'Cal. CH 28-520 IRM QA 24H', caseDiameterMm: 40.5 },

  // ============== AQUANAUT ==============
  { id: 'patek-aquanaut-5167a-001',       brandId: 'patek-philippe', collection: 'Aquanaut',            audience: 'men',     name: 'Aquanaut 5167A-001 (steel, black dial)',        reference: '5167A-001',     yearStart: 2007, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-aquanaut-5167r-001',       brandId: 'patek-philippe', collection: 'Aquanaut',            audience: 'men',     name: 'Aquanaut 5167R-001 (rose gold)',                reference: '5167R-001',     yearStart: 2015, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 40 },
  { id: 'patek-aquanaut-5168g-001',       brandId: 'patek-philippe', collection: 'Aquanaut',            audience: 'men',     name: 'Aquanaut 5168G-001 (white gold, 42.2mm blue)',  reference: '5168G-001',     yearStart: 2017, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 42.2 },
  { id: 'patek-aquanaut-5267-200a',       brandId: 'patek-philippe', collection: 'Aquanaut Luce',       audience: 'unisex',  name: 'Aquanaut Luce 5267/200A (steel, 35.6mm)',       reference: '5267/200A',     yearStart: 2019, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 35.6 },
  { id: 'patek-aquanaut-5269-200r',       brandId: 'patek-philippe', collection: 'Aquanaut Luce',       audience: 'women',   name: 'Aquanaut Luce 5269/200R (rose gold, diamonds)', reference: '5269/200R',     yearStart: 2019, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 35.6 },
  { id: 'patek-aquanaut-5968a-001',       brandId: 'patek-philippe', collection: 'Aquanaut',            audience: 'men',     name: 'Aquanaut Chronograph 5968A-001 (steel)',        reference: '5968A-001',     yearStart: 2018, caliber: 'Cal. CH 28-520 C',      caseDiameterMm: 42.2 },
  { id: 'patek-aquanaut-5650g',           brandId: 'patek-philippe', collection: 'Aquanaut',            audience: 'men',     name: 'Aquanaut Travel Time 5650G "Advanced Research"',reference: '5650G',         yearStart: 2017, caliber: 'Cal. 324 S C FUS',      caseDiameterMm: 40.8 },

  // ============== TWENTY~4 ==============
  { id: 'patek-twenty4-7300-1200a',       brandId: 'patek-philippe', collection: 'Twenty~4',            audience: 'women',   name: 'Twenty~4 Automatic 7300/1200A (steel)',         reference: '7300/1200A',    yearStart: 2018, caliber: 'Cal. 23-300',           caseDiameterMm: 36 },
  { id: 'patek-twenty4-7300-1200r',       brandId: 'patek-philippe', collection: 'Twenty~4',            audience: 'women',   name: 'Twenty~4 Automatic 7300/1200R (rose gold)',     reference: '7300/1200R',    yearStart: 2018, caliber: 'Cal. 23-300',           caseDiameterMm: 36 },
  { id: 'patek-twenty4-7300-1201r',       brandId: 'patek-philippe', collection: 'Twenty~4',            audience: 'women',   name: 'Twenty~4 Automatic 7300/1201R (RG, diamonds)',  reference: '7300/1201R',    yearStart: 2018, caliber: 'Cal. 23-300',           caseDiameterMm: 36 },

  // ============== GRAND COMPLICATIONS ==============
  { id: 'patek-grand-comp-5170g',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'Chronograph 5170G (white gold)',                 reference: '5170G',         yearStart: 2010, caliber: 'Cal. CH 29-535 PS',     caseDiameterMm: 39.4 },
  { id: 'patek-grand-comp-5170r',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'Chronograph 5170R (rose gold)',                  reference: '5170R',         yearStart: 2010, caliber: 'Cal. CH 29-535 PS',     caseDiameterMm: 39.4 },
  { id: 'patek-grand-comp-5270g',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'Perpetual Chronograph 5270G (white gold)',       reference: '5270G',         yearStart: 2011, caliber: 'Cal. CH 29-535 PS Q',   caseDiameterMm: 41 },
  { id: 'patek-grand-comp-5270p',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'Perpetual Chronograph 5270P (platinum)',         reference: '5270P',         yearStart: 2018, caliber: 'Cal. CH 29-535 PS Q',   caseDiameterMm: 41 },
  { id: 'patek-grand-comp-5230g',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'World Time 5230G (white gold)',                  reference: '5230G',         yearStart: 2016, caliber: 'Cal. 240 HU',           caseDiameterMm: 38.5 },
  { id: 'patek-grand-comp-5236p',         brandId: 'patek-philippe', collection: 'Grand Complications', audience: 'men',     name: 'In-Line Perpetual Calendar 5236P (platinum)',    reference: '5236P',         yearStart: 2021, caliber: 'Cal. 31-260 PS QL',     caseDiameterMm: 41.3 },

  // ============== COMPLICATIONS ==============
  { id: 'patek-complications-5524g',      brandId: 'patek-philippe', collection: 'Complications',       audience: 'men',     name: 'Calatrava Pilot Travel Time 5524G (white gold)', reference: '5524G',         yearStart: 2015, caliber: 'Cal. 324 S C FUS',      caseDiameterMm: 42 },
  { id: 'patek-complications-5524r',      brandId: 'patek-philippe', collection: 'Complications',       audience: 'men',     name: 'Calatrava Pilot Travel Time 5524R (rose gold)',  reference: '5524R',         yearStart: 2020, caliber: 'Cal. 324 S C FUS',      caseDiameterMm: 42 },
  { id: 'patek-complications-7234g',      brandId: 'patek-philippe', collection: 'Complications',       audience: 'women',   name: 'Calatrava Pilot Travel Time 7234G (women, 37.5)',reference: '7234G',         yearStart: 2020, caliber: 'Cal. 324 S C FUS',      caseDiameterMm: 37.5 },
  { id: 'patek-complications-5905p',      brandId: 'patek-philippe', collection: 'Complications',       audience: 'men',     name: 'Annual Calendar Chronograph 5905P (platinum)',   reference: '5905P',         yearStart: 2015, caliber: 'Cal. CH 28-520 IRM QA 24H', caseDiameterMm: 42 },
  { id: 'patek-complications-5905-1a',    brandId: 'patek-philippe', collection: 'Complications',       audience: 'men',     name: 'Annual Calendar Chronograph 5905/1A (steel)',    reference: '5905/1A',       yearStart: 2022, caliber: 'Cal. CH 28-520 IRM QA 24H', caseDiameterMm: 42 },

  // ============== CUBITUS (launched 2024) ==============
  { id: 'patek-cubitus-5821-1a-001',      brandId: 'patek-philippe', collection: 'Cubitus',             audience: 'men',     name: 'Cubitus 5821/1A-001 (steel, olive green)',       reference: '5821/1A-001',   yearStart: 2024, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 45 },
  { id: 'patek-cubitus-5821-1ar-001',     brandId: 'patek-philippe', collection: 'Cubitus',             audience: 'men',     name: 'Cubitus 5821/1AR-001 (steel + rose gold)',       reference: '5821/1AR-001',  yearStart: 2024, caliber: 'Cal. 26-330 S C',       caseDiameterMm: 45 },

  // ============== GOLDEN ELLIPSE ==============
  { id: 'patek-golden-ellipse-5738-50p',  brandId: 'patek-philippe', collection: 'Golden Ellipse',      audience: 'men',     name: 'Golden Ellipse 5738/50P (anniversary, platinum)',reference: '5738/50P',      yearStart: 2018, caliber: 'Cal. 240',              caseDiameterMm: 34.5 },
  { id: 'patek-golden-ellipse-5738r',     brandId: 'patek-philippe', collection: 'Golden Ellipse',      audience: 'men',     name: 'Golden Ellipse 5738R (rose gold)',               reference: '5738R',         yearStart: 2013, caliber: 'Cal. 240',              caseDiameterMm: 34.5 },

  // ============== GONDOLO ==============
  { id: 'patek-gondolo-5124g',            brandId: 'patek-philippe', collection: 'Gondolo',             audience: 'men',     name: 'Gondolo 5124G (white gold, rectangular)',        reference: '5124G',         yearStart: 2006, caliber: 'Cal. 25-21 REC PS',     caseDiameterMm: 32 },
  { id: 'patek-gondolo-5298p',            brandId: 'patek-philippe', collection: 'Gondolo',             audience: 'women',   name: 'Gondolo 5298P (platinum, women)',                reference: '5298P',         yearStart: 2010, caliber: 'Cal. 25-21 REC PS',     caseDiameterMm: 30 },

  // ============== VINTAGE ==============
  { id: 'patek-nautilus-3700-1a',         brandId: 'patek-philippe', collection: 'Nautilus',            audience: 'men',     name: 'Nautilus 3700/1A (original "Jumbo")',            reference: '3700/1A',       yearStart: 1976, yearEnd: 1990, caliber: 'Cal. 28-255 C',         caseDiameterMm: 42 },
  { id: 'patek-calatrava-96',             brandId: 'patek-philippe', collection: 'Calatrava',           audience: 'unisex',  name: 'Calatrava 96 (the original, 1932)',              reference: '96',            yearStart: 1932, yearEnd: 1973, caliber: 'Cal. 12-120',           caseDiameterMm: 31 },
];
