import type { Brand, Model } from '../types/index';

export const CARTIER_BRAND: Brand = {
  id: 'cartier',
  name: 'Cartier',
  country: 'France / Switzerland',
  foundedYear: 1847,
};

/**
 * Cartier catalog focused on mechanical references across Santos de Cartier,
 * Santos Dumont, Tank (Louis Cartier, MC, Américaine, Asymétrique Privé),
 * Pasha, Ballon Bleu, Calibre de Cartier and Drive.
 *
 * Quartz references (Tank Must, Tank Française quartz, smaller Ballon Bleu
 * quartz, etc.) are intentionally omitted because the movement-check pipeline
 * targets mechanical calibers. They can be added later with a dedicated
 * quartz movement model.
 */
export const CARTIER_MODELS: readonly Model[] = [
  // ============== SANTOS DE CARTIER ==============
  { id: 'cartier-santos-wssa0009',           brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'unisex',  name: 'Santos de Cartier Medium (steel)',                    reference: 'WSSA0009',  yearStart: 2018, caliber: 'Cal. 1847 MC',     caseDiameterMm: 35.1 },
  { id: 'cartier-santos-wssa0010',           brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'men',     name: 'Santos de Cartier Large (steel)',                     reference: 'WSSA0010',  yearStart: 2018, caliber: 'Cal. 1847 MC',     caseDiameterMm: 39.8 },
  { id: 'cartier-santos-wssa0029',           brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'men',     name: 'Santos de Cartier Large (steel + yellow gold)',       reference: 'WSSA0029',  yearStart: 2018, caliber: 'Cal. 1847 MC',     caseDiameterMm: 39.8 },
  { id: 'cartier-santos-w2sa0006',           brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'men',     name: 'Santos de Cartier Large (blue dial, steel)',          reference: 'W2SA0006',  yearStart: 2018, caliber: 'Cal. 1847 MC',     caseDiameterMm: 39.8 },
  { id: 'cartier-santos-wssa0017',           brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'men',     name: 'Santos de Cartier Large (yellow gold)',               reference: 'WGSA0017',  yearStart: 2018, caliber: 'Cal. 1847 MC',     caseDiameterMm: 39.8 },
  { id: 'cartier-santos-chrono-w2sa0008',    brandId: 'cartier', collection: 'Santos de Cartier',     audience: 'men',     name: 'Santos de Cartier Chronograph (steel)',               reference: 'W2SA0008',  yearStart: 2019, caliber: 'Cal. 1904-CH MC',  caseDiameterMm: 43.3 },

  // ============== SANTOS DUMONT ==============
  { id: 'cartier-santos-dumont-wgsa0021',    brandId: 'cartier', collection: 'Santos Dumont',         audience: 'unisex',  name: 'Santos Dumont Large (white gold, hand-wound)',        reference: 'WGSA0021',  yearStart: 2019, caliber: 'Cal. 430 MC',      caseDiameterMm: 31.4 },
  { id: 'cartier-santos-dumont-wgsa0029',    brandId: 'cartier', collection: 'Santos Dumont',         audience: 'unisex',  name: 'Santos Dumont Large (yellow gold, hand-wound)',       reference: 'WGSA0029',  yearStart: 2019, caliber: 'Cal. 430 MC',      caseDiameterMm: 31.4 },
  { id: 'cartier-santos-dumont-wssa0032',    brandId: 'cartier', collection: 'Santos Dumont',         audience: 'men',     name: 'Santos Dumont XL (steel, hand-wound)',                reference: 'WSSA0032',  yearStart: 2020, caliber: 'Cal. 430 MC',      caseDiameterMm: 46.6 },
  { id: 'cartier-santos-dumont-wgsa0054',    brandId: 'cartier', collection: 'Santos Dumont',         audience: 'men',     name: 'Santos Dumont Skeleton (yellow gold)',                reference: 'WGSA0054',  yearStart: 2020, caliber: 'Cal. 9611 MC',     caseDiameterMm: 46.6 },

  // ============== TANK LOUIS CARTIER ==============
  { id: 'cartier-tank-lc-w1529856',          brandId: 'cartier', collection: 'Tank Louis Cartier',    audience: 'men',     name: 'Tank Louis Cartier Large (yellow gold, hand-wound)',  reference: 'W1529856',  yearStart: 2013, caliber: 'Cal. 8971 MC',     caseDiameterMm: 33.7 },
  { id: 'cartier-tank-lc-wgta0011',          brandId: 'cartier', collection: 'Tank Louis Cartier',    audience: 'men',     name: 'Tank Louis Cartier Large (white gold, hand-wound)',   reference: 'WGTA0011',  yearStart: 2013, caliber: 'Cal. 8971 MC',     caseDiameterMm: 33.7 },
  { id: 'cartier-tank-lc-w6700355',          brandId: 'cartier', collection: 'Tank Louis Cartier',    audience: 'men',     name: 'Tank Louis Cartier Large (rose gold, hand-wound)',    reference: 'W6700355',  yearStart: 2013, caliber: 'Cal. 8971 MC',     caseDiameterMm: 33.7 },

  // ============== TANK MC ==============
  { id: 'cartier-tank-mc-w5330001',          brandId: 'cartier', collection: 'Tank MC',               audience: 'men',     name: 'Tank MC (steel, automatic)',                          reference: 'W5330001',  yearStart: 2012, caliber: 'Cal. 1904 MC',     caseDiameterMm: 34.3 },
  { id: 'cartier-tank-mc-w5330004',          brandId: 'cartier', collection: 'Tank MC',               audience: 'men',     name: 'Tank MC (rose gold, automatic)',                      reference: 'W5330004',  yearStart: 2012, caliber: 'Cal. 1904 MC',     caseDiameterMm: 34.3 },

  // ============== TANK AMÉRICAINE ==============
  { id: 'cartier-tank-americaine-wgta0114',  brandId: 'cartier', collection: 'Tank Américaine',       audience: 'men',     name: 'Tank Américaine (white gold, automatic)',             reference: 'WGTA0114',  yearStart: 2023, caliber: 'Cal. 430 MC',      caseDiameterMm: 41.6 },
  { id: 'cartier-tank-americaine-wsta0017',  brandId: 'cartier', collection: 'Tank Américaine',       audience: 'men',     name: 'Tank Américaine (steel, automatic)',                  reference: 'WSTA0017',  yearStart: 2023, caliber: 'Cal. 1847 MC',     caseDiameterMm: 41.6 },

  // ============== TANK ASYMÉTRIQUE PRIVÉ ==============
  { id: 'cartier-tank-asymetrique-whta0006', brandId: 'cartier', collection: 'Cartier Privé',         audience: 'men',     name: 'Tank Asymétrique Privé (yellow gold, hand-wound)',    reference: 'WHTA0006',  yearStart: 2020, caliber: 'Cal. 9908 MC',     caseDiameterMm: 47.15 },

  // ============== PASHA DE CARTIER ==============
  { id: 'cartier-pasha-wspa0009',            brandId: 'cartier', collection: 'Pasha de Cartier',      audience: 'men',     name: 'Pasha de Cartier 41 (steel, automatic)',              reference: 'WSPA0009',  yearStart: 2020, caliber: 'Cal. 1847 MC',     caseDiameterMm: 41 },
  { id: 'cartier-pasha-wspa0013',            brandId: 'cartier', collection: 'Pasha de Cartier',      audience: 'men',     name: 'Pasha de Cartier 41 (rose gold, automatic)',          reference: 'WSPA0013',  yearStart: 2020, caliber: 'Cal. 1847 MC',     caseDiameterMm: 41 },
  { id: 'cartier-pasha-chrono-wspa0018',     brandId: 'cartier', collection: 'Pasha de Cartier',      audience: 'men',     name: 'Pasha de Cartier Chronograph (steel)',                reference: 'WSPA0018',  yearStart: 2021, caliber: 'Cal. 1904-CH MC',  caseDiameterMm: 41 },

  // ============== BALLON BLEU ==============
  { id: 'cartier-ballon-bleu-w6920033',      brandId: 'cartier', collection: 'Ballon Bleu de Cartier',audience: 'men',     name: 'Ballon Bleu 42 (steel, automatic)',                   reference: 'W6920033',  yearStart: 2007, caliber: 'Cal. 049 MC',      caseDiameterMm: 42 },
  { id: 'cartier-ballon-bleu-w6920046',      brandId: 'cartier', collection: 'Ballon Bleu de Cartier',audience: 'unisex',  name: 'Ballon Bleu 36 (steel, automatic)',                   reference: 'W6920046',  yearStart: 2007, caliber: 'Cal. 049 MC',      caseDiameterMm: 36 },
  { id: 'cartier-ballon-bleu-skel-wjbb0049', brandId: 'cartier', collection: 'Ballon Bleu de Cartier',audience: 'men',     name: 'Ballon Bleu Skeleton Flying Tourbillon 46',           reference: 'WJBB0049',  yearStart: 2014, caliber: 'Cal. 9611 MC',     caseDiameterMm: 46 },

  // ============== CALIBRE DE CARTIER (discontinued) ==============
  { id: 'cartier-calibre-w7100015',          brandId: 'cartier', collection: 'Calibre de Cartier',    audience: 'men',     name: 'Calibre de Cartier 42 (steel, automatic)',            reference: 'W7100015',  yearStart: 2010, yearEnd: 2018, caliber: 'Cal. 1904 MC',  caseDiameterMm: 42 },
  { id: 'cartier-calibre-diver-wsca0006',    brandId: 'cartier', collection: 'Calibre de Cartier',    audience: 'men',     name: 'Calibre de Cartier Diver (steel)',                    reference: 'WSCA0006',  yearStart: 2014, yearEnd: 2018, caliber: 'Cal. 1904 MC',  caseDiameterMm: 42 },

  // ============== DRIVE (discontinued) ==============
  { id: 'cartier-drive-wsnm0014',            brandId: 'cartier', collection: 'Drive de Cartier',      audience: 'men',     name: 'Drive de Cartier (steel, automatic)',                 reference: 'WSNM0014',  yearStart: 2016, yearEnd: 2021, caliber: 'Cal. 1847 MC',  caseDiameterMm: 40 },

  // ============== TANK FRANÇAISE (2023 relaunch with XL automatic) ==============
  { id: 'cartier-tank-francaise-wgta0123',   brandId: 'cartier', collection: 'Tank Française',        audience: 'men',     name: 'Tank Française XL (steel, automatic)',                reference: 'WGTA0123',  yearStart: 2023, caliber: 'Cal. 1847 MC',     caseDiameterMm: 36.7 },
  { id: 'cartier-tank-francaise-wgta0129',   brandId: 'cartier', collection: 'Tank Française',        audience: 'men',     name: 'Tank Française XL (rose gold, automatic)',            reference: 'WGTA0129',  yearStart: 2023, caliber: 'Cal. 1847 MC',     caseDiameterMm: 36.7 },

  // ============== TANK ANGLAISE ==============
  { id: 'cartier-tank-anglaise-w5310003',    brandId: 'cartier', collection: 'Tank Anglaise',         audience: 'men',     name: 'Tank Anglaise XL (steel, automatic)',                 reference: 'W5310003',  yearStart: 2012, caliber: 'Cal. 049 MC',      caseDiameterMm: 39.2 },

  // ============== TANK SOLO ==============
  { id: 'cartier-tank-solo-w5200027',        brandId: 'cartier', collection: 'Tank Solo',             audience: 'men',     name: 'Tank Solo XL (steel, automatic)',                     reference: 'W5200027',  yearStart: 2014, yearEnd: 2022, caliber: 'Cal. 049 MC',  caseDiameterMm: 31 },

  // ============== TANK CINTRÉE PRIVÉ ==============
  { id: 'cartier-tank-cintree-prive-whta0012', brandId: 'cartier', collection: 'Cartier Privé',       audience: 'men',     name: 'Tank Cintrée Privé (yellow gold, hand-wound)',        reference: 'WHTA0012',  yearStart: 2021, caliber: 'Cal. 9780 MC',     caseDiameterMm: 46 },

  // ============== CLÉ DE CARTIER (discontinued) ==============
  { id: 'cartier-cle-wscl0007',              brandId: 'cartier', collection: 'Clé de Cartier',        audience: 'men',     name: 'Clé de Cartier 40 (steel, automatic)',                reference: 'WSCL0007',  yearStart: 2015, yearEnd: 2020, caliber: 'Cal. 1847 MC', caseDiameterMm: 40 },
  { id: 'cartier-cle-wjcl0010',              brandId: 'cartier', collection: 'Clé de Cartier',        audience: 'men',     name: 'Clé de Cartier 40 (rose gold, automatic)',            reference: 'WJCL0010',  yearStart: 2015, yearEnd: 2020, caliber: 'Cal. 1847 MC', caseDiameterMm: 40 },

  // ============== RONDE DE CARTIER ==============
  { id: 'cartier-ronde-solo-w6701005',       brandId: 'cartier', collection: 'Ronde de Cartier',      audience: 'unisex',  name: 'Ronde Solo de Cartier 36 (steel, automatic)',         reference: 'W6701005',  yearStart: 2014, caliber: 'Cal. 049 MC',      caseDiameterMm: 36 },
  { id: 'cartier-ronde-louis-w6800251',      brandId: 'cartier', collection: 'Ronde de Cartier',      audience: 'men',     name: 'Ronde Louis Cartier (yellow gold, hand-wound)',       reference: 'W6800251',  yearStart: 2014, caliber: 'Cal. 430 MC',      caseDiameterMm: 36 },

  // ============== BAIGNOIRE ALLONGÉE ==============
  { id: 'cartier-baignoire-allongee-wb520006', brandId: 'cartier', collection: 'Baignoire',           audience: 'women',   name: 'Baignoire Allongée (rose gold, hand-wound)',          reference: 'WB520006',  yearStart: 2010, caliber: 'Cal. 430 MC',      caseDiameterMm: 31 },

  // ============== COUSSIN DE CARTIER (2022 relaunch) ==============
  { id: 'cartier-coussin-wcco0002',          brandId: 'cartier', collection: 'Coussin de Cartier',    audience: 'men',     name: 'Coussin de Cartier Maxi (rose gold, automatic)',      reference: 'WCCO0002',  yearStart: 2022, caliber: 'Cal. 1847 MC',     caseDiameterMm: 43.5 },
  { id: 'cartier-coussin-wcco0007',          brandId: 'cartier', collection: 'Coussin de Cartier',    audience: 'unisex',  name: 'Coussin de Cartier (steel, automatic)',               reference: 'WCCO0007',  yearStart: 2022, caliber: 'Cal. 1847 MC',     caseDiameterMm: 37 },

  // ============== PANTHÈRE DE CARTIER MÉCANIQUE ==============
  { id: 'cartier-panthere-mecanique-wspn0005', brandId: 'cartier', collection: 'Panthère de Cartier', audience: 'women',   name: 'Panthère de Cartier Mécanique (steel, automatic)',    reference: 'WSPN0005',  yearStart: 2024, caliber: 'Cal. 049 MC',      caseDiameterMm: 27 },
];

