/**
 * Contract tests for the LLM verification pipeline. No network, no API key,
 * no database: every model interaction goes through an injected transport.
 *
 *   npm run test:llm-contract
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normaliseVerdict, coerceObject } from "./parse";
import { LiveLlmClient, type Transport, type TransportResult } from "./live";
import { ReplayLlmClient, passageHash, writeTranscript } from "./replay";
import { DeterministicLlmClient } from "./deterministic";
import { withRetry } from "./retry";
import { LlmError, type LlmClause, type LlmVerdictRequest } from "./types";
import type { ClauseForMatching } from "../services/matcher";

const clause: LlmClause = {
  code: "CORE-ISO13485",
  clauseRef: "MDR-2017 Fifth Schedule r/w ISO 13485:2016",
  category: "Quality Management",
  title: "ISO 13485 quality management system certificate, valid and unexpired",
  requirementText: "The overseas manufacturing site must hold a current ISO 13485:2016 certificate…",
  guidance: "Check the year, the scope and the expiry date.",
  mandatory: true,
};
const request: LlmVerdictRequest = { clause, dossier: "ISO 13485:2016 certificate DE-QMS-2022-77413, valid until 10 April 2026." };

const good = { verdict: "PASS", confidence: 0.9, evidence_snippet: "valid until 10 April 2026", fix_note: "" };
const noSleep = async () => {};

function client(transport: Transport, extra: Partial<ConstructorParameters<typeof LiveLlmClient>[0]> = {}) {
  return new LiveLlmClient({
    transport,
    timeoutMs: 200,
    retry: { attempts: 3, baseDelayMs: 1, maxDelayMs: 4, sleep: noSleep },
    model: "test-model",
    ...extra,
  });
}
const ok = (parsed_output: unknown, stop_reason = "end_turn"): TransportResult => ({ stop_reason, parsed_output });

// ---------------------------------------------------------------------------
describe("response schema validation", () => {
  test("a well-formed verdict is normalised", () => {
    const v = normaliseVerdict(good, "live");
    assert.equal(v.verdict, "PASS");
    assert.equal(v.confidence, 0.9);
    assert.equal(v.evidenceSnippet, "valid until 10 April 2026");
    assert.equal(v.source, "live");
  });

  test("all three verdict kinds and common aliases are accepted", () => {
    for (const [alias, expected] of [
      ["PASS", "PASS"],
      ["pass", "PASS"],
      ["MINOR_IMPROVEMENT", "MINOR_IMPROVEMENT"],
      ["minor improvement required", "MINOR_IMPROVEMENT"],
      ["Minor-Improvement", "MINOR_IMPROVEMENT"],
      ["REJECT", "REJECT"],
      ["Rejected", "REJECT"],
      ["FAIL", "REJECT"],
    ] as const) {
      assert.equal(normaliseVerdict({ ...good, verdict: alias }, "live").verdict, expected, alias);
    }
  });

  test("an unknown verdict is a SCHEMA error", () => {
    assert.throws(() => normaliseVerdict({ ...good, verdict: "MAYBE" }, "live"), (e: unknown) => e instanceof LlmError && e.code === "SCHEMA");
  });

  test("missing or non-string fields are SCHEMA errors", () => {
    assert.throws(() => normaliseVerdict({ verdict: "PASS", confidence: 0.5 }, "live"), (e: unknown) => e instanceof LlmError && e.code === "SCHEMA");
    assert.throws(() => normaliseVerdict({ ...good, fix_note: 42 }, "live"), (e: unknown) => e instanceof LlmError && e.code === "SCHEMA");
  });

  test("SCHEMA errors are not retryable", () => {
    try {
      normaliseVerdict({ ...good, verdict: "??" }, "live");
      assert.fail("should throw");
    } catch (e) {
      assert.ok(e instanceof LlmError);
      assert.equal(e.retryable, false);
    }
  });
});

// ---------------------------------------------------------------------------
describe("confidence values out of range", () => {
  test("percentages are converted, negatives and >100 are clamped, non-numbers rejected", () => {
    assert.equal(normaliseVerdict({ ...good, confidence: 85 }, "live").confidence, 0.85);
    assert.equal(normaliseVerdict({ ...good, confidence: -0.3 }, "live").confidence, 0);
    assert.equal(normaliseVerdict({ ...good, confidence: 250 }, "live").confidence, 1);
    assert.equal(normaliseVerdict({ ...good, confidence: "0.7" }, "live").confidence, 0.7);
    assert.throws(() => normaliseVerdict({ ...good, confidence: "high" }, "live"), (e: unknown) => e instanceof LlmError && e.code === "SCHEMA");
    for (const c of [1.7, 0.0001, 99.99]) {
      const v = normaliseVerdict({ ...good, confidence: c }, "live").confidence;
      assert.ok(v >= 0 && v <= 1, `confidence ${c} → ${v} must land in [0,1]`);
    }
  });
});

// ---------------------------------------------------------------------------
describe("malformed-JSON recovery", () => {
  test("a JSON string is parsed", () => {
    assert.equal(coerceObject(JSON.stringify(good)).verdict, "PASS");
  });
  test("JSON wrapped in prose is recovered", () => {
    const text = `Here is my assessment:\n${JSON.stringify(good)}\nLet me know if you need more.`;
    assert.equal(coerceObject(text).verdict, "PASS");
  });
  test("JSON inside a code fence is recovered", () => {
    const text = "```json\n" + JSON.stringify(good, null, 2) + "\n```";
    assert.equal(coerceObject(text).confidence, 0.9);
  });
  test("nested braces in strings do not break extraction", () => {
    const tricky = { ...good, fix_note: "Add {the missing} annex" };
    assert.equal(coerceObject(`Answer: ${JSON.stringify(tricky)}`).fix_note, "Add {the missing} annex");
  });
  test("no JSON at all is MALFORMED_RESPONSE", () => {
    assert.throws(() => coerceObject("The dossier looks fine to me."), (e: unknown) => e instanceof LlmError && e.code === "MALFORMED_RESPONSE");
  });
  test("live client recovers a verdict from text when parsed_output is absent", async () => {
    const c = client(async () => ({ stop_reason: "end_turn", text: `Sure:\n${JSON.stringify(good)}` }));
    const v = await c.verify(request);
    assert.equal(v.verdict, "PASS");
  });
});

// ---------------------------------------------------------------------------
describe("empty or refused responses", () => {
  test("an empty response is retried and then surfaces as EMPTY_RESPONSE", async () => {
    let calls = 0;
    const c = client(async () => {
      calls += 1;
      return { stop_reason: "end_turn", text: "" };
    });
    await assert.rejects(c.verify(request), (e: unknown) => e instanceof LlmError && e.code === "EMPTY_RESPONSE");
    assert.equal(calls, 3, "empty responses are retryable, so all attempts are used");
  });

  test("a refusal is surfaced as REFUSED and is NOT retried", async () => {
    let calls = 0;
    const c = client(async () => {
      calls += 1;
      return { stop_reason: "refusal", text: "" };
    });
    await assert.rejects(c.verify(request), (e: unknown) => e instanceof LlmError && e.code === "REFUSED");
    assert.equal(calls, 1);
  });

  test("a truncated response (max_tokens) is retried", async () => {
    let calls = 0;
    const c = client(async () => {
      calls += 1;
      return calls < 2 ? { stop_reason: "max_tokens", text: '{"verdict":"PA' } : ok(good);
    });
    const v = await c.verify(request);
    assert.equal(v.verdict, "PASS");
    assert.equal(v.meta?.attempts, 2);
  });
});

// ---------------------------------------------------------------------------
describe("timeout", () => {
  test("a hanging transport times out, retries, and surfaces TIMEOUT", async () => {
    let calls = 0;
    const c = client(() => {
      calls += 1;
      return new Promise<TransportResult>(() => {
        /* never resolves */
      });
    });
    const started = Date.now();
    await assert.rejects(c.verify(request), (e: unknown) => e instanceof LlmError && e.code === "TIMEOUT");
    assert.equal(calls, 3);
    assert.ok(Date.now() - started < 3_000, "three 200 ms timeouts must not take seconds");
  });

  test("a slow-then-fast transport succeeds on the second attempt", async () => {
    let calls = 0;
    const c = client(() => {
      calls += 1;
      if (calls === 1) return new Promise<TransportResult>(() => {});
      return Promise.resolve(ok(good));
    });
    const v = await c.verify(request);
    assert.equal(v.verdict, "PASS");
    assert.equal(v.meta?.attempts, 2);
  });
});

