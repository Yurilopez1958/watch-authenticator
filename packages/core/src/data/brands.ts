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

/** Maps a reference profile to the material "kind" it describes (steel/gold/platinum/…). */
function profileKind(p: ReferenceProfile): string | undefined {
  return ALL_MATERIALS.find((m) => m.id === p.materialId)?.kind;
}

/**
 * Returns reference profiles applicable to a brand, optionally restricted to a
 * given year of manufacture.
 *
 * A brand uses its OWN profiles, plus the generic `common` profiles **only for
 * material kinds it does not already cover itself in that era**. This prevents
 * the generic fallback from masking a brand-specific signature: e.g. Rolex has
 * its own steel profiles (904L Oystersteel, and 316L valid only up to 2003), so
 * a modern Rolex measured as generic 316L must NOT pass via the always-valid
 * `common-316l` profile — it is compared only against Rolex's own steel
 * references and flagged as a mismatch.
 *
 * The exclusion is **year-aware**: a generic profile of kind K is suppressed
 * only when the brand has an OWN profile of kind K valid in the selected year.
 * This is essential for proprietary alloys introduced recently — e.g. Omega's
 * Sedna/Moonshine/Canopus gold (2013+). Without the year guard, a genuine
 * pre-2013 gold Omega would have its generic gold reference stripped and be
 * matched against the wrong modern alloy, then falsely flagged as fake. With it,
 * a vintage gold Omega still gets the generic 18k gold reference.
 *
 * When `year` is omitted the function returns every applicable profile (no year
 * filtering), preserving the original behaviour for callers that filter later.
 */
export function getReferenceProfilesForBrand(
  brandId: string,
  year?: number,
): readonly ReferenceProfile[] {
  const validAtYear = (p: ReferenceProfile): boolean =>
    year == null || (year >= p.yearStart && (p.yearEnd == null || year <= p.yearEnd));

  const own = ALL_REFERENCE_PROFILES.filter((p) => p.brandId === brandId && validAtYear(p));

  // Material kinds the brand already covers with its OWN profiles in this era.
  const ownKinds = new Set<string>();
  for (const p of own) {
    const k = profileKind(p);
    if (k) ownKinds.add(k);
  }

  const common = ALL_REFERENCE_PROFILES.filter((p) => {
    if (p.brandId !== 'common' || !validAtYear(p)) return false;
    const k = profileKind(p);
    // Skip the generic profile only if the brand covers this kind itself this year.
    return k ? !ownKinds.has(k) : true;
  });
  return [...own, ...common];
}

/** Per-brand movement lists, used to disambiguate calibers that two brands
 *  might share (e.g. generic ETA numbers). Searching the model's own brand
 *  first prevents returning another brand's movement. */
const MOVEMENTS_BY_BRAND: Readonly<Record<string, readonly Movement[]>> = {
  rolex: ROLEX_MOVEMENTS,
  'patek-philippe': PATEK_MOVEMENTS,
  'audemars-piguet': AUDEMARS_MOVEMENTS,
  omega: OMEGA_MOVEMENTS,
  cartier: CARTIER_MOVEMENTS,
};

/**
 * Returns the Movement entry for a given model id. Resolves the caliber from the
 * model, then searches that model's OWN brand movements first (so two brands
 * sharing a caliber number never cross-match), falling back to a global search.
 */
export function getMovementForModelAcrossBrands(modelId: string): Movement | undefined {
  const caliber = ALL_MODEL_TO_CALIBER[modelId];
  if (!caliber) return undefined;
  const model = ALL_MODELS.find((m) => m.id === modelId);
  const brandMovements = model ? MOVEMENTS_BY_BRAND[model.brandId] : undefined;
  return (
    brandMovements?.find((m) => m.caliber === caliber) ??
    ALL_MOVEMENTS.find((m) => m.caliber === caliber)
  );
}
