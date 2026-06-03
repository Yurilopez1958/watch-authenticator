export { ROLEX_BRAND, ROLEX_MODELS } from './rolex-catalog';
export { ROLEX_MATERIALS, ROLEX_REFERENCE_PROFILES } from './rolex-materials';
export {
  ROLEX_AUTH_CHECKPOINTS,
  ROLEX_MOVEMENT_CHECKPOINTS,
  getMovementCheckpoints,
} from './rolex-auth-checkpoints';
export type { AuthCheckpoint } from './rolex-auth-checkpoints';
export { getBrandCheckpoints, BRAND_CHECKPOINTS } from './brand-auth-checkpoints';
export {
  ROLEX_MOVEMENTS,
  ROLEX_MODEL_TO_CALIBER,
  getMovementForModel,
} from './rolex-movements';

export { PATEK_BRAND, PATEK_MODELS } from './patek-catalog';
export { PATEK_MOVEMENTS, PATEK_MODEL_TO_CALIBER } from './patek-movements';

export { AUDEMARS_BRAND, AUDEMARS_MODELS } from './audemars-catalog';
export { AUDEMARS_MOVEMENTS, AUDEMARS_MODEL_TO_CALIBER } from './audemars-movements';

export { OMEGA_BRAND, OMEGA_MODELS } from './omega-catalog';
export { OMEGA_MOVEMENTS, OMEGA_MODEL_TO_CALIBER } from './omega-movements';
export { OMEGA_MATERIALS, OMEGA_REFERENCE_PROFILES } from './omega-materials';

export { CARTIER_BRAND, CARTIER_MODELS } from './cartier-catalog';
export { CARTIER_MOVEMENTS, CARTIER_MODEL_TO_CALIBER } from './cartier-movements';

export { COMMON_MATERIALS, COMMON_REFERENCE_PROFILES } from './common-materials';

export {
  ALL_BRANDS,
  ALL_MODELS,
  ALL_MOVEMENTS,
  ALL_MATERIALS,
  ALL_REFERENCE_PROFILES,
  ALL_MODEL_TO_CALIBER,
  getBrand,
  getModelsByBrand,
  getReferenceProfilesForBrand,
  getMovementForModelAcrossBrands,
} from './brands';
