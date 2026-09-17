/**
 * One annotated evaluation passage.
 *
 * wordingRelationship:
 *   SATISFIED_LITERAL        — satisfies the clause using the clause's own vocabulary
 *   SATISFIED_PARAPHRASE     — genuinely satisfies it with deliberately different wording
 *   NOT_SATISFIED_DISTRACTOR — shares topic and vocabulary but does NOT meet the requirement
 *
 * expectedVerdict is set per record rather than inferred from the relationship,
 * because a distractor may legitimately be a MINOR_IMPROVEMENT (a certificate
 * that has expired) or a REJECT (a standard cited in a list with no report
 * behind it). The rationale states why, at the level a regulatory reviewer
 * would defend.
 */
export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";

export type WordingRelationship = "SATISFIED_LITERAL" | "SATISFIED_PARAPHRASE" | "NOT_SATISFIED_DISTRACTOR";

export type EvalRecord = {
  clauseCode: string;
  passage: string;
  expectedVerdict: Verdict;
  rationale: string;
  wordingRelationship: WordingRelationship;
};

/** Helper so authoring modules stay terse and type-checked. */
export function rec(
  clauseCode: string,
  wordingRelationship: WordingRelationship,
  expectedVerdict: Verdict,
  passage: string,
  rationale: string,
): EvalRecord {
  return { clauseCode, passage: passage.trim(), expectedVerdict, rationale: rationale.trim(), wordingRelationship };
}
