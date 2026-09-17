import { LlmError } from "./types";

export type RetryOptions = {
  /** Maximum attempts including the first. */
  attempts: number;
  /** Base delay; attempt n waits base * 2^(n-1) plus jitter. */
  baseDelayMs: number;
  maxDelayMs: number;
  /** Injected so tests can run without real waiting. */
  sleep?: (ms: number) => Promise<void>;
  /** Decides whether an error is worth another attempt. */
  isRetryable: (error: unknown) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
};

export const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff with full jitter. Honours a `retryAfterMs` hint on the
 * error when present (rate-limit responses carry one), otherwise doubles.
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.isRetryable(error)) throw error;
      const hinted = retryAfterMs(error);
      const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1));
      const delay = hinted ?? Math.round(Math.random() * exponential);
      options.onRetry?.(attempt, delay, error);
      await sleep(delay);
    }
  }
  throw lastError;
}

function retryAfterMs(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const value = (error as { retryAfterMs?: unknown }).retryAfterMs;
  return typeof value === "number" && value >= 0 ? value : null;
}

/** Rejects with a TIMEOUT LlmError if `promise` has not settled within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = "LLM call"): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new LlmError(`${label} exceeded ${ms} ms`, "TIMEOUT", true)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}