// ---------------------------------------------------------------------------
describe("rate-limit retry with backoff", () => {
  test("429 is retried with exponential backoff and eventually succeeds", async () => {
    const delays: number[] = [];
    let calls = 0;
    const c = new LiveLlmClient({
      model: "test-model",
      timeoutMs: 200,
      retry: {
        attempts: 4,
        baseDelayMs: 100,
        maxDelayMs: 10_000,
        sleep: async (ms) => {
          delays.push(ms);
        },
      },
      transport: async () => {
        calls += 1;
        if (calls < 3) throw Object.assign(new Error("rate limited"), { status: 429 });
        return ok(good);
      },
    });
    const v = await c.verify(request);
    assert.equal(v.verdict, "PASS");
    assert.equal(calls, 3);
    assert.equal(delays.length, 2);
    // Full jitter: each delay lies in [0, base * 2^(attempt-1)].
    assert.ok(delays[0] <= 100, `first backoff ${delays[0]} ≤ 100`);
    assert.ok(delays[1] <= 200, `second backoff ${delays[1]} ≤ 200`);
  });

  test("a retry-after hint is honoured exactly", async () => {
    const delays: number[] = [];
    let calls = 0;
    const c = new LiveLlmClient({
      model: "test-model",
      timeoutMs: 200,
      retry: { attempts: 3, baseDelayMs: 1, maxDelayMs: 10, sleep: async (ms) => void delays.push(ms) },
      transport: async () => {
        calls += 1;
        if (calls === 1) throw Object.assign(new Error("rate limited"), { status: 429, retryAfterMs: 1234 });
        return ok(good);
      },
    });
    await c.verify(request);
    assert.deepEqual(delays, [1234]);
  });

  test("rate limiting that never clears surfaces the last error after all attempts", async () => {
    let calls = 0;
    const c = client(async () => {
      calls += 1;
      throw Object.assign(new Error("rate limited"), { status: 429 });
    });
    await assert.rejects(c.verify(request), (e: unknown) => (e as { status?: number }).status === 429);
    assert.equal(calls, 3);
  });

  test("a 400 is not retried", async () => {
    let calls = 0;
    const c = client(async () => {
      calls += 1;
      throw Object.assign(new Error("bad request"), { status: 400 });
    });
    await assert.rejects(c.verify(request));
    assert.equal(calls, 1);
  });

  test("withRetry backoff grows and is capped", async () => {
    const delays: number[] = [];
    let n = 0;
    await assert.rejects(
      withRetry(
        async () => {
          n += 1;
          throw Object.assign(new Error("x"), { status: 503 });
        },
        {
          attempts: 5,
          baseDelayMs: 100,
          maxDelayMs: 250,
          isRetryable: () => true,
          sleep: async (ms) => void delays.push(ms),
        },
      ),
    );
    assert.equal(n, 5);
    assert.equal(delays.length, 4);
    for (const d of delays) assert.ok(d <= 250, `capped at 250, got ${d}`);
  });
});

