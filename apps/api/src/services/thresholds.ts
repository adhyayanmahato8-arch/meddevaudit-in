/**
 * The verdict decision rule for the no-API-key matcher, isolated so it can be
 * swept and calibrated by the evaluation harness (packages/eval) without
 * touching retrieval code.
 *
 * Inputs per clause:
 *   coverage   — fraction of the clause's keyword groups found in the dossier
 *                (the deterministic rules-as-code signal), 0..1
 *   retrieval  — fused hybrid retrieval score of the best passage, 0..1
 *
 * Rule:
 *   PASS               coverage >= covPass  AND retrieval >= tauPass
 *   MINOR_IMPROVEMENT  otherwise, if coverage > 0 OR retrieval >= tauSoften
 *   REJECT             otherwise
 *
 * The asymmetry is deliberate: retrieval alone can raise a REJECT to
 * MINOR_IMPROVEMENT (the "softening" rule) but can never produce a PASS
 * without lexical coverage. In compliance screening the costly error is the
 * missed non-compliance, so the weaker signal is only permitted to add doubt.
 */

export type ThresholdParams = {
  /** Minimum keyword-group coverage for PASS. */
  covPass: number;
  /** Minimum retrieval score for PASS (corroboration). */
  tauPass: number;
  /** Retrieval score above which a lexically-absent clause is MINOR rather than REJECT. */
  tauSoften: number;
  /** Retrieval score above which the nearest passage is shown as context. */
  tauContext: number;
};

/**
 * PRE-CALIBRATION defaults. These carry forward the values measured against
 * the two sample dossiers (see git history) and are replaced by the
 * evaluation harness once the annotated fixture set exists. Treat them as
 * provisional until reports/evaluation.md says otherwise.
 */
export const DEFAULT_THRESHOLDS: ThresholdParams = {
  covPass: 1.0,
  tauPass: 0.0,
  tauSoften: 0.45,
  tauContext: 0.2,
};

export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";

export function decide(coverage: number, retrieval: number, params: ThresholdParams = DEFAULT_THRESHOLDS): Verdict {
  if (coverage >= params.covPass && retrieval >= params.tauPass) return "PASS";
  if (coverage > 0 || retrieval >= params.tauSoften) return "MINOR_IMPROVEMENT";
  return "REJECT";
}

/**
 * Calibrated thresholds are written here by `npm run eval` as JSON; if the file
 * is absent the defaults above apply. Kept as a side file rather than a code
 * edit so calibration is reproducible and reviewable.
 */
export function loadThresholds(): ThresholdParams {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const file = path.resolve(__dirname, "..", "..", "..", "..", "reports", "thresholds.json");
    if (!fs.existsSync(file)) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}
