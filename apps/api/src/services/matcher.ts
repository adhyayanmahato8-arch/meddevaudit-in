import { HybridIndex, type RetrievalMode } from "./retrieval";
import { decide, loadThresholds, type ThresholdParams, type Verdict } from "./thresholds";
import { env, hasLlm } from "../env";
import { LlmError, type LlmClient } from "../llm/types";

export type { Verdict } from "./thresholds";

export type ClauseForMatching = {
  id: string;
  code: string;
  clauseRef: string;
  title: string;
  requirementText: string;
  guidance: string;
  mandatory: boolean;
  keywords: string;
  synonyms: string;
  embedding: string | null;
  category: string;
};

/**
 * Where an evidence snippet came from. This is surfaced to the reviewer so a
 * "closest related passage" is never mistaken for text that actually satisfies
 * the requirement.
 */
export type EvidenceKind = "lexical" | "semantic" | "none";

export type ClauseResult = {
  clauseId: string;
  verdict: Verdict;
  confidence: number;
  evidenceSnippet: string;
  evidenceKind: EvidenceKind;
  fixNote: string;
  engine: "llm" | "fallback";
};

// ---------------------------------------------------------------------------
// Hybrid lexical + semantic matcher
//
// This is a real, working matcher — not a stub. It is what runs when no
// ANTHROPIC_API_KEY is configured, and it is also the per-clause safety net if
// an individual API call fails. It fuses two signals:
//
//   COVERAGE   — each clause carries pipe-separated keyword groups; terms inside
//                a group are synonyms. Coverage is matched groups / total. This
//                is the deterministic rules-as-code signal.
//   RETRIEVAL  — services/retrieval.ts fuses BM25 (query expanded with the
//                clause's controlled vocabulary) with sentence-embedding cosine
//                similarity, alpha = 0.65, over the dossier's passages. When the
//                embedding model is unavailable it degrades to BM25 only.
//
// The decision rule lives in services/thresholds.ts so the evaluation harness
// can calibrate it. Its asymmetry is deliberate: retrieval can SOFTEN a verdict
// and supply context, but can never manufacture a PASS without coverage. In
// compliance screening the costly error is the missed non-compliance.
// ---------------------------------------------------------------------------

type KeywordGroup = { label: string; terms: string[] };

function parseKeywordGroups(keywords: string): KeywordGroup[] {
  return keywords
    .split("|")
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => {
      const terms = group
        .split(",")
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean);
      return { label: terms[0] ?? group, terms };
    })
    .filter((group) => group.terms.length > 0);
}

/**
 * Word-ish containment test. Standards identifiers contain punctuation
 * (60601-1-2, ±3 mmHg, µm) so a plain substring test on a normalised haystack
 * is more reliable here than a \b word-boundary regex, but we still guard the
 * short numeric terms against matching inside a longer number.
 */
function findTerm(haystack: string, term: string): number {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(term, from);
    if (at === -1) return -1;
    const before = at === 0 ? " " : haystack[at - 1];
    const after = at + term.length >= haystack.length ? " " : haystack[at + term.length];
    const bleedsLeft = /[0-9a-z]/.test(before) && /^[0-9a-z]/.test(term);
    const bleedsRight = /[0-9a-z]/.test(after) && /[0-9a-z]$/.test(term);
    if (!bleedsLeft && !bleedsRight) return at;
    from = at + 1;
  }
}

function snippetAround(original: string, index: number): string {
  if (index < 0) return "";
  const start = Math.max(0, original.lastIndexOf("\n", index) + 1);
  let end = original.indexOf("\n", index);
  if (end === -1) end = original.length;
  let snippet = original.slice(start, end).trim();
  if (snippet.length < 40) {
    snippet = original.slice(Math.max(0, index - 100), Math.min(original.length, index + 160)).trim();
  }
  if (snippet.length > 280) snippet = `${snippet.slice(0, 277)}...`;
  return snippet;
}

/** Coverage + retrieval signals for one clause — what the decision rule sees. */
export type MatchSignals = {
  coverage: number;
  retrieval: number;
  bm25: number;
  semantic: number;
  mode: RetrievalMode | "none";
};

