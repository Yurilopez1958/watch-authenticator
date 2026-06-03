import type { Brand, Model } from '../types/index';

export const OMEGA_BRAND: Brand = {
  id: 'omega',
  name: 'Omega',
  country: 'Switzerland',
  foundedYear: 1848,
};

/**
 * Comprehensive Omega catalog covering Speedmaster (Moonwatch and modern
 * chronographs), Seamaster (Diver 300M, Planet Ocean, Aqua Terra, Railmaster,
 * Ploprof, 300 Heritage, 1948), Constellation and De Ville.
 *
 * Reference numbers use Omega's standard format
 * (e.g. 310.30.42.50.01.001 for the Hesalite Moonwatch).
 */
export const OMEGA_MODELS: readonly Model[] = [
  // ============== SPEEDMASTER ==============
  { id: 'omega-speedmaster-moonwatch-hesalite',    brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Moonwatch Professional (Hesalite)',  reference: '310.30.42.50.01.001', yearStart: 2021, caliber: 'Cal. 3861', caseDiameterMm: 42 },
  { id: 'omega-speedmaster-moonwatch-sapphire',    brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Moonwatch Professional (Sapphire)',  reference: '310.30.42.50.01.002', yearStart: 2021, caliber: 'Cal. 3861', caseDiameterMm: 42 },
  { id: 'omega-speedmaster-moonwatch-old-1861',    brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Moonwatch (older, Cal. 1861)',       reference: '311.30.42.30.01.005', yearStart: 1996, yearEnd: 2021, caliber: 'Cal. 1861', caseDiameterMm: 42 },
  { id: 'omega-speedmaster-racing',                brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Racing Master Chronometer',          reference: '329.30.44.51.01.002', yearStart: 2017, caliber: 'Cal. 9900', caseDiameterMm: 44.25 },
  { id: 'omega-speedmaster-dark-side-of-the-moon', brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Dark Side of the Moon (ceramic)',    reference: '311.92.44.51.01.007', yearStart: 2013, caliber: 'Cal. 9300', caseDiameterMm: 44.25 },
  { id: 'omega-speedmaster-silver-snoopy',         brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Silver Snoopy Award 50th',           reference: '310.32.42.50.02.001', yearStart: 2020, caliber: 'Cal. 3861', caseDiameterMm: 42 },
  { id: 'omega-speedmaster-57',                    brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster \'57 Co-Axial Master Chronometer',   reference: '332.10.41.51.01.001', yearStart: 2023, caliber: 'Cal. 9906', caseDiameterMm: 40.5 },
  { id: 'omega-speedmaster-chronoscope',           brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Two Counters Chronoscope',           reference: '329.30.43.51.01.001', yearStart: 2021, caliber: 'Cal. 9908', caseDiameterMm: 43 },
  { id: 'omega-speedmaster-apollo-11-50th',        brandId: 'omega', collection: 'Speedmaster',           audience: 'men',     name: 'Speedmaster Apollo 11 50th (steel + Moonshine)', reference: '310.20.42.50.99.001', yearStart: 2019, caliber: 'Cal. 3861', caseDiameterMm: 42 },

  // ============== SEAMASTER DIVER 300M ==============
  { id: 'omega-sm-diver-300m-steel-black',         brandId: 'omega', collection: 'Seamaster Diver 300M',  audience: 'men',     name: 'Seamaster Diver 300M (steel, black ceramic)',    reference: '210.30.42.20.01.001', yearStart: 2018, caliber: 'Cal. 8800', caseDiameterMm: 42 },
  { id: 'omega-sm-diver-300m-steel-blue',          brandId: 'omega', collection: 'Seamaster Diver 300M',  audience: 'men',     name: 'Seamaster Diver 300M (steel, blue wave dial)',   reference: '210.32.42.20.04.001', yearStart: 2018, caliber: 'Cal. 8800', caseDiameterMm: 42 },
  { id: 'omega-sm-diver-300m-titanium',            brandId: 'omega', collection: 'Seamaster Diver 300M',  audience: 'men',     name: 'Seamaster Diver 300M (titanium / tantalum)',     reference: '210.62.42.20.10.001', yearStart: 2018, caliber: 'Cal. 8800', caseDiameterMm: 42 },
  { id: 'omega-sm-diver-300m-nttd',                brandId: 'omega', collection: 'Seamaster Diver 300M',  audience: 'men',     name: 'Seamaster Diver 300M "No Time To Die" (titanium)', reference: '210.92.42.20.01.001', yearStart: 2019, caliber: 'Cal. 8806', caseDiameterMm: 42 },

  // ============== PLANET OCEAN ==============
  { id: 'omega-planet-ocean-43-5',                 brandId: 'omega', collection: 'Planet Ocean',          audience: 'men',     name: 'Planet Ocean 600M Co-Axial Master Chronometer 43.5', reference: '215.30.44.21.01.001', yearStart: 2016, caliber: 'Cal. 8900', caseDiameterMm: 43.5 },
  { id: 'omega-planet-ocean-39-5',                 brandId: 'omega', collection: 'Planet Ocean',          audience: 'unisex',  name: 'Planet Ocean 600M Co-Axial Master Chronometer 39.5', reference: '215.30.40.20.01.001', yearStart: 2016, caliber: 'Cal. 8800', caseDiameterMm: 39.5 },
  { id: 'omega-planet-ocean-gmt-45-5',             brandId: 'omega', collection: 'Planet Ocean',          audience: 'men',     name: 'Planet Ocean 600M GMT 45.5',                     reference: '215.92.46.22.01.001', yearStart: 2016, caliber: 'Cal. 8906', caseDiameterMm: 45.5 },

  // ============== AQUA TERRA ==============
  { id: 'omega-aqua-terra-41',                     brandId: 'omega', collection: 'Aqua Terra',            audience: 'men',     name: 'Seamaster Aqua Terra 150M 41',                   reference: '220.10.41.21.01.001', yearStart: 2017, caliber: 'Cal. 8900', caseDiameterMm: 41 },
  { id: 'omega-aqua-terra-38',                     brandId: 'omega', collection: 'Aqua Terra',            audience: 'unisex',  name: 'Seamaster Aqua Terra 150M 38',                   reference: '220.10.38.20.10.001', yearStart: 2017, caliber: 'Cal. 8800', caseDiameterMm: 38 },
  { id: 'omega-aqua-terra-34',                     brandId: 'omega', collection: 'Aqua Terra',            audience: 'women',   name: 'Seamaster Aqua Terra 150M 34 (women)',           reference: '220.12.34.20.60.001', yearStart: 2017, caliber: 'Cal. 8800', caseDiameterMm: 34 },
  { id: 'omega-aqua-terra-worldtimer',             brandId: 'omega', collection: 'Aqua Terra',            audience: 'men',     name: 'Seamaster Aqua Terra Worldtimer',                reference: '220.12.43.22.03.001', yearStart: 2017, caliber: 'Cal. 8938', caseDiameterMm: 43 },

  // ============== OTHER SEAMASTER ==============
  { id: 'omega-railmaster-40',                     brandId: 'omega', collection: 'Railmaster',            audience: 'unisex',  name: 'Seamaster Railmaster Co-Axial Master Chronometer', reference: '220.10.40.20.01.001', yearStart: 2017, caliber: 'Cal. 8806', caseDiameterMm: 40 },
  { id: 'omega-ploprof-1200m',                     brandId: 'omega', collection: 'Seamaster Ploprof',     audience: 'men',     name: 'Seamaster Ploprof 1200M Co-Axial Master Chr.',   reference: '227.30.55.21.01.001', yearStart: 2016, caliber: 'Cal. 8912', caseDiameterMm: 55 },
  { id: 'omega-seamaster-300-heritage',            brandId: 'omega', collection: 'Seamaster 300 Heritage', audience: 'men',    name: 'Seamaster 300 Heritage Co-Axial Master Chr.',    reference: '234.30.41.21.03.001', yearStart: 2021, caliber: 'Cal. 8912', caseDiameterMm: 41 },
  { id: 'omega-seamaster-1948-small-seconds',      brandId: 'omega', collection: 'Seamaster 1948',        audience: 'unisex',  name: 'Seamaster 1948 Small Seconds Co-Axial Master Chr.', reference: '511.13.38.20.04.001', yearStart: 2018, caliber: 'Cal. 8804', caseDiameterMm: 38 },

  // ============== CONSTELLATION ==============
  { id: 'omega-constellation-41',                  brandId: 'omega', collection: 'Constellation',         audience: 'men',     name: 'Constellation Co-Axial Master Chronometer 41',   reference: '130.30.41.21.06.001', yearStart: 2020, caliber: 'Cal. 8900', caseDiameterMm: 41 },
  { id: 'omega-constellation-globemaster',         brandId: 'omega', collection: 'Constellation',         audience: 'unisex',  name: 'Constellation Globemaster Co-Axial Master Chr.', reference: '130.33.41.22.03.001', yearStart: 2015, caliber: 'Cal. 8900', caseDiameterMm: 39 },
  { id: 'omega-constellation-globemaster-annual',  brandId: 'omega', collection: 'Constellation',         audience: 'men',     name: 'Constellation Globemaster Annual Calendar',      reference: '130.33.41.22.02.001', yearStart: 2016, caliber: 'Cal. 8923', caseDiameterMm: 41 },

  // ============== DE VILLE ==============
  { id: 'omega-de-ville-tresor',                   brandId: 'omega', collection: 'De Ville',              audience: 'men',     name: 'De Ville Trésor Co-Axial Master Chronometer',    reference: '435.13.40.21.02.001', yearStart: 2014, caliber: 'Cal. 8910', caseDiameterMm: 40 },
  { id: 'omega-de-ville-prestige',                 brandId: 'omega', collection: 'De Ville',              audience: 'unisex',  name: 'De Ville Prestige Co-Axial',                     reference: '424.10.40.20.02.001', yearStart: 2005, caliber: 'Cal. 2500', caseDiameterMm: 39.5 },
  { id: 'omega-de-ville-hour-vision',              brandId: 'omega', collection: 'De Ville',              audience: 'men',     name: 'De Ville Hour Vision Co-Axial',                  reference: '433.10.41.21.02.001', yearStart: 2007, caliber: 'Cal. 8500', caseDiameterMm: 41 },

  // ============== VINTAGE ==============
  { id: 'omega-speedmaster-ck2998',           brandId: 'omega', collection: 'Speedmaster',          audience: 'men',     name: 'Speedmaster CK2998 (pre-Moon)',                  reference: 'CK2998',    yearStart: 1959, yearEnd: 1963, caliber: 'Cal. 321',  caseDiameterMm: 39.7 },
  { id: 'omega-speedmaster-105012',           brandId: 'omega', collection: 'Speedmaster',          audience: 'men',     name: 'Speedmaster 105.012 ("First Moon")',             reference: '105.012',   yearStart: 1963, yearEnd: 1968, caliber: 'Cal. 321',  caseDiameterMm: 42 },
  { id: 'omega-speedmaster-145022',           brandId: 'omega', collection: 'Speedmaster',          audience: 'men',     name: 'Speedmaster Professional 145.022',               reference: '145.022',   yearStart: 1968, yearEnd: 1988, caliber: 'Cal. 861',  caseDiameterMm: 42 },
  { id: 'omega-speedmaster-mark-ii',          brandId: 'omega', collection: 'Speedmaster',          audience: 'men',     name: 'Speedmaster Mark II (vintage)',                  reference: '145.014',   yearStart: 1969, yearEnd: 1972, caliber: 'Cal. 861',  caseDiameterMm: 41.5 },
  { id: 'omega-seamaster-300-165024',         brandId: 'omega', collection: 'Seamaster 300 Heritage', audience: 'men',   name: 'Seamaster 300 165.024 (vintage diver)',          reference: '165.024',   yearStart: 1964, yearEnd: 1969, caliber: 'Cal. 565',  caseDiameterMm: 42 },
  { id: 'omega-seamaster-300-145024',         brandId: 'omega', collection: 'Seamaster 300 Heritage', audience: 'men',   name: 'Seamaster 300 SM120 Chrono (vintage)',           reference: '145.024',   yearStart: 1968, yearEnd: 1970, caliber: 'Cal. 321',  caseDiameterMm: 42 },
  { id: 'omega-constellation-pie-pan-168005', brandId: 'omega', collection: 'Constellation',        audience: 'unisex',  name: 'Constellation "Pie-Pan" 168.005',                reference: '168.005',   yearStart: 1966, yearEnd: 1970, caliber: 'Cal. 551',  caseDiameterMm: 35 },
  { id: 'omega-railmaster-ck2914',            brandId: 'omega', collection: 'Railmaster',           audience: 'men',     name: 'Railmaster CK2914 (1957 vintage)',               reference: 'CK2914',    yearStart: 1957, yearEnd: 1963, caliber: 'Cal. 551',  caseDiameterMm: 38 },
];
