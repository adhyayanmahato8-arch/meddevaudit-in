import { fallbackMatch, type ClauseForMatching } from "../services/matcher";
import { HybridIndex } from "../services/retrieval";
import { normaliseVerdict } from "./parse";
import type { LlmClient, LlmVerdict, LlmVerdictRequest } from "./types";

/**
 * A no-network stand-in that produces a well-formed verdict from the hybrid
 * matcher, shaped exactly as the model would return it. Its job is to let the
 * LLM pipeline run end to end — prompting, parsing, fallback, evaluation —
 * where no key and no transcript exist. It is NOT a model and its verdicts are
 * not LLM verdicts; `source` says so.
 *
 * Needs the clause's retrieval fields, which the request's `LlmClause` does not
 * carry; they are supplied through `lookup`.
 */
export class DeterministicLlmClient implements LlmClient {
  readonly kind = "deterministic" as const;
  constructor(private readonly lookup: (code: string) => ClauseForMatching | undefined) {}

  async verify(request: LlmVerdictRequest): Promise<LlmVerdict> {
    const clause = this.lookup(request.clause.code);
    if (!clause) throw new Error(`deterministic client: unknown clause ${request.clause.code}`);
    const index = await HybridIndex.build(request.dossier);
    const result = fallbackMatch(clause, request.dossier, index);
    // Round-trip through the parser so the deterministic path exercises the
    // same validation as a real response.
    const verdict = normaliseVerdict(
      {
        verdict: result.verdict,
        confidence: result.confidence,
        evidence_snippet: result.evidenceSnippet,
        fix_note: result.fixNote,
      },
      "deterministic",
    );
    return { ...verdict, meta: { retrievalMode: index.mode } };
  }
}
