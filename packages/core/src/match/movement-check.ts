import type { MovementCheck } from '../types/index';
import { getMovementForModelAcrossBrands } from '../data/brands';

/** Normalizes a user-provided caliber string by stripping a leading
 *  "Cal."/"Caliber"/"Calibre" label and all whitespace. */
function normalizeCaliber(raw: string): string {
  return raw
    .trim()
    .replace(/^(cal(\.|iber|ibre)?)\s*/i, '')
    .replace(/\s+/g, '');
}

/**
 * Cross-checks a watch's declared model against the caliber the owner reports
 * having observed on the movement. A mismatch is a strong authenticity flag
 * because the caliber number is engraved on the movement itself — replicas
 * frequently miss this detail or use a generic ETA-based caliber.
 */
export function checkMovementCaliber(
  modelId: string,
  observedCaliberRaw: string | undefined,
): MovementCheck {
  const expected = getMovementForModelAcrossBrands(modelId);

  if (!expected) {
    return {
      status: 'unknown-model',
      ...(observedCaliberRaw && observedCaliberRaw.trim()
        ? { observedCaliber: observedCaliberRaw.trim() }
        : {}),
      note: 'No reference caliber found for this model. Add it to the catalog before checking.',
    };
  }

  const expectedCaliber = expected.caliber;

  if (!observedCaliberRaw || !observedCaliberRaw.trim()) {
    return {
      status: 'not-provided',
      expectedCaliber,
      expected,
      note: `Expected caliber ${expectedCaliber}. Open the case-back and report the caliber number engraved on the movement to confirm.`,
    };
  }

  const observed = normalizeCaliber(observedCaliberRaw);
  if (observed === expectedCaliber) {
    return {
      status: 'match',
      expectedCaliber,
      observedCaliber: observedCaliberRaw.trim(),
      expected,
      note: `Caliber matches expected ${expectedCaliber} for this reference.`,
    };
  }

  return {
    status: 'mismatch',
    expectedCaliber,
    observedCaliber: observedCaliberRaw.trim(),
    expected,
    note: `Movement caliber mismatch. Expected ${expectedCaliber}, observed ${observedCaliberRaw.trim()}. This is a strong red flag — verify the engraving carefully.`,
  };
}
