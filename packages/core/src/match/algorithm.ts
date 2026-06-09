import type {
  ElementMatch,
  ElementReading,
  ElementSpec,
  ElementSymbol,
  MatchResult,
  MatchVerdict,
  ReferenceProfile,
  XRFMeasurement,
} from '../types/index';

/** Tolerancia por defecto si no se define en el ElementSpec. */
const DEFAULT_TOLERANCE_ABS = 0.5;

const VERDICT_THRESHOLDS = {
  authentic: 85,
  inconclusive: 60,
} as const;

function evaluateElement(spec: ElementSpec, measuredPct: number): ElementMatch {
  const tolerance = spec.toleranceAbs ?? DEFAULT_TOLERANCE_ABS;
  const minWithTol = spec.minPct - tolerance;
  const maxWithTol = spec.maxPct + tolerance;

  let status: ElementMatch['status'];
  let deviationPct = 0;

  if (measuredPct >= spec.minPct && measuredPct <= spec.maxPct) {
    status = 'in-range';
  } else if (measuredPct >= minWithTol && measuredPct <= maxWithTol) {
    status = 'borderline';
    deviationPct =
      measuredPct < spec.minPct ? spec.minPct - measuredPct : measuredPct - spec.maxPct;
  } else {
    status = 'out-of-range';
    deviationPct =
      measuredPct < spec.minPct ? spec.minPct - measuredPct : measuredPct - spec.maxPct;
  }

  return {
    element: spec.element,
    measured: measuredPct,
    expectedMin: spec.minPct,
    expectedMax: spec.maxPct,
    status,
    deviationPct,
    isCritical: spec.isCritical ?? false,
  };
}

function readingsByElement(readings: ElementReading[]): Map<ElementSymbol, number> {
  const map = new Map<ElementSymbol, number>();
  for (const r of readings) {
    map.set(r.element, r.pct);
  }
  return map;
}

function decideVerdict(score: number, hasCriticalFail: boolean): MatchVerdict {
  if (hasCriticalFail) return 'likely-fake';
  if (score >= VERDICT_THRESHOLDS.authentic) return 'likely-authentic';
  if (score >= VERDICT_THRESHOLDS.inconclusive) return 'inconclusive';
  return 'likely-fake';
}

/**
 * Compares an XRF measurement against a reference profile and returns the score,
 * verdict and relevant flags in English.
 *
 * The score starts at 100 and subtracts points for elements out of range, weighted
 * by their deviation relative to the expected range. A critical element out of range
 * forces the verdict to "likely-fake" regardless of the score.
 */
export function matchMeasurementToProfile(
  measurement: XRFMeasurement,
  profile: ReferenceProfile,
): MatchResult {
  const measured = readingsByElement(measurement.readings);
  const elementMatches: ElementMatch[] = [];
  const flags: string[] = [];

  let score = 100;
  let hasCriticalFail = false;
  let evaluatedCount = 0;

  for (const spec of profile.elements) {
    const value = measured.get(spec.element);
    if (value === undefined) {
      if (spec.isCritical) {
        flags.push(
          `Missing reading for critical element ${spec.element}. Authenticity cannot be confirmed without it.`,
        );
        score -= 20;
      } else {
        flags.push(`No reading for element ${spec.element} in the measurement.`);
        score -= 5;
      }
      continue;
    }

    const match = evaluateElement(spec, value);
    elementMatches.push(match);
    evaluatedCount++;

    if (match.status === 'out-of-range') {
      const rangeWidth = spec.maxPct - spec.minPct || 1;
      const penalty = Math.min(40, 15 + (match.deviationPct / rangeWidth) * 30);
      score -= penalty;
      if (match.isCritical) {
        hasCriticalFail = true;
        flags.push(
          `Critical element ${spec.element} out of range: ${match.measured.toFixed(2)}% (expected ${spec.minPct}–${spec.maxPct}%).`,
        );
      } else {
        flags.push(
          `${spec.element} out of range: ${match.measured.toFixed(2)}% (expected ${spec.minPct}–${spec.maxPct}%).`,
        );
      }
    } else if (match.status === 'borderline') {
      score -= 5;
      flags.push(
        `${spec.element} at the edge of the acceptable range: ${match.measured.toFixed(2)}% (expected ${spec.minPct}–${spec.maxPct}%).`,
      );
    }
  }

  const extras: ElementSymbol[] = [];
  const expectedSet = new Set(profile.elements.map((e) => e.element));
  for (const r of measurement.readings) {
    if (!expectedSet.has(r.element) && r.pct >= 0.5) {
      extras.push(r.element);
    }
  }
  if (extras.length > 0) {
    flags.push(
      `Unexpected elements detected (≥0.5%): ${extras.join(', ')}. Possible alloy mismatch with the declared one.`,
    );
    score -= Math.min(15, extras.length * 5);
  }

  const noEvidence = evaluatedCount === 0;
  if (noEvidence) {
    flags.push('Could not evaluate any element from the profile. Check the measurement.');
  }

  const overallScore = Math.max(0, Math.min(100, Math.round(score)));
  // Never assert authenticity without having evaluated any element of the profile.
  const verdict = noEvidence ? 'inconclusive' : decideVerdict(overallScore, hasCriticalFail);

  return {
    profileId: profile.id,
    materialName: profile.materialId,
    overallScore,
    verdict,
    elementMatches,
    flags,
  };
}

