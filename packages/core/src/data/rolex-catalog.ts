import type { Brand, Model } from '../types/index';

export const ROLEX_BRAND: Brand = {
  id: 'rolex',
  name: 'Rolex',
  country: 'Switzerland',
  foundedYear: 1905,
};

/**
 * Curated Rolex catalog covering the main current-production references across
 * sport (Professional), classic (Datejust/Day-Date), women's (Lady-Datejust,
 * Datejust 31, Pearlmaster), Oyster Perpetual and Perpetual 1908.
 *
 * The `audience` field reflects how Rolex markets the piece — men's,
 * women's, or unisex (mid-size cases that Rolex offers across both lines).
 * The `collection` field groups references for use in UIs (selector optgroups).
 */
export const ROLEX_MODELS: readonly Model[] = [
  // ============== SUBMARINER ==============
  { id: 'rolex-submariner-124060',         brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner (No Date)',                reference: '124060',     yearStart: 2020, caliber: 'Cal. 3230', caseDiameterMm: 41 },
  { id: 'rolex-submariner-date-126610ln',  brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner Date',                     reference: '126610LN',   yearStart: 2020, caliber: 'Cal. 3235', caseDiameterMm: 41 },
  { id: 'rolex-submariner-date-126610lv',  brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner Date "Kermit"',            reference: '126610LV',   yearStart: 2020, caliber: 'Cal. 3235', caseDiameterMm: 41 },
  { id: 'rolex-submariner-date-116610ln',  brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner Date (previous gen)',      reference: '116610LN',   yearStart: 2010, yearEnd: 2020, caliber: 'Cal. 3135', caseDiameterMm: 40 },
  { id: 'rolex-submariner-date-126618ln',  brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner Date (yellow gold)',       reference: '126618LN',   yearStart: 2020, caliber: 'Cal. 3235', caseDiameterMm: 41 },
  { id: 'rolex-submariner-date-126613lb',  brandId: 'rolex', collection: 'Submariner',          audience: 'men',     name: 'Submariner Date (two-tone blue)',     reference: '126613LB',   yearStart: 2020, caliber: 'Cal. 3235', caseDiameterMm: 41 },

  // ============== GMT-MASTER II ==============
  { id: 'rolex-gmt-master-ii-126710blro',  brandId: 'rolex', collection: 'GMT-Master II',       audience: 'men',     name: 'GMT-Master II "Pepsi"',               reference: '126710BLRO', yearStart: 2018, caliber: 'Cal. 3285', caseDiameterMm: 40 },
  { id: 'rolex-gmt-master-ii-126710blnr',  brandId: 'rolex', collection: 'GMT-Master II',       audience: 'men',     name: 'GMT-Master II "Batman"',              reference: '126710BLNR', yearStart: 2019, caliber: 'Cal. 3285', caseDiameterMm: 40 },
  { id: 'rolex-gmt-master-ii-126711chnr',  brandId: 'rolex', collection: 'GMT-Master II',       audience: 'men',     name: 'GMT-Master II "Root Beer"',           reference: '126711CHNR', yearStart: 2018, caliber: 'Cal. 3285', caseDiameterMm: 40 },
  { id: 'rolex-gmt-master-ii-126720vtnr',  brandId: 'rolex', collection: 'GMT-Master II',       audience: 'men',     name: 'GMT-Master II "Sprite" (lefty)',      reference: '126720VTNR', yearStart: 2022, caliber: 'Cal. 3285', caseDiameterMm: 40 },
  { id: 'rolex-gmt-master-ii-116710ln',    brandId: 'rolex', collection: 'GMT-Master II',       audience: 'men',     name: 'GMT-Master II (previous gen)',        reference: '116710LN',   yearStart: 2007, yearEnd: 2019, caliber: 'Cal. 3186', caseDiameterMm: 40 },

  // ============== SEA-DWELLER / DEEPSEA ==============
  { id: 'rolex-sea-dweller-126600',        brandId: 'rolex', collection: 'Sea-Dweller',         audience: 'men',     name: 'Sea-Dweller 43',                      reference: '126600',     yearStart: 2017, caliber: 'Cal. 3235', caseDiameterMm: 43 },
  { id: 'rolex-deepsea-126660',            brandId: 'rolex', collection: 'Deepsea',             audience: 'men',     name: 'Sea-Dweller Deepsea',                 reference: '126660',     yearStart: 2014, caliber: 'Cal. 3235', caseDiameterMm: 44 },
  { id: 'rolex-deepsea-136660',            brandId: 'rolex', collection: 'Deepsea',             audience: 'men',     name: 'Deepsea (D-blue/RLX)',                reference: '136660',     yearStart: 2022, caliber: 'Cal. 3235', caseDiameterMm: 44 },

  // ============== DAYTONA ==============
  { id: 'rolex-daytona-116500ln',          brandId: 'rolex', collection: 'Cosmograph Daytona',  audience: 'men',     name: 'Cosmograph Daytona (steel, ceramic)', reference: '116500LN',   yearStart: 2016, yearEnd: 2023, caliber: 'Cal. 4130', caseDiameterMm: 40 },
  { id: 'rolex-daytona-126500ln',          brandId: 'rolex', collection: 'Cosmograph Daytona',  audience: 'men',     name: 'Cosmograph Daytona (steel)',          reference: '126500LN',   yearStart: 2023, caliber: 'Cal. 4131', caseDiameterMm: 40 },
  { id: 'rolex-daytona-126506',            brandId: 'rolex', collection: 'Cosmograph Daytona',  audience: 'men',     name: 'Cosmograph Daytona (platinum)',       reference: '126506',     yearStart: 2023, caliber: 'Cal. 4131', caseDiameterMm: 40 },
  { id: 'rolex-daytona-126508',            brandId: 'rolex', collection: 'Cosmograph Daytona',  audience: 'men',     name: 'Cosmograph Daytona (yellow gold)',    reference: '126508',     yearStart: 2023, caliber: 'Cal. 4131', caseDiameterMm: 40 },
  { id: 'rolex-daytona-126515ln',          brandId: 'rolex', collection: 'Cosmograph Daytona',  audience: 'men',     name: 'Cosmograph Daytona (Everose)',        reference: '126515LN',   yearStart: 2023, caliber: 'Cal. 4131', caseDiameterMm: 40 },

  // ============== EXPLORER ==============
  { id: 'rolex-explorer-124270',           brandId: 'rolex', collection: 'Explorer',            audience: 'unisex',  name: 'Explorer 36',                         reference: '124270',     yearStart: 2021, caliber: 'Cal. 3230', caseDiameterMm: 36 },
  { id: 'rolex-explorer-224270',           brandId: 'rolex', collection: 'Explorer',            audience: 'men',     name: 'Explorer 40',                         reference: '224270',     yearStart: 2023, caliber: 'Cal. 3230', caseDiameterMm: 40 },
  { id: 'rolex-explorer-ii-226570',        brandId: 'rolex', collection: 'Explorer II',         audience: 'men',     name: 'Explorer II',                         reference: '226570',     yearStart: 2021, caliber: 'Cal. 3285', caseDiameterMm: 42 },
  { id: 'rolex-explorer-ii-216570',        brandId: 'rolex', collection: 'Explorer II',         audience: 'men',     name: 'Explorer II (previous gen)',          reference: '216570',     yearStart: 2011, yearEnd: 2021, caliber: 'Cal. 3187', caseDiameterMm: 42 },

  // ============== YACHT-MASTER ==============
  { id: 'rolex-yacht-master-126622',       brandId: 'rolex', collection: 'Yacht-Master',        audience: 'men',     name: 'Yacht-Master 40 (Rhodium)',           reference: '126622',     yearStart: 2019, caliber: 'Cal. 3235', caseDiameterMm: 40 },
  { id: 'rolex-yacht-master-126655',       brandId: 'rolex', collection: 'Yacht-Master',        audience: 'men',     name: 'Yacht-Master 40 (Everose)',           reference: '126655',     yearStart: 2015, caliber: 'Cal. 3235', caseDiameterMm: 40 },
  { id: 'rolex-yacht-master-226627',       brandId: 'rolex', collection: 'Yacht-Master',        audience: 'men',     name: 'Yacht-Master 42 (RLX Titanium)',      reference: '226627',     yearStart: 2023, caliber: 'Cal. 3235', caseDiameterMm: 42 },
  { id: 'rolex-yacht-master-37-268621',    brandId: 'rolex', collection: 'Yacht-Master',        audience: 'unisex',  name: 'Yacht-Master 37 (Everose two-tone)',  reference: '268621',     yearStart: 2015, caliber: 'Cal. 2236', caseDiameterMm: 37 },
  { id: 'rolex-yacht-master-37-268622',    brandId: 'rolex', collection: 'Yacht-Master',        audience: 'unisex',  name: 'Yacht-Master 37 (Rhodium)',           reference: '268622',     yearStart: 2015, caliber: 'Cal. 2236', caseDiameterMm: 37 },

  // ============== AIR-KING / SKY-DWELLER ==============
  { id: 'rolex-air-king-126900',           brandId: 'rolex', collection: 'Air-King',            audience: 'men',     name: 'Air-King',                            reference: '126900',     yearStart: 2022, caliber: 'Cal. 3230', caseDiameterMm: 40 },
  { id: 'rolex-sky-dweller-336934',        brandId: 'rolex', collection: 'Sky-Dweller',         audience: 'men',     name: 'Sky-Dweller (steel/white gold bezel)',reference: '336934',     yearStart: 2017, caliber: 'Cal. 9002', caseDiameterMm: 42 },
  { id: 'rolex-sky-dweller-336935',        brandId: 'rolex', collection: 'Sky-Dweller',         audience: 'men',     name: 'Sky-Dweller (Everose)',               reference: '336935',     yearStart: 2017, caliber: 'Cal. 9002', caseDiameterMm: 42 },

  // ============== DATEJUST 41 / 36 ==============
  { id: 'rolex-datejust-41-126300',        brandId: 'rolex', collection: 'Datejust 41',         audience: 'men',     name: 'Datejust 41 (smooth bezel)',          reference: '126300',     yearStart: 2017, caliber: 'Cal. 3235', caseDiameterMm: 41 },
  { id: 'rolex-datejust-41-126334',        brandId: 'rolex', collection: 'Datejust 41',         audience: 'men',     name: 'Datejust 41 (fluted)',                reference: '126334',     yearStart: 2016, caliber: 'Cal. 3235', caseDiameterMm: 41 },
  { id: 'rolex-datejust-36-126200',        brandId: 'rolex', collection: 'Datejust 36',         audience: 'unisex',  name: 'Datejust 36 (smooth)',                reference: '126200',     yearStart: 2018, caliber: 'Cal. 3235', caseDiameterMm: 36 },
  { id: 'rolex-datejust-36-126234',        brandId: 'rolex', collection: 'Datejust 36',         audience: 'unisex',  name: 'Datejust 36 (fluted, white gold)',    reference: '126234',     yearStart: 2018, caliber: 'Cal. 3235', caseDiameterMm: 36 },
  { id: 'rolex-datejust-36-126284rbr',     brandId: 'rolex', collection: 'Datejust 36',         audience: 'unisex',  name: 'Datejust 36 "Wimbledon" (diamonds)',  reference: '126284RBR', yearStart: 2018, caliber: 'Cal. 3235', caseDiameterMm: 36 },

  // ============== DAY-DATE 40 / 36 ==============
  { id: 'rolex-day-date-40-228206',        brandId: 'rolex', collection: 'Day-Date 40',         audience: 'men',     name: 'Day-Date 40 (platinum)',              reference: '228206',     yearStart: 2015, caliber: 'Cal. 3255', caseDiameterMm: 40 },
  { id: 'rolex-day-date-40-228235',        brandId: 'rolex', collection: 'Day-Date 40',         audience: 'men',     name: 'Day-Date 40 (Everose)',               reference: '228235',     yearStart: 2015, caliber: 'Cal. 3255', caseDiameterMm: 40 },
  { id: 'rolex-day-date-40-228238',        brandId: 'rolex', collection: 'Day-Date 40',         audience: 'men',     name: 'Day-Date 40 (yellow gold)',           reference: '228238',     yearStart: 2015, caliber: 'Cal. 3255', caseDiameterMm: 40 },
  { id: 'rolex-day-date-36-128235',        brandId: 'rolex', collection: 'Day-Date 36',         audience: 'unisex',  name: 'Day-Date 36 (Everose)',               reference: '128235',     yearStart: 2019, caliber: 'Cal. 3255', caseDiameterMm: 36 },
  { id: 'rolex-day-date-36-128238',        brandId: 'rolex', collection: 'Day-Date 36',         audience: 'unisex',  name: 'Day-Date 36 (yellow gold)',           reference: '128238',     yearStart: 2019, caliber: 'Cal. 3255', caseDiameterMm: 36 },

  // ============== LADY-DATEJUST 28 ==============
  { id: 'rolex-lady-datejust-28-279160',   brandId: 'rolex', collection: 'Lady-Datejust 28',    audience: 'women',   name: 'Lady-Datejust 28 (steel)',            reference: '279160',     yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 28 },
  { id: 'rolex-lady-datejust-28-279163',   brandId: 'rolex', collection: 'Lady-Datejust 28',    audience: 'women',   name: 'Lady-Datejust 28 (two-tone yellow)',  reference: '279163',     yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 28 },
  { id: 'rolex-lady-datejust-28-279174',   brandId: 'rolex', collection: 'Lady-Datejust 28',    audience: 'women',   name: 'Lady-Datejust 28 (two-tone white)',   reference: '279174',     yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 28 },

  // ============== DATEJUST 31 ==============
  { id: 'rolex-datejust-31-278240',        brandId: 'rolex', collection: 'Datejust 31',         audience: 'women',   name: 'Datejust 31 (steel)',                 reference: '278240',     yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 31 },
  { id: 'rolex-datejust-31-278274',        brandId: 'rolex', collection: 'Datejust 31',         audience: 'women',   name: 'Datejust 31 (two-tone white gold)',   reference: '278274',     yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 31 },
  { id: 'rolex-datejust-31-278285rbr',     brandId: 'rolex', collection: 'Datejust 31',         audience: 'women',   name: 'Datejust 31 (Everose, diamonds)',     reference: '278285RBR', yearStart: 2018, caliber: 'Cal. 2236', caseDiameterMm: 31 },

  // ============== PEARLMASTER ==============
  { id: 'rolex-pearlmaster-34-81348',      brandId: 'rolex', collection: 'Pearlmaster',         audience: 'women',   name: 'Pearlmaster 34 (yellow gold)',        reference: '81348',      yearStart: 2015, caliber: 'Cal. 2236', caseDiameterMm: 34 },
  { id: 'rolex-pearlmaster-39-86409rbr',   brandId: 'rolex', collection: 'Pearlmaster',         audience: 'women',   name: 'Pearlmaster 39 (Everose, rainbow)',   reference: '86409RBR', yearStart: 2015, caliber: 'Cal. 3235', caseDiameterMm: 39 },

  // ============== OYSTER PERPETUAL ==============
  { id: 'rolex-op-28-276200',              brandId: 'rolex', collection: 'Oyster Perpetual',    audience: 'women',   name: 'Oyster Perpetual 28',                 reference: '276200',     yearStart: 2020, caliber: 'Cal. 2236', caseDiameterMm: 28 },
  { id: 'rolex-op-31-277200',              brandId: 'rolex', collection: 'Oyster Perpetual',    audience: 'women',   name: 'Oyster Perpetual 31',                 reference: '277200',     yearStart: 2020, caliber: 'Cal. 2236', caseDiameterMm: 31 },
  { id: 'rolex-op-34-124200',              brandId: 'rolex', collection: 'Oyster Perpetual',    audience: 'unisex',  name: 'Oyster Perpetual 34',                 reference: '124200',     yearStart: 2020, caliber: 'Cal. 3230', caseDiameterMm: 34 },
  { id: 'rolex-op-36-126000',              brandId: 'rolex', collection: 'Oyster Perpetual',    audience: 'unisex',  name: 'Oyster Perpetual 36',                 reference: '126000',     yearStart: 2020, caliber: 'Cal. 3230', caseDiameterMm: 36 },
  { id: 'rolex-op-41-124300',              brandId: 'rolex', collection: 'Oyster Perpetual',    audience: 'men',     name: 'Oyster Perpetual 41',                 reference: '124300',     yearStart: 2020, caliber: 'Cal. 3230', caseDiameterMm: 41 },

  // ============== PERPETUAL 1908 ==============
  { id: 'rolex-perpetual-1908-52508',      brandId: 'rolex', collection: 'Perpetual 1908',      audience: 'men',     name: 'Perpetual 1908 (white gold)',         reference: '52508',      yearStart: 2023, caliber: 'Cal. 7140', caseDiameterMm: 39 },
  { id: 'rolex-perpetual-1908-52509',      brandId: 'rolex', collection: 'Perpetual 1908',      audience: 'men',     name: 'Perpetual 1908 (yellow gold)',        reference: '52509',      yearStart: 2023, caliber: 'Cal. 7140', caseDiameterMm: 39 },

  // ============================================================
  // VINTAGE / DISCONTINUED — classic references collectors and
  // watchmakers see daily (5-digit and 4-digit refs).
  // ============================================================

  // ---- Submariner (vintage) ----
  { id: 'rolex-submariner-5513',     brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner (No Date) 5513',            reference: '5513',    yearStart: 1962, yearEnd: 1989, caliber: 'Cal. 1520', caseDiameterMm: 40 },
  { id: 'rolex-submariner-1680',     brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner Date 1680 (first date Sub)',reference: '1680',    yearStart: 1969, yearEnd: 1980, caliber: 'Cal. 1570', caseDiameterMm: 40 },
  { id: 'rolex-submariner-16800',    brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner Date 16800',                reference: '16800',   yearStart: 1979, yearEnd: 1988, caliber: 'Cal. 3035', caseDiameterMm: 40 },
  { id: 'rolex-submariner-16610',    brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner Date 16610',                reference: '16610',   yearStart: 1989, yearEnd: 2010, caliber: 'Cal. 3135', caseDiameterMm: 40 },
  { id: 'rolex-submariner-16610lv',  brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner Date 16610LV "Kermit"',     reference: '16610LV', yearStart: 2003, yearEnd: 2010, caliber: 'Cal. 3135', caseDiameterMm: 40 },
  { id: 'rolex-submariner-14060',    brandId: 'rolex', collection: 'Submariner',         audience: 'men',     name: 'Submariner (No Date) 14060 / 14060M',  reference: '14060',   yearStart: 1990, yearEnd: 2012, caliber: 'Cal. 3130', caseDiameterMm: 40 },

  // ---- GMT-Master (vintage) ----
  { id: 'rolex-gmt-1675',            brandId: 'rolex', collection: 'GMT-Master',         audience: 'men',     name: 'GMT-Master 1675',                      reference: '1675',    yearStart: 1959, yearEnd: 1980, caliber: 'Cal. 1570', caseDiameterMm: 40 },
  { id: 'rolex-gmt-16750',           brandId: 'rolex', collection: 'GMT-Master',         audience: 'men',     name: 'GMT-Master 16750',                     reference: '16750',   yearStart: 1981, yearEnd: 1988, caliber: 'Cal. 3075', caseDiameterMm: 40 },
  { id: 'rolex-gmt-16700',           brandId: 'rolex', collection: 'GMT-Master',         audience: 'men',     name: 'GMT-Master 16700',                     reference: '16700',   yearStart: 1988, yearEnd: 1999, caliber: 'Cal. 3175', caseDiameterMm: 40 },
  { id: 'rolex-gmt-ii-16760',        brandId: 'rolex', collection: 'GMT-Master II',      audience: 'men',     name: 'GMT-Master II 16760 "Fat Lady"',       reference: '16760',   yearStart: 1983, yearEnd: 1988, caliber: 'Cal. 3085', caseDiameterMm: 40 },
  { id: 'rolex-gmt-ii-16710',        brandId: 'rolex', collection: 'GMT-Master II',      audience: 'men',     name: 'GMT-Master II 16710',                  reference: '16710',   yearStart: 1989, yearEnd: 2007, caliber: 'Cal. 3185', caseDiameterMm: 40 },

  // ---- Datejust 36 (vintage) ----
  { id: 'rolex-datejust-1601',       brandId: 'rolex', collection: 'Datejust 36',        audience: 'unisex',  name: 'Datejust 1601',                        reference: '1601',    yearStart: 1959, yearEnd: 1977, caliber: 'Cal. 1570', caseDiameterMm: 36 },
  { id: 'rolex-datejust-16014',      brandId: 'rolex', collection: 'Datejust 36',        audience: 'unisex',  name: 'Datejust 16014',                       reference: '16014',   yearStart: 1977, yearEnd: 1988, caliber: 'Cal. 3035', caseDiameterMm: 36 },
  { id: 'rolex-datejust-16234',      brandId: 'rolex', collection: 'Datejust 36',        audience: 'unisex',  name: 'Datejust 16234',                       reference: '16234',   yearStart: 1988, yearEnd: 2009, caliber: 'Cal. 3135', caseDiameterMm: 36 },
  { id: 'rolex-datejust-116234',     brandId: 'rolex', collection: 'Datejust 36',        audience: 'unisex',  name: 'Datejust 116234',                      reference: '116234',  yearStart: 2005, yearEnd: 2016, caliber: 'Cal. 3135', caseDiameterMm: 36 },

  // ---- Day-Date 36 (vintage) ----
  { id: 'rolex-day-date-1803',       brandId: 'rolex', collection: 'Day-Date 36',        audience: 'men',     name: 'Day-Date 1803 (President)',            reference: '1803',    yearStart: 1959, yearEnd: 1977, caliber: 'Cal. 1556', caseDiameterMm: 36 },
  { id: 'rolex-day-date-18038',      brandId: 'rolex', collection: 'Day-Date 36',        audience: 'men',     name: 'Day-Date 18038',                       reference: '18038',   yearStart: 1977, yearEnd: 1988, caliber: 'Cal. 3055', caseDiameterMm: 36 },
  { id: 'rolex-day-date-18238',      brandId: 'rolex', collection: 'Day-Date 36',        audience: 'men',     name: 'Day-Date 18238',                       reference: '18238',   yearStart: 1988, yearEnd: 2000, caliber: 'Cal. 3155', caseDiameterMm: 36 },
  { id: 'rolex-day-date-118238',     brandId: 'rolex', collection: 'Day-Date 36',        audience: 'men',     name: 'Day-Date 118238',                      reference: '118238',  yearStart: 2000, yearEnd: 2015, caliber: 'Cal. 3155', caseDiameterMm: 36 },

  // ---- Explorer (vintage) ----
  { id: 'rolex-explorer-1016',       brandId: 'rolex', collection: 'Explorer',           audience: 'unisex',  name: 'Explorer 1016',                        reference: '1016',    yearStart: 1963, yearEnd: 1989, caliber: 'Cal. 1570', caseDiameterMm: 36 },
  { id: 'rolex-explorer-14270',      brandId: 'rolex', collection: 'Explorer',           audience: 'unisex',  name: 'Explorer 14270',                       reference: '14270',   yearStart: 1989, yearEnd: 2001, caliber: 'Cal. 3000', caseDiameterMm: 36 },
  { id: 'rolex-explorer-114270',     brandId: 'rolex', collection: 'Explorer',           audience: 'unisex',  name: 'Explorer 114270',                      reference: '114270',  yearStart: 2001, yearEnd: 2010, caliber: 'Cal. 3130', caseDiameterMm: 36 },

  // ---- Explorer II (vintage) ----
  { id: 'rolex-explorer-ii-1655',    brandId: 'rolex', collection: 'Explorer II',        audience: 'men',     name: 'Explorer II 1655 "Steve McQueen"',     reference: '1655',    yearStart: 1971, yearEnd: 1985, caliber: 'Cal. 1570', caseDiameterMm: 39 },
  { id: 'rolex-explorer-ii-16550',   brandId: 'rolex', collection: 'Explorer II',        audience: 'men',     name: 'Explorer II 16550',                    reference: '16550',   yearStart: 1985, yearEnd: 1989, caliber: 'Cal. 3085', caseDiameterMm: 40 },
  { id: 'rolex-explorer-ii-16570',   brandId: 'rolex', collection: 'Explorer II',        audience: 'men',     name: 'Explorer II 16570',                    reference: '16570',   yearStart: 1989, yearEnd: 2011, caliber: 'Cal. 3185', caseDiameterMm: 40 },

  // ---- Cosmograph Daytona (vintage) ----
  { id: 'rolex-daytona-6263',        brandId: 'rolex', collection: 'Cosmograph Daytona', audience: 'men',     name: 'Cosmograph Daytona 6263 (manual)',     reference: '6263',    yearStart: 1969, yearEnd: 1987, caliber: 'Cal. 727',  caseDiameterMm: 37 },
  { id: 'rolex-daytona-16520',       brandId: 'rolex', collection: 'Cosmograph Daytona', audience: 'men',     name: 'Cosmograph Daytona 16520 "Zenith"',    reference: '16520',   yearStart: 1988, yearEnd: 2000, caliber: 'Cal. 4030', caseDiameterMm: 40 },
  { id: 'rolex-daytona-116520',      brandId: 'rolex', collection: 'Cosmograph Daytona', audience: 'men',     name: 'Cosmograph Daytona 116520',            reference: '116520',  yearStart: 2000, yearEnd: 2016, caliber: 'Cal. 4130', caseDiameterMm: 40 },

  // ---- Sea-Dweller (vintage) ----
  { id: 'rolex-sea-dweller-1665',    brandId: 'rolex', collection: 'Sea-Dweller',        audience: 'men',     name: 'Sea-Dweller 1665 "Double Red"',        reference: '1665',    yearStart: 1967, yearEnd: 1983, caliber: 'Cal. 1570', caseDiameterMm: 40 },
  { id: 'rolex-sea-dweller-16600',   brandId: 'rolex', collection: 'Sea-Dweller',        audience: 'men',     name: 'Sea-Dweller 16600',                    reference: '16600',   yearStart: 1989, yearEnd: 2008, caliber: 'Cal. 3135', caseDiameterMm: 40 },
  { id: 'rolex-sea-dweller-116600',  brandId: 'rolex', collection: 'Sea-Dweller',        audience: 'men',     name: 'Sea-Dweller 116600 (50th anniv.)',     reference: '116600',  yearStart: 2014, yearEnd: 2017, caliber: 'Cal. 3135', caseDiameterMm: 40 },

  // ---- Air-King (vintage) ----
  { id: 'rolex-air-king-5500',       brandId: 'rolex', collection: 'Air-King',           audience: 'unisex',  name: 'Air-King 5500',                        reference: '5500',    yearStart: 1957, yearEnd: 1989, caliber: 'Cal. 1520', caseDiameterMm: 34 },
  { id: 'rolex-air-king-14000',      brandId: 'rolex', collection: 'Air-King',           audience: 'unisex',  name: 'Air-King 14000 / 14000M',              reference: '14000',   yearStart: 1989, yearEnd: 2007, caliber: 'Cal. 3130', caseDiameterMm: 34 },
  { id: 'rolex-air-king-114200',     brandId: 'rolex', collection: 'Air-King',           audience: 'unisex',  name: 'Air-King 114200',                      reference: '114200',  yearStart: 2007, yearEnd: 2014, caliber: 'Cal. 3130', caseDiameterMm: 34 },

  // ---- Milgauss ----
  { id: 'rolex-milgauss-116400',     brandId: 'rolex', collection: 'Milgauss',           audience: 'men',     name: 'Milgauss 116400 / 116400GV',           reference: '116400',  yearStart: 2007, yearEnd: 2023, caliber: 'Cal. 3131', caseDiameterMm: 40 },
];