// ---------------------------------------------------------------------------
describe("replay client", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mda-transcripts-"));

  test("a missing transcript is REPLAY_MISS", async () => {
    const c = new ReplayLlmClient(dir);
    assert.equal(c.has(request), false);
    await assert.rejects(c.verify(request), (e: unknown) => e instanceof LlmError && e.code === "REPLAY_MISS");
  });

  test("a written transcript round-trips through the same validation as a live response", async () => {
    writeTranscript(
      {
        clauseCode: clause.code,
        passageHash: passageHash(request.dossier),
        passageExcerpt: request.dossier.slice(0, 60),
        recordedAt: new Date().toISOString(),
        source: "hand-written",
        response: { verdict: "minor improvement", confidence: 70, evidence_snippet: "valid until 10 April 2026", fix_note: "Attach the certificate." },
      },
      dir,
    );
    const c = new ReplayLlmClient(dir);
    assert.equal(c.has(request), true);
    const v = await c.verify(request);
    assert.equal(v.verdict, "MINOR_IMPROVEMENT");
    assert.equal(v.confidence, 0.7);
    assert.equal(v.source, "replay");
  });

  test("whitespace differences in the passage do not change the key", () => {
    assert.equal(passageHash("a  b\n c"), passageHash("a b c"));
  });
});

// ---------------------------------------------------------------------------
describe("deterministic client", () => {
  const forMatching: ClauseForMatching = {
    id: "x",
    code: clause.code,
    clauseRef: clause.clauseRef,
    category: clause.category,
    title: clause.title,
    requirementText: clause.requirementText,
    guidance: clause.guidance,
    mandatory: true,
    keywords: "iso 13485,en iso 13485|certificate number,certificate no,registration number|valid until,expiry,expires,valid to,date of expiry",
    synonyms: "ISO 13485, QMS certificate, valid until",
    embedding: null,
  };
  const c = new DeterministicLlmClient((code) => (code === clause.code ? forMatching : undefined));

  test("produces well-formed verdicts of all three kinds", async () => {
    const pass = await c.verify({ clause, dossier: "ISO 13485:2016 certificate number DE-QMS-2022-77413, valid until 10 April 2026." });
    const minor = await c.verify({ clause, dossier: "The site holds an ISO 13485 certificate; details available on request." });
    const reject = await c.verify({ clause, dossier: "The device is powered by four AA batteries and weighs 300 g." });
    assert.equal(pass.verdict, "PASS");
    assert.equal(minor.verdict, "MINOR_IMPROVEMENT");
    assert.equal(reject.verdict, "REJECT");
    for (const v of [pass, minor, reject]) {
      assert.equal(v.source, "deterministic");
      assert.ok(v.confidence >= 0 && v.confidence <= 1);
      assert.equal(typeof v.fixNote, "string");
    }
    assert.ok(pass.fixNote === "" && reject.fixNote.length > 0);
  });
});
