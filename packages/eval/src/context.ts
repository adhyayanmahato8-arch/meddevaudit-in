import type { EvalRecord } from "./fixtures/types";

export type ContextMode = "dossier" | "isolated";

export type ClauseLite = { code: string; deviceSlug: string | null };

/**
 * Builds the text a matcher is given for one evaluation record.
 *
 * "dossier": the record's passage plus the SATISFIED_LITERAL passage of every
 * OTHER clause applicable to the same device (core clauses are assigned a
 * device deterministically from their code). The target clause's own other
 * passages are never included, so the label still describes exactly the text
 * that answers it, while retrieval statistics — BM25 IDF, normalisation,
 * competing passages — match a real 17-clause submission. Thresholds
 * calibrated on this unit transfer to production; ones calibrated on bare
 * passages were found not to.
 *
 * "isolated": the bare passage.
 *
 * Both the evaluation harness and the transcript recorder use this, so the LLM
 * and hybrid matchers are judged on byte-identical inputs and replay keys match.
 */
export function makeContextBuilder(clauses: ClauseLite[], records: EvalRecord[], mode: ContextMode) {
  const byCode = new Map(clauses.map((c) => [c.code, c]));
  const deviceSlugs = [...new Set(clauses.map((c) => c.deviceSlug).filter((s): s is string => Boolean(s)))].sort();
  const literalOf = new Map<string, string>();
  for (const r of records) if (r.wordingRelationship === "SATISFIED_LITERAL") literalOf.set(r.clauseCode, r.passage);

  return (record: EvalRecord): string => {
    if (mode === "isolated") return record.passage;
    const target = byCode.get(record.clauseCode);
    if (!target) throw new Error(`context: unknown clause ${record.clauseCode}`);
    const device = target.deviceSlug ?? deviceSlugs[hash(record.clauseCode) % deviceSlugs.length];
    const applicable = clauses.filter((c) => c.code !== target.code && (c.deviceSlug === null || c.deviceSlug === device));
    const others = applicable.map((c) => literalOf.get(c.code)).filter((p): p is string => Boolean(p));
    // Target passage sits at a deterministic position so it is not always first.
    const at = hash(record.clauseCode + "|pos") % (others.length + 1);
    others.splice(at, 0, record.passage);
    return `SUBMISSION DOSSIER\n\n${others.join("\n\n")}\n`;
  };
}

function hash(s: string): number {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}
