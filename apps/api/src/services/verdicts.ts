export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";

export const VERDICT_LABEL: Record<Verdict, string> = {
  PASS: "Pass",
  MINOR_IMPROVEMENT: "Minor improvement required",
  REJECT: "Reject",
};

/**
 * The reviewer's decision always wins over the AI's. This is the single place
 * that rule is expressed, so the API, the PDF and the UI cannot disagree.
 */
export function effectiveVerdict(finding: {
  aiVerdict: string;
  reviewerVerdict?: string | null;
}): Verdict {
  return (finding.reviewerVerdict || finding.aiVerdict) as Verdict;
}

/**
 * Overall audit result:
 *   REJECT             if any MANDATORY clause is REJECT
 *   MINOR_IMPROVEMENT  if any clause is MINOR_IMPROVEMENT (or a non-mandatory
 *                      clause is REJECT) and no mandatory clause is REJECT
 *   PASS               otherwise
 */
export function computeOverallResult(
  findings: { aiVerdict: string; reviewerVerdict?: string | null; clause: { mandatory: boolean } }[],
): Verdict {
  let sawSoftIssue = false;

  for (const finding of findings) {
    const verdict = effectiveVerdict(finding);
    if (verdict === "REJECT") {
      if (finding.clause.mandatory) return "REJECT";
      sawSoftIssue = true;
    } else if (verdict === "MINOR_IMPROVEMENT") {
      sawSoftIssue = true;
    }
  }

  return sawSoftIssue ? "MINOR_IMPROVEMENT" : "PASS";
}

export function countByVerdict(
  findings: { aiVerdict: string; reviewerVerdict?: string | null }[],
): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { PASS: 0, MINOR_IMPROVEMENT: 0, REJECT: 0 };
  for (const finding of findings) counts[effectiveVerdict(finding)] += 1;
  return counts;
}
