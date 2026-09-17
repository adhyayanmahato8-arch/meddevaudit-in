import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { env } from "../env";
import { normaliseVerdict } from "./parse";
import { SYSTEM_INSTRUCTIONS, VERDICT_SCHEMA, clauseUserMessage } from "./prompt";
import { withRetry, withTimeout, type RetryOptions } from "./retry";
import { LlmError, type LlmClient, type LlmVerdict, type LlmVerdictRequest } from "./types";

/**
 * What the transport must hand back. Narrowed to the fields the client reads so
 * a test double does not need to fabricate a whole SDK Message.
 */
export type TransportResult = {
  stop_reason: string | null;
  /** The parsed structured output, if the SDK produced one. */
  parsed_output?: unknown;
  /** Text blocks, used to recover a verdict when parsed_output is absent. */
  text?: string;
  model?: string;
};

export type Transport = (params: {
  system: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[];
  user: string;
}) => Promise<TransportResult>;

export type LiveClientOptions = {
  transport?: Transport;
  timeoutMs?: number;
  retry?: Partial<RetryOptions>;
  model?: string;
};

/** The default transport: the Anthropic SDK with strict JSON-schema output. */
export function anthropicTransport(model: string): Transport {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  return async ({ system, user }) => {
    const response = await client.messages.parse({
      model,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: jsonSchemaOutputFormat(VERDICT_SCHEMA) },
    });
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return { stop_reason: response.stop_reason, parsed_output: response.parsed_output, text, model: response.model };
  };
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof LlmError) return error.retryable;
  if (error instanceof Anthropic.RateLimitError) return true;
  if (error instanceof Anthropic.InternalServerError) return true;
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIConnectionTimeoutError) return true;
  const status = (error as { status?: unknown })?.status;
  return status === 429 || status === 408 || status === 409 || (typeof status === "number" && status >= 500);
}

export class LiveLlmClient implements LlmClient {
  readonly kind = "live" as const;
  private readonly transport: Transport;
  private readonly timeoutMs: number;
  private readonly retry: RetryOptions;
  private readonly model: string;

  constructor(options: LiveClientOptions = {}) {
    this.model = options.model ?? env.anthropicModel;
    this.transport = options.transport ?? anthropicTransport(this.model);
    this.timeoutMs = options.timeoutMs ?? 90_000;
    this.retry = {
      attempts: 4,
      baseDelayMs: 1_000,
      maxDelayMs: 20_000,
      isRetryable: isRetryableError,
      ...options.retry,
    };
  }

  async verify(request: LlmVerdictRequest): Promise<LlmVerdict> {
    const system = [
      { type: "text" as const, text: SYSTEM_INSTRUCTIONS },
      {
        type: "text" as const,
        text: `SUBMITTED DOSSIER (verbatim):\n\n${request.dossier}`,
        // Identical across every clause of an audit, so it caches.
        cache_control: { type: "ephemeral" as const },
      },
    ];
    const user = clauseUserMessage(request.clause);

    let attempts = 0;
    const result = await withRetry(async (attempt) => {
      attempts = attempt;
      const response = await withTimeout(this.transport({ system, user }), this.timeoutMs);
      return this.interpret(response);
    }, this.retry);

    return { ...result, meta: { ...(result.meta ?? {}), attempts, model: this.model } };
  }

  /** Maps a transport result to a verdict or a typed error. */
  private interpret(response: TransportResult): LlmVerdict {
    if (response.stop_reason === "refusal") {
      throw new LlmError("model declined to answer (stop_reason=refusal)", "REFUSED", false);
    }
    if (response.stop_reason === "max_tokens") {
      throw new LlmError("response truncated at max_tokens", "MALFORMED_RESPONSE", true);
    }
    const raw = response.parsed_output ?? response.text;
    const verdict = normaliseVerdict(raw, "live");
    return { ...verdict, meta: response.model ? { model: response.model } : undefined };
  }
}
