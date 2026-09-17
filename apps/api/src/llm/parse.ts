import { LlmError, type LlmRawVerdict, type LlmVerdict, type Verdict } from "./types";

const VERDICTS = new Set<Verdict>(["PASS", "MINOR_IMPROVEMENT", "REJECT"]);

/** Accepts the aliases a model plausibly emits and maps them to the canonical vocabulary. */
const VERDICT_ALIASES: Record<string, Verdict> = {
  PASS: "PASS",
  PASSED: "PASS",
  COMPLIANT: "PASS",
  MINOR_IMPROVEMENT: "MINOR_IMPROVEMENT",
  MINOR: "MINOR_IMPROVEMENT",
  MINOR_IMPROVEMENT_REQUIRED: "MINOR_IMPROVEMENT",
  GAP: "MINOR_IMPROVEMENT",
  PARTIAL: "MINOR_IMPROVEMENT",
  REJECT: "REJECT",
  REJECTED: "REJECT",
  FAIL: "REJECT",
  FAILED: "REJECT",
  NON_COMPLIANT: "REJECT",
};

/**
 * Turns whatever the model returned into a validated verdict, or throws a
 * typed LlmError. Deliberately tolerant on the way in (aliases, JSON wrapped
 * in prose, confidence as a percentage) and strict on the way out.
 */
export function normaliseVerdict(raw: unknown, source: LlmVerdict["source"]): LlmVerdict {
  const object = coerceObject(raw);

  const verdictRaw = String(object.verdict ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const verdict = VERDICT_ALIASES[verdictRaw];
  if (!verdict || !VERDICTS.has(verdict)) {
    throw new LlmError(`verdict "${object.verdict}" is not one of PASS / MINOR_IMPROVEMENT / REJECT`, "SCHEMA", false);
  }

  let confidence = Number(object.confidence);
  if (Number.isNaN(confidence)) {
    throw new LlmError(`confidence "${object.confidence}" is not a number`, "SCHEMA", false);
  }
  // Models sometimes answer in percent. 0..1 is the contract; >1 and <=100 is
  // treated as a percentage; anything else is clamped.
  if (confidence > 1 && confidence <= 100) confidence /= 100;
  confidence = Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100;

  const evidenceSnippet = typeof object.evidence_snippet === "string" ? object.evidence_snippet.trim().slice(0, 600) : "";
  const fixNote = typeof object.fix_note === "string" ? object.fix_note.trim() : "";

  if (typeof object.evidence_snippet !== "string" || typeof object.fix_note !== "string") {
    throw new LlmError("evidence_snippet and fix_note must be strings", "SCHEMA", false);
  }

  return { verdict, confidence, evidenceSnippet, fixNote, source };
}

/**
 * Accepts an object, a JSON string, or a string with a JSON object embedded in
 * prose / a code fence, and returns the object. Throws MALFORMED_RESPONSE or
 * EMPTY_RESPONSE otherwise.
 */
export function coerceObject(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) throw new LlmError("model returned nothing", "EMPTY_RESPONSE", true);
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== "string") throw new LlmError(`unexpected response type ${typeof raw}`, "MALFORMED_RESPONSE", false);

  const text = raw.trim();
  if (!text) throw new LlmError("model returned an empty string", "EMPTY_RESPONSE", true);

  // 1. Whole string is JSON.
  const direct = tryParse(text);
  if (direct) return direct;

  // 2. JSON inside a ```json fence.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    const fenced = tryParse(fence[1].trim());
    if (fenced) return fenced;
  }

  // 3. First balanced {...} object anywhere in the text.
  const start = text.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < text.length; i += 1) {
      if (text[i] === "{") depth += 1;
      else if (text[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = tryParse(text.slice(start, i + 1));
          if (candidate) return candidate;
          break;
        }
      }
    }
  }

  throw new LlmError(`could not find a JSON object in the response: ${text.slice(0, 80)}…`, "MALFORMED_RESPONSE", false);
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isRawVerdict(value: unknown): value is LlmRawVerdict {
  return (
    typeof value === "object" &&
    value !== null &&
    "verdict" in value &&
    "confidence" in value &&
    "evidence_snippet" in value &&
    "fix_note" in value
  );
}
