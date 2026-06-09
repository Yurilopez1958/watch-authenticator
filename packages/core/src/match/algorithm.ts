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
  const pt = get('Pt');
  const ru = get('Ru');
  const steelBase = get('Fe') + get('Cr') + get('Ni');
  const mo = get('Mo');

  // (A) GOLD PLATING: some gold, but far below any solid karat, sitting over a
  //     base-metal (steel) substrate the beam reads through. Brands that use
  //     only SOLID gold (Rolex, Patek, AP, etc.) → not genuine. This gives the
  //     correct, plain explanation instead of "closest profile: platinum".
  if (au >= 5 && au < 70 && steelBase >= 8) {
    return {
      profileId: 'detector-gold-over-steel',
      materialName: 'gold over steel (plating or beam overlap)',
      overallScore: 50,
      verdict: 'inconclusive',
      elementMatches: [],
      flags: [
        `Gold + steel together: Au ${au.toFixed(1)}% with a steel signature (Fe+Cr+Ni ~${steelBase.toFixed(0)}%). XRF alone cannot separate two cases: (1) GOLD PLATING over steel (fake), or (2) a SOLID gold part — e.g. a narrow fluted or gem-set bezel — where the beam also caught the steel case behind/around it. Decisive test: re-measure with the beam FULLY on the gold, on the flattest, widest spot. If Au climbs toward ~75% (18k) it's solid gold (genuine); if it stays low, it's likely plating.`,
      ],
    };
  }

  // (B) STEEL measured WITHOUT molybdenum: Mo is the key discriminator between
  //     316L / 904L and cheaper non-Mo steels. If it reads ~0 (commonly because
  //     the XRF was in a precious-metals-only mode) the grade cannot be
  //     confirmed → say so, rather than wrongly condemning a possibly-genuine
  //     piece by matching it to the wrong steel grade.
  if (steelBase >= 30 && au < 5 && mo < 0.3) {
    const cr = get('Cr');
    const ni = get('Ni');
    // 904L Oystersteel has a DISTINCTIVE high-nickel super-austenitic signature
    // (Cr ~19-23%, Ni ~23-28%) that counterfeits essentially never replicate —
    // it's expensive and hard to machine, so fakes use 316L (Ni ~12%) or cheaper
    // steel. A clear Cr/Ni match is therefore a strong authenticity indicator
    // even when Mo can't be read on this instrument.
    // Ni >= ~21 is the decisive marker (316L is ~10-14%); this precious-mode gun
    // can over-read Ni (seen 28-32% on a genuine 904L), so the upper bound is
    // generous while staying well clear of 316L.
    if (cr >= 17 && cr <= 25 && ni >= 21 && ni <= 35) {
      return {
        profileId: 'detector-904l-signature',
        materialName: 'rolex-904l-oystersteel',
        overallScore: 86,
        verdict: 'likely-authentic',
        elementMatches: [],
        flags: [
          `904L Oystersteel signature: Cr ${cr.toFixed(1)}%, Ni ${ni.toFixed(1)}% — the distinctive high-nickel super-austenitic steel Rolex uses, which counterfeits essentially never replicate (fakes use 316L, Ni ~12%). Molybdenum (Mo) wasn't measured by this precious-metals-mode instrument, but the Cr/Ni match is strong. For a full confirmation, read Mo in alloy mode (expect ~4-5%).`,
        ],
      };
    }
    return {
      profileId: 'detector-steel-no-mo',
      materialName: 'stainless steel (grade unconfirmed)',
      overallScore: 55,
      verdict: 'inconclusive',
      elementMatches: [],
      flags: [
        `Stainless steel detected (Fe ${get('Fe').toFixed(0)}%, Cr ${cr.toFixed(0)}%, Ni ${ni.toFixed(0)}%) but molybdenum (Mo) reads ~0 and the Cr/Ni don't clearly match Rolex 904L. Mo is essential to tell 316L/904L from a cheaper non-Mo steel — if the XRF was in precious-metals mode, re-measure in alloy / general-metals mode. Grade cannot be confirmed yet.`,
      ],
    };
  }

  // (C) PLATINUM on a precious-metals-only analyzer: Pt clearly dominates but
  //     reads well below 950 because the gun mis-splits the platinum X-ray peak
  //     into its spectral neighbours — Ir (9.17), Ga (9.25) and Au (9.71 keV)
  //     all land on the Pt lines (9.44). Do NOT condemn a likely PtRu950 (e.g.
  //     Rolex) as fake — flag it as unconfirmable on this instrument. (A clean
  //     ~95% Pt reading skips this and is matched normally.)
  if (pt >= 60 && pt < 94 && steelBase < 8) {
    return {
      profileId: 'detector-platinum-unconfirmed',
      materialName: 'platinum (PtRu, purity unconfirmed)',
      overallScore: 55,
      verdict: 'inconclusive',
      elementMatches: [],
      flags: [
        `Platinum detected (Pt ${pt.toFixed(0)}%${ru >= 1 ? `, Ru ${ru.toFixed(1)}%` : ''}). A precious-metals-only analyzer under-reports Pt by splitting its X-ray peak into neighbours (Ir/Au/Ga land right on the Pt lines), so exact purity can't be confirmed here. This is consistent with a PtRu alloy such as Rolex 950 platinum — not evidence of a fake. Re-verify against a KNOWN-genuine platinum on the same instrument, or a lab.`,
      ],
    };
  }

  // (D) SOLID GOLD that reads below 18k on a precious-metals-only gun: the gun
  //     under-reports Au (it splits the gold peak into phantom neighbours such as
  //     Ge/Ga), so a genuine 18k can read ~16k. With NO base metal (not plated),
  //     don't condemn it — flag the karat as approximate and note the alloy
  //     pattern (Everose = high Cu + Pt; the Pt is Everose's hard-to-fake tell).
  if (au >= 55 && au < 74.5 && steelBase < 8) {
    const cu = get('Cu');
    // Everose = solid gold + high copper + PLATINUM. The Pt is Rolex's patented,
    // hard-to-fake Everose marker (a counterfeit rose gold has no platinum), so a
    // clear Everose pattern is a strong authenticity signal — same logic as the
    // 904L high-Ni steel signature.
    if (pt >= 1.5 && cu >= 14) {
      return {
        profileId: 'detector-everose-signature',
        materialName: 'rolex-18k-everose-gold',
        overallScore: 85,
        verdict: 'likely-authentic',
        elementMatches: [],
        flags: [
          `Everose signature: solid gold (Au ${au.toFixed(0)}%, no base metal) with high copper (Cu ${cu.toFixed(0)}%) and platinum (Pt ${pt.toFixed(1)}%) — the patented Rolex Everose alloy, whose platinum is its hard-to-fake marker (a counterfeit rose gold has no Pt). This precious-mode gun under-reads gold, so the karat reads ~16k instead of 18k — the exact figure is approximate, but the alloy is consistent with genuine Everose.`,
        ],
      };
    }
    return {
      profileId: 'detector-gold-karat-approx',
      materialName: 'solid gold (karat approx)',
      overallScore: 60,
      verdict: 'inconclusive',
      elementMatches: [],
      flags: [
        `Solid gold (Au ${au.toFixed(0)}%, no base metal — not plated). This precious-metals-mode gun under-reads gold (it splits the gold peak into phantom neighbours like Ge), so a genuine 18k can read ~16k; the exact karat can't be confirmed here. Re-verify exact karat against a known-genuine reference or a lab.`,
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