export function fallbackMatch(
  clause: ClauseForMatching,
  dossier: string,
  index?: HybridIndex,
  params: ThresholdParams = loadThresholds(),
): ClauseResult & { signals: MatchSignals } {
  const haystack = dossier.toLowerCase().replace(/\s+/g, " ");
  const flatOriginal = dossier.replace(/\s+/g, " ");
  const groups = parseKeywordGroups(clause.keywords);

  const hits: { label: string; at: number; term: string }[] = [];
  const misses: string[] = [];

  for (const group of groups) {
    let found = -1;
    let foundTerm = "";
    for (const term of group.terms) {
      const at = findTerm(haystack, term);
      if (at !== -1) {
        found = at;
        foundTerm = term;
        break;
      }
    }
    if (found === -1) misses.push(group.label);
    else hits.push({ label: group.label, at: found, term: foundTerm });
  }

  const total = groups.length || 1;
  const matched = hits.length;
  const ratio = matched / total;

  // Retrieval signal: the best-matching passage under BM25 + embeddings.
  const hit = index?.query(clause) ?? { score: 0, bm25: 0, semantic: 0, passage: "", mode: "lexical" as const };
  const signals: MatchSignals = {
    coverage: ratio,
    retrieval: hit.score,
    bm25: hit.bm25,
    semantic: hit.semantic,
    mode: index ? hit.mode : "none",
  };

  const verdict = decide(ratio, hit.score, params);
  let confidence: number;
  let fixNote: string;

  if (verdict === "PASS") {
    // Retrieval corroboration raises confidence in a coverage-based pass.
    confidence = round2(hit.score >= params.tauSoften ? 0.8 : 0.7);
    fixNote = "";
  } else if (verdict === "MINOR_IMPROVEMENT" && matched > 0) {
    confidence = round2(0.5 + ratio * 0.2);
    fixNote =
      `The dossier addresses this requirement only partly. No evidence was found for: ${misses.join("; ")}. ` +
      `Add the missing element(s) and cite ${clause.clauseRef} in the revised submission.`;
  } else if (verdict === "MINOR_IMPROVEMENT") {
    // Softened: nothing matched lexically, but a passage is clearly on this
    // subject. Asserting "no evidence anywhere" would be wrong, so this is a
    // gap for a human to adjudicate rather than a flat reject.
    confidence = 0.45;
    fixNote =
      `The dossier appears to discuss this subject, but not in terms that satisfy the requirement — none of the ` +
      `expected elements were found (${groups.map((g) => g.label).join("; ")}). Confirm manually against ` +
      `${clause.clauseRef}, and state the required particulars explicitly in the revised submission.`;
  } else {
    const nearby = hit.score >= params.tauContext;
    confidence = round2(nearby ? 0.6 : 0.68);
    fixNote =
      `Screening found nothing in the dossier that satisfies this requirement ` +
      `(looked for: ${groups.map((g) => g.label).join("; ")})` +
      (nearby ? ", and the closest related passage shown above does not meet it" : "") +
      `. Submit the document required by ${clause.clauseRef} before re-applying.`;
  }

  // Prefer a lexical hit as evidence — it is the exact text the rule asked for.
  // Fall back to the closest passage so that even a REJECT tells the reviewer
  // what the nearest thing in the dossier was, instead of showing nothing.
  const best = hits.sort((a, b) => a.at - b.at)[0];
  let evidenceSnippet = "";
  let evidenceKind: EvidenceKind = "none";
  if (best) {
    evidenceSnippet = snippetAround(flatOriginal, best.at);
    evidenceKind = "lexical";
  } else if (hit.score >= params.tauContext && hit.passage) {
    evidenceSnippet = hit.passage;
    evidenceKind = "semantic";
  }

  return {
    clauseId: clause.id,
    verdict,
    confidence,
    evidenceSnippet,
    evidenceKind,
    fixNote,
    signals,
    engine: "fallback",
  };
}

// ---------------------------------------------------------------------------
// LLM matcher (grounded, one structured call per clause)
//
// The model call itself lives behind the LlmClient interface in ../llm so it
// can be swapped for a replay or deterministic implementation in tests and
// evaluation. This function only maps a verdict onto ClauseResult.
// ---------------------------------------------------------------------------