/**
 * Compares a measurement against all candidate profiles (typically all the profiles
 * valid for the watch's model + year) and returns the best result. Useful when the
 * declared material is ambiguous (e.g. steel but unclear whether 316L or 904L).
 */
export function bestProfileMatch(
  measurement: XRFMeasurement,
  candidateProfiles: readonly ReferenceProfile[],
): MatchResult | null {
  if (candidateProfiles.length === 0) return null;

  // --- Composition-level pre-checks --------------------------------------
  // Handle two real-world XRF realities that per-profile scoring explains
  // badly (surfaced during live testing with a precious-metals analyzer):
  const m = readingsByElement(measurement.readings);
  const get = (e: ElementSymbol) => m.get(e) ?? 0;
  const au = get('Au');
  const steelBase = get('Fe') + get('Cr') + get('Ni');
  const mo = get('Mo');

  // (A) GOLD PLATING: some gold, but far below any solid karat, sitting over a
  //     base-metal (steel) substrate the beam reads through. Brands that use
  //     only SOLID gold (Rolex, Patek, AP, etc.) → not genuine. This gives the
  //     correct, plain explanation instead of "closest profile: platinum".
  if (au >= 5 && au < 70 && steelBase >= 8) {
    return {
      profileId: 'detector-plating',
      materialName: 'gold-plated (not solid)',
      overallScore: Math.max(0, Math.min(35, Math.round(au * 0.4))),
      verdict: 'likely-fake',
      elementMatches: [],
      flags: [
        `Gold-plating signature: Au ${au.toFixed(1)}% is far below solid 18k (~75%), and a base-metal (steel) substrate shows through (Fe+Cr+Ni ~${steelBase.toFixed(0)}%). This is GOLD PLATING over steel, not solid gold. Brands that use only solid gold (e.g. Rolex) → likely not genuine.`,
      ],
    };
  }

  // (B) STEEL measured WITHOUT molybdenum: Mo is the key discriminator between
  //     316L / 904L and cheaper non-Mo steels. If it reads ~0 (commonly because
  //     the XRF was in a precious-metals-only mode) the grade cannot be
  //     confirmed → say so, rather than wrongly condemning a possibly-genuine
  //     piece by matching it to the wrong steel grade.
  if (steelBase >= 30 && au < 5 && mo < 0.3) {
    return {
      profileId: 'detector-steel-no-mo',
      materialName: 'stainless steel (grade unconfirmed)',
      overallScore: 55,
      verdict: 'inconclusive',
      elementMatches: [],
      flags: [
        `Stainless steel detected (Fe ${get('Fe').toFixed(0)}%, Cr ${get('Cr').toFixed(0)}%, Ni ${get('Ni').toFixed(0)}%) but molybdenum (Mo) reads ~0. Mo is essential to tell 316L/904L from a cheaper non-Mo steel — if the XRF was in precious-metals mode, re-measure in alloy / general-metals mode. Grade cannot be confirmed yet.`,
      ],
    };
  }

  let best: MatchResult | null = null;
  for (const profile of candidateProfiles) {
    const result = matchMeasurementToProfile(measurement, profile);
    if (best === null) {
      best = result;
      continue;
    }
    // A profile where NONE of its elements were present in the measurement (e.g.
    // matching a steel reading against a platinum profile) carries no real
    // evidence — its score comes only from "missing element" penalties. It must
    // never be chosen as the closest profile over one we could actually evaluate,
    // even if its score happens to be higher. Otherwise the verdict explains the
    // failure against the wrong material (e.g. "missing Pt/Ru" on a steel watch).
    const bestHasEvidence = best.elementMatches.length > 0;
    const resultHasEvidence = result.elementMatches.length > 0;
    if (resultHasEvidence !== bestHasEvidence) {
      if (resultHasEvidence) best = result;
      continue;
    }
    if (result.overallScore > best.overallScore) {
      best = result;
    }
  }
  return best;
}
