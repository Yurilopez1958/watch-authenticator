import type { Brand, Material, Model, Movement, ReferenceProfile } from '../types/index';

import { ROLEX_BRAND, ROLEX_MODELS } from './rolex-catalog';
import { ROLEX_MATERIALS, ROLEX_REFERENCE_PROFILES } from './rolex-materials';
import { ROLEX_MOVEMENTS, ROLEX_MODEL_TO_CALIBER } from './rolex-movements';

import { PATEK_BRAND, PATEK_MODELS } from './patek-catalog';
import { PATEK_MOVEMENTS, PATEK_MODEL_TO_CALIBER } from './patek-movements';

import { AUDEMARS_BRAND, AUDEMARS_MODELS } from './audemars-catalog';
import { AUDEMARS_MOVEMENTS, AUDEMARS_MODEL_TO_CALIBER } from './audemars-movements';

import { OMEGA_BRAND, OMEGA_MODELS } from './omega-catalog';
import { OMEGA_MOVEMENTS, OMEGA_MODEL_TO_CALIBER } from './omega-movements';
import { OMEGA_MATERIALS, OMEGA_REFERENCE_PROFILES } from './omega-materials';

import { CARTIER_BRAND, CARTIER_MODELS } from './cartier-catalog';
import { CARTIER_MOVEMENTS, CARTIER_MODEL_TO_CALIBER } from './cartier-movements';

import { COMMON_MATERIALS, COMMON_REFERENCE_PROFILES } from './common-materials';

/** All brands supported by the app. */
export const ALL_BRANDS: readonly Brand[] = [ROLEX_BRAND, PATEK_BRAND, AUDEMARS_BRAND, OMEGA_BRAND, CARTIER_BRAND];

/** Combined catalog of every model across brands. */
export const ALL_MODELS: readonly Model[] = [
  ...ROLEX_MODELS,
  ...PATEK_MODELS,
  ...AUDEMARS_MODELS,
  ...OMEGA_MODELS,
  ...CARTIER_MODELS,
];

/** Every caliber known to the app. */
export const ALL_MOVEMENTS: readonly Movement[] = [
  ...ROLEX_MOVEMENTS,
  ...PATEK_MOVEMENTS,
  ...AUDEMARS_MOVEMENTS,
  ...OMEGA_MOVEMENTS,
  ...CARTIER_MOVEMENTS,
];

/** Every material across brand-specific and common catalogues. */
export const ALL_MATERIALS: readonly Material[] = [
  ...ROLEX_MATERIALS,
  ...OMEGA_MATERIALS,
  ...COMMON_MATERIALS,
];

/** Every reference profile across brand-specific and common catalogues. */
export const ALL_REFERENCE_PROFILES: readonly ReferenceProfile[] = [
  ...ROLEX_REFERENCE_PROFILES,
  ...OMEGA_REFERENCE_PROFILES,
  ...COMMON_REFERENCE_PROFILES,
];

/** Model id → caliber number lookup spanning all brands. */
export const ALL_MODEL_TO_CALIBER: Readonly<Record<string, string>> = {
  ...ROLEX_MODEL_TO_CALIBER,
  ...PATEK_MODEL_TO_CALIBER,
  ...AUDEMARS_MODEL_TO_CALIBER,
  ...OMEGA_MODEL_TO_CALIBER,
  ...CARTIER_MODEL_TO_CALIBER,
};

/** Returns the brand record for a brand id. */
export function getBrand(brandId: string): Brand | undefined {
  return ALL_BRANDS.find((b) => b.id === brandId);
}

/** Returns the catalog of models filtered by brand. */
export function getModelsByBrand(brandId: string): readonly Model[] {
  return ALL_MODELS.filter((m) => m.brandId === brandId);
}

/** Returns reference profiles applicable to a brand (brand-specific + common fallback). */
export function getReferenceProfilesForBrand(brandId: string): readonly ReferenceProfile[] {
  return ALL_REFERENCE_PROFILES.filter(
    (p) => p.brandId === brandId || p.brandId === 'common',
  );
}

/**
 * Returns the Movement entry for a given model id from ANY brand. The model id
 * carries enough context to identify the right brand (its prefix), so the
 * caller does not need to specify it.
 */
export function getMovementForModelAcrossBrands(modelId: string): Movement | undefined {
  const caliber = ALL_MODEL_TO_CALIBER[modelId];
  if (!caliber) return undefined;
  return ALL_MOVEMENTS.find((m) => m.caliber === caliber);
}
