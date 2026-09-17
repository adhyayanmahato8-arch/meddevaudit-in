/**
 * The LLM verification contract.
 *
 * Everything that talks to a language model goes through `LlmClient`. Three
 * implementations exist:
 *   live          — calls the Anthropic API (apps/api/src/llm/live.ts)
 *   replay        — answers from recorded transcripts on disk, no network
 *   deterministic — derives a well-formed verdict from the hybrid matcher
 * so the pipeline around the model (prompting, parsing, retries, fallback,
 * evaluation) is testable with zero network access.
 */

export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";

export type LlmClause = {
  code: string;
  clauseRef: string;
  category: string;
  title: string;
  requirementText: string;
  guidance: string;
  mandatory: boolean;
};

export type LlmVerdictRequest = {
  clause: LlmClause;
  dossier: string;
};

/** The shape the model is asked to return. Validated by `normaliseVerdict`. */
export type LlmRawVerdict = {
  verdict: string;
  confidence: number;
  evidence_snippet: string;
  fix_note: string;
};

/** A validated, normalised verdict. */
export type LlmVerdict = {
  verdict: Verdict;
  /** Clamped to [0, 1] and rounded to two places. */
  confidence: number;
  evidenceSnippet: string;
  fixNote: string;
  /** Which implementation produced it. */
  source: "live" | "replay" | "deterministic";
  /** Free-form diagnostics (attempt count, transcript key, model id). */
  meta?: Record<string, string | number | boolean>;
};

export interface LlmClient {
  readonly kind: "live" | "replay" | "deterministic";
  verify(request: LlmVerdictRequest): Promise<LlmVerdict>;
}

// ---------------------------------------------------------------------------
// Errors — typed so callers (and tests) can distinguish failure modes.
// ---------------------------------------------------------------------------

export class LlmError extends Error {
  constructor(
    message: string,
    readonly code:
      | "MALFORMED_RESPONSE"
      | "EMPTY_RESPONSE"
      | "REFUSED"
      | "TIMEOUT"
      | "RATE_LIMITED"
      | "TRANSPORT"
      | "REPLAY_MISS"
      | "SCHEMA",
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "LlmError";
  }
}
