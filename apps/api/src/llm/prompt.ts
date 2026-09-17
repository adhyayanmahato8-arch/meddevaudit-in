import type { LlmClause } from "./types";

export const SYSTEM_INSTRUCTIONS = `You are a regulatory reviewer at the Central Drugs Standard Control Organisation (CDSCO), screening the import documentation dossier of a medical device against India's Medical Device Rules, 2017 (MDR-2017).

You will be given ONE requirement at a time and the full text of the submitted dossier. Decide whether the dossier satisfies that one requirement, and nothing else.

Verdict definitions — use them exactly:
- PASS: the required document or field is present in the dossier, and it substantively satisfies every element of the requirement.
- MINOR_IMPROVEMENT: the dossier addresses the requirement but the evidence is incomplete, out of date, wrongly formatted, ambiguous, or one sub-element of the requirement is unmet. Name precisely which sub-element is unmet.
- REJECT: the mandatory document or field is missing entirely, or the dossier contradicts a hard requirement, or the applicant has substituted a weaker kind of evidence for the kind the rule demands.

Rules you must follow:
1. Ground every verdict in the dossier text. Quote the exact words you relied on in evidence_snippet. Never invent, paraphrase, or complete a quotation.
2. If the dossier says nothing at all about the requirement, that is REJECT with an empty evidence_snippet — do not reason your way to a PASS from the absence of a problem.
3. A marketing claim is not test evidence. A self-declaration is not a third-party certificate. Bench data is not clinical data. Where the requirement names a specific kind of evidence, only that kind of evidence can produce a PASS.
4. Judge only the requirement in front of you. Do not penalise the dossier for gaps that belong to other clauses.
5. fix_note must be specific and actionable for the applicant — name the document, field or test to add. Leave it empty for PASS.
6. confidence reflects how clear the dossier text is, not how confident you are in your reading of the regulation.`;

/** The strict JSON schema the model's answer is constrained to. */
export const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["PASS", "MINOR_IMPROVEMENT", "REJECT"],
      description: "PASS if fully satisfied, MINOR_IMPROVEMENT if partly satisfied, REJECT if absent or contradicted",
    },
    confidence: { type: "number", description: "Confidence in this verdict, 0.0 to 1.0" },
    evidence_snippet: {
      type: "string",
      description:
        "A short verbatim quote from the dossier that the verdict rests on. Empty string if nothing relevant exists.",
    },
    fix_note: {
      type: "string",
      description: "For a non-PASS verdict, the specific action the applicant must take. Empty string for PASS.",
    },
  },
  required: ["verdict", "confidence", "evidence_snippet", "fix_note"],
  additionalProperties: false,
} as const;

export function clauseUserMessage(clause: LlmClause): string {
  return (
    `Requirement under review\n` +
    `Clause reference: ${clause.clauseRef}\n` +
    `Category: ${clause.category}\n` +
    `Mandatory: ${clause.mandatory ? "yes" : "no"}\n` +
    `Title: ${clause.title}\n\n` +
    `Requirement text:\n${clause.requirementText}\n\n` +
    `Reviewer guidance for this clause:\n${clause.guidance}\n\n` +
    `Return your verdict on this one requirement.`
  );
}
