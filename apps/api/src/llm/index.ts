import { hasLlm } from "../env";
import type { ClauseForMatching } from "../services/matcher";
import { DeterministicLlmClient } from "./deterministic";
import { LiveLlmClient } from "./live";
import { ReplayLlmClient } from "./replay";
import type { LlmClient } from "./types";

export * from "./types";
export { normaliseVerdict, coerceObject } from "./parse";
export { LiveLlmClient, anthropicTransport, isRetryableError } from "./live";
export { ReplayLlmClient, passageHash, transcriptPath, writeTranscript, TRANSCRIPT_DIR } from "./replay";
export { DeterministicLlmClient } from "./deterministic";
export { withRetry, withTimeout } from "./retry";

export type LlmClientKind = "live" | "replay" | "deterministic";

/**
 * Factory. `live` requires ANTHROPIC_API_KEY; `deterministic` requires a clause
 * lookup so the hybrid matcher has its retrieval fields.
 */
export function createLlmClient(
  kind: LlmClientKind,
  options: { lookup?: (code: string) => ClauseForMatching | undefined } = {},
): LlmClient {
  switch (kind) {
    case "live":
      if (!hasLlm) throw new Error("ANTHROPIC_API_KEY is not set — cannot create a live LLM client");
      return new LiveLlmClient();
    case "replay":
      return new ReplayLlmClient();
    case "deterministic":
      if (!options.lookup) throw new Error("deterministic client needs a clause lookup");
      return new DeterministicLlmClient(options.lookup);
  }
}