export async function llmMatch(clause: ClauseForMatching, dossier: string, client: LlmClient): Promise<ClauseResult> {
  const verdict = await client.verify({
    clause: {
      code: clause.code,
      clauseRef: clause.clauseRef,
      category: clause.category,
      title: clause.title,
      requirementText: clause.requirementText,
      guidance: clause.guidance,
      mandatory: clause.mandatory,
    },
    dossier,
  });

  return {
    clauseId: clause.id,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    evidenceSnippet: verdict.evidenceSnippet,
    // The model is instructed to quote verbatim from the dossier, so anything
    // it returns is a direct citation rather than a nearest-neighbour passage.
    evidenceKind: verdict.evidenceSnippet ? "lexical" : "none",
    fixNote: verdict.fixNote,
    engine: "llm",
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export type MatchRunResult = {
  results: ClauseResult[];
  engine: "llm" | "fallback" | "mixed";
  retrievalMode: RetrievalMode;
  notes: string[];
};

/**
 * Runs every clause against the dossier. Uses the LLM when a key is set, with
 * a per-clause fallback to the hybrid matcher if a call fails, so a transient
 * API error degrades one finding instead of failing the whole audit.
 */
export async function runMatching(
  clauses: ClauseForMatching[],
  dossier: string,
  onProgress?: (done: number, total: number) => void,
  llmClient?: LlmClient,
): Promise<MatchRunResult> {
  const notes: string[] = [];

  // Built once per audit and shared by every clause — passage tokens and
  // vectors do not depend on which clause is being screened.
  const index = await HybridIndex.build(dossier);
  const thresholds = loadThresholds();

  // The live client is constructed lazily so importing this module never
  // touches the SDK; tests and the evaluation harness inject their own.
  const client = llmClient ?? (hasLlm ? await createLiveClient() : undefined);

  if (!client) {
    const results = clauses.map((clause, i) => {
      const result = fallbackMatch(clause, dossier, index, thresholds);
      onProgress?.(i + 1, clauses.length);
      return result;
    });
    notes.push(
      index.mode === "hybrid"
        ? `ANTHROPIC_API_KEY is not set — every clause was screened with BM25 + sentence embeddings over ${index.passageCount} dossier passages.`
        : `ANTHROPIC_API_KEY is not set and the embedding model is unavailable — every clause was screened with BM25 + controlled vocabulary over ${index.passageCount} dossier passages.`,
    );
    return { results, engine: "fallback", retrievalMode: index.mode, notes };
  }

  const activeClient: LlmClient = client;
  const results = new Array<ClauseResult>(clauses.length);
  let cursor = 0;
  let done = 0;
  let llmFailures = 0;

  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= clauses.length) return;
      const clause = clauses[i];
      try {
        results[i] = await llmMatch(clause, dossier, activeClient);
      } catch (error) {
        llmFailures += 1;
        if (llmFailures === 1) {
          notes.push(
            `An API call failed (${describeError(error)}); affected clauses fell back to the hybrid matcher.`,
          );
        }
        results[i] = fallbackMatch(clause, dossier, index, thresholds);
      }
      done += 1;
      onProgress?.(done, clauses.length);
    }
  }

  const workers = Array.from({ length: Math.min(env.aiConcurrency, clauses.length) }, () => worker());
  await Promise.all(workers);

  const engines = new Set(results.map((r) => r.engine));
  const engine = engines.size > 1 ? "mixed" : (results[0]?.engine ?? "fallback");
  return { results, engine, retrievalMode: index.mode, notes };
}

async function createLiveClient(): Promise<LlmClient> {
  const { LiveLlmClient } = await import("../llm/live");
  return new LiveLlmClient();
}

function describeError(error: unknown): string {
  if (error instanceof LlmError) return `${error.code.toLowerCase().replace(/_/g, " ")}: ${error.message}`;
  const status = (error as { status?: unknown })?.status;
  if (status === 401) return "invalid API key";
  if (status === 429) return "rate limited";
  if (typeof status === "number") return `API error ${status}`;
  if (error instanceof Error) return error.message;
  return "unknown error";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
