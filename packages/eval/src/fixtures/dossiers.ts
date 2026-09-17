import type { WordingRelationship } from "./types";

/**
 * Whole-dossier fixtures are assembled from the passage pool rather than
 * hand-written, so every clause-level expectation inside a dossier is exactly
 * one annotated record and the overall expectation follows from the app's own
 * result rule. `default` is the relationship used for every clause of the
 * device unless `overrides` names a different one; `absent` lists clauses that
 * get NO passage at all (expected REJECT — the "missing document" case).
 */
export type DossierSpec = {
  name: string;
  deviceSlug: string;
  description: string;
  default: WordingRelationship;
  overrides?: Record<string, WordingRelationship>;
  absent?: string[];
};

export const DOSSIERS: DossierSpec[] = [
  {
    name: "pulse-oximeter-literal-complete",
    deviceSlug: "pulse-oximeter",
    description: "Every clause satisfied in the clause's own vocabulary. Baseline: should PASS on any matcher.",
    default: "SATISFIED_LITERAL",
  },
  {
    name: "pulse-oximeter-paraphrase-complete",
    deviceSlug: "pulse-oximeter",
    description:
      "Every clause genuinely satisfied, but in deliberately disjoint wording. The recall test for paraphrase: a purely lexical matcher will under-call this dossier.",
    default: "SATISFIED_PARAPHRASE",
  },
  {
    name: "bp-monitor-distractor-heavy",
    deviceSlug: "bp-monitor",
    description:
      "Every clause answered with a hard distractor — same topic and vocabulary, requirement not met. The precision test: a matcher that trusts keywords will over-call PASS here.",
    default: "NOT_SATISFIED_DISTRACTOR",
  },
  {
    name: "thermometer-mixed-minor",
    deviceSlug: "digital-thermometer",
    description:
      "Mostly satisfied with a handful of MINOR-grade distractors (expired QMS certificate, country-only manufacturer address, missing IFU complaint route, undeclared measurement mode). Expected overall MINOR_IMPROVEMENT.",
    default: "SATISFIED_LITERAL",
    overrides: {
      "CORE-ISO13485": "NOT_SATISFIED_DISTRACTOR",
      "CORE-LBL-MFR": "NOT_SATISFIED_DISTRACTOR",
      "CORE-IFU": "NOT_SATISFIED_DISTRACTOR",
      "THERM-SITE-MODE": "NOT_SATISFIED_DISTRACTOR",
    },
  },
  {
    name: "ecg-paraphrase-two-rejects",
    deviceSlug: "ecg-machine",
    description:
      "Paraphrased throughout, with two REJECT-grade distractors buried in it (self-declared Free Sale Certificate; Type BF applied part on a diagnostic ECG). Tests that paraphrase recall does not come at the cost of missing real rejects.",
    default: "SATISFIED_PARAPHRASE",
    overrides: {
      "CORE-FSC": "NOT_SATISFIED_DISTRACTOR",
      "ECG-DEFIB-CF": "NOT_SATISFIED_DISTRACTOR",
    },
  },
  {
    name: "nebulizer-literal-one-minor",
    deviceSlug: "nebulizer",
    description: "Literal throughout except a duty-cycle/IFU contradiction on the compressor clause. Expected overall MINOR_IMPROVEMENT.",
    default: "SATISFIED_LITERAL",
    overrides: { "NEB-COMPRESSOR": "NOT_SATISFIED_DISTRACTOR" },
  },
  {
    name: "bp-monitor-sparse",
    deviceSlug: "bp-monitor",
    description:
      "Only six clauses have any passage at all; the other eleven are simply absent. Tests the plain 'missing document' case, which must be REJECT and must not be softened by topical similarity to the passages that are present.",
    default: "SATISFIED_LITERAL",
    absent: [
      "CORE-MD14-AGENT",
      "CORE-FSC",
      "CORE-ISO14971",
      "CORE-EMC",
      "CORE-LBL-IMPORTER",
      "CORE-LBL-BILINGUAL",
      "CORE-LBL-SYMBOLS",
      "CORE-DMF",
      "BP-CLINICAL-VALIDATION",
      "BP-CUFF-SIZE",
      "BP-OVERPRESSURE",
    ],
  },
];
