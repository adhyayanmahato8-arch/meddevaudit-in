/**
 * Evaluation harness.
 *
 *   npm run eval                          hybrid matcher: calibrate on the
 *                                         calibration split, report held-out
 *   npm run eval -- --matcher=llm         replay client over recorded transcripts
 *   npm run eval -- --matcher=llm --live  real API; records transcripts as it goes
 *   options: --seed=42  --floor=0.80  --report=<dir>
 *
 * Split: the 33 clauses are divided 60/40 into calibration and held-out,
 * stratified by clause category and at CLAUSE level — all three passages of a
 * clause land on the same side, so held-out measures behaviour on clauses the
 * thresholds never saw. Thresholds are swept on calibration only. Whole-dossier
 * fixtures are reported separately as a system-level check; they contain
 * calibration passages, so they are not held-out and are labelled as such.
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@meddevaudit/db";
import { fallbackMatch, type ClauseForMatching, type MatchSignals } from "@meddevaudit/api/src/services/matcher";
import { HybridIndex } from "@meddevaudit/api/src/services/retrieval";
import { decide, DEFAULT_THRESHOLDS, type ThresholdParams } from "@meddevaudit/api/src/services/thresholds";
import { computeOverallResult } from "@meddevaudit/api/src/services/verdicts";
import { env } from "@meddevaudit/api/src/env";
import {
  createLlmClient,
  passageHash,
  writeTranscript,
  LlmError,
  type LlmClient,
  type LlmClause,
} from "@meddevaudit/api/src/llm";
import { evaluate, pct, rng, shuffle, VERDICTS, type Labelled, type Report, type Verdict } from "./metrics";
import { makeContextBuilder } from "./context";
import type { EvalRecord } from "./fixtures/types";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const EVAL_DIR = path.join(ROOT, "fixtures", "eval");
const DOSSIER_DIR = path.join(ROOT, "fixtures", "dossiers");

// ---------------------------------------------------------------- CLI
const args = new Map<string, string>();
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}
const MATCHER = (args.get("matcher") ?? "hybrid") as "hybrid" | "llm";
const LIVE = args.get("live") === "true";
const SEED = Number.parseInt(args.get("seed") ?? "42", 10);
const FLOOR = Number.parseFloat(args.get("floor") ?? "0.80");
const REPORT_DIR = path.resolve(args.get("report") ?? path.join(ROOT, "reports"));
/**
 * Evaluation unit. "dossier" (default) embeds each passage among the literal
 * passages of every other applicable clause, so retrieval statistics (BM25
 * IDF, normalisation, competing passages) match what the matcher sees in
 * production — thresholds calibrated this way transfer. "isolated" scores the
 * bare passage; cleaner, but it was found to over-flag in real dossiers.
 */
const CONTEXT = (args.get("context") ?? "dossier") as "dossier" | "isolated";
/**
 * Whether the sweep may gate PASS on the retrieval score (tauPass > 0).
 * Default off. Measured signal distributions show non-satisfying distractors
 * are MORE topical than genuine paraphrases (they are written to be), so a
 * topicality gate cannot separate them; it only strips PASS from literal
 * passages whose retrieval sits below the cut, and that cut over-fits the
 * calibration score distribution (a gate of 0.45–0.55 chosen on 19 clauses
 * dropped the complete demo dossier from 17/17 to 8/17 passes). With the gate
 * off, retrieval still softens REJECT → MINOR and supplies context.
 * --pass-gate re-enables it for comparison.
 */
const PASS_GATE = args.get("pass-gate") === "true";

// ---------------------------------------------------------------- types
type Row = EvalRecord & { category: string };
type Scored = Row & { signals: MatchSignals; predicted: Verdict; confidence: number };

async function main() {
  const started = Date.now();
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // ---- load clauses and fixtures -----------------------------------------
  const clauseRows = await prisma.clause.findMany({ include: { deviceType: { select: { slug: true } } } });
  const clauses = new Map<string, ClauseForMatching & { deviceSlug: string | null }>();
  for (const c of clauseRows) {
    clauses.set(c.code, {
      id: c.id,
      code: c.code,
      clauseRef: c.clauseRef,
      title: c.title,
      requirementText: c.requirementText,
      guidance: c.guidance,
      mandatory: c.mandatory,
      keywords: c.keywords,
      synonyms: c.synonyms,
      embedding: c.embedding,
      category: c.category,
      deviceSlug: c.deviceType?.slug ?? null,
    });
  }

  const records: Row[] = [];
  for (const file of fs.readdirSync(EVAL_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const items = JSON.parse(fs.readFileSync(path.join(EVAL_DIR, file), "utf8")) as EvalRecord[];
    for (const r of items) {
      const clause = clauses.get(r.clauseCode);
      if (!clause) throw new Error(`fixture ${file} references unknown clause ${r.clauseCode}`);
      records.push({ ...r, category: clause.category });
    }
  }

  // ---- clause-level stratified split -------------------------------------
  const random = rng(SEED);
  const byCategory = new Map<string, string[]>();
  for (const c of clauses.values()) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c.code);
    byCategory.set(c.category, list);
  }
  const calibrationCodes = new Set<string>();
  const heldOutCodes = new Set<string>();
  for (const [, codes] of [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const order = shuffle(codes.sort(), random);
    const nCal = Math.max(1, Math.round(order.length * 0.6));
    // A single-clause category cannot be split; it is assigned by coin flip so
    // that, across categories, both splits still see every kind of clause.
    if (order.length === 1) {
      (random() < 0.6 ? calibrationCodes : heldOutCodes).add(order[0]);
      continue;
    }
    order.slice(0, nCal).forEach((c) => calibrationCodes.add(c));
    order.slice(nCal).forEach((c) => heldOutCodes.add(c));
  }
  const calibration = records.filter((r) => calibrationCodes.has(r.clauseCode));
  const heldOut = records.filter((r) => heldOutCodes.has(r.clauseCode));

  console.log(`\nMedDevAudit-IN evaluation — matcher=${MATCHER}${LIVE ? " (live)" : ""} seed=${SEED} context=${CONTEXT}`);
  console.log(`  clauses: ${clauses.size} → calibration ${calibrationCodes.size} / held-out ${heldOutCodes.size}`);
  console.log(`  passages: ${records.length} → calibration ${calibration.length} / held-out ${heldOut.length}`);

  const context = makeContextBuilder([...clauses.values()], records, CONTEXT);
  if (MATCHER === "hybrid") await runHybrid({ clauses, calibration, heldOut, started, context });
  else await runLlm({ clauses, heldOut, calibration, started, context });
}

// ============================================================================
// HYBRID: score once, sweep thresholds on calibration, report held-out
// ============================================================================
async function runHybrid(ctx: {
  clauses: Map<string, ClauseForMatching & { deviceSlug: string | null }>;
  calibration: Row[];
  heldOut: Row[];
  started: number;
  context: (record: Row) => string;
}) {
  const { clauses, calibration, heldOut, context } = ctx;

  // Signals are independent of thresholds, so compute them once per passage.
  async function score(rows: Row[], params: ThresholdParams): Promise<Scored[]> {
    const out: Scored[] = [];
    let mode: string | null = null;
    for (const row of rows) {
      const clause = clauses.get(row.clauseCode)!;
      const text = context(row);
      const index = await HybridIndex.build(text);
      mode ??= index.mode;
      const result = fallbackMatch(clause, text, index, params);
      out.push({ ...row, signals: result.signals, predicted: result.verdict, confidence: result.confidence });
    }
    if (mode && mode !== "hybrid") console.warn(`  ! retrieval mode is ${mode} — embeddings unavailable; results reflect BM25 only`);
    return out;
  }

  process.stdout.write("  scoring calibration passages… ");
  const calScored = await score(calibration, DEFAULT_THRESHOLDS);
  console.log("done");

  // ---- sweep ---------------------------------------------------------------
  const grid: ThresholdParams[] = [];
  const tauPassValues = PASS_GATE ? Array.from({ length: 17 }, (_, i) => round(i * 0.05)) : [0];
  for (const covPass of [0.5, 0.6, 0.67, 0.75, 0.8, 1.0])
    for (const tauPass of tauPassValues)
      for (let tauSoften = 0.2; tauSoften <= 0.9501; tauSoften += 0.05)
        grid.push({ covPass, tauPass, tauSoften: round(tauSoften), tauContext: 0.2 });

  type Candidate = { params: ThresholdParams; report: Report; literalPassRecall: number };
  const literal = calScored.filter((s) => s.wordingRelationship === "SATISFIED_LITERAL");
  const candidates: Candidate[] = grid.map((params) => {
    const predictedFor = (s: Scored) => decide(s.signals.coverage, s.signals.retrieval, params);
    return {
      params,
      report: evaluate(calScored.map((s) => ({ expected: s.expectedVerdict, predicted: predictedFor(s) }))),
      literalPassRecall: literal.length ? literal.filter((s) => predictedFor(s) === "PASS").length / literal.length : 0,
    };
  });

  const meetsFloor = candidates.filter((c) => c.report.nonCompliance.precision >= FLOOR);
  const floorMet = meetsFloor.length > 0;
  const byPrimary = (a: Candidate, b: Candidate) =>
    b.report.nonCompliance.recall - a.report.nonCompliance.recall ||
    b.report.macroF1 - a.report.macroF1 ||
    b.report.accuracy - a.report.accuracy ||
    a.params.tauSoften - b.params.tauSoften;
  // Secondary rule, used ONLY when no configuration reaches the floor. The
  // primary rule then degenerates to "flag everything" (recall 100 %, precision
  // = base rate), which is not an operating point anyone can use — and when
  // precision is flat across the frontier, plain max-F1 lands on the same
  // point. So the fallback is two-sided: maximise non-compliance F1 subject to
  // PASS-recall on LITERAL satisfied passages ≥ LITERAL_PASS_FLOOR, i.e. do not
  // destroy the one thing the matcher demonstrably does — recognise a clause
  // satisfied in its own vocabulary. (Whole-class PASS recall is not usable as
  // the constraint: paraphrases are half the PASS class and the matcher cannot
  // pass them, so it tops out near 50 % by construction.) If even that is
  // unattainable, plain max-F1 applies. The report states which rule was used.
  const LITERAL_PASS_FLOOR = 0.8;
  const byFallback = (a: Candidate, b: Candidate) =>
    b.report.nonCompliance.f1 - a.report.nonCompliance.f1 ||
    b.report.macroF1 - a.report.macroF1 ||
    b.report.accuracy - a.report.accuracy;
  const usable = candidates.filter((c) => c.literalPassRecall >= LITERAL_PASS_FLOOR);
  const fallbackPool = usable.length ? usable : candidates;
  const fallbackRule = usable.length
    ? `max non-compliance F1 subject to literal-PASS recall ≥ ${pct(LITERAL_PASS_FLOOR)}`
    : "max non-compliance F1 (literal-PASS constraint unattainable)";
  const pool = floorMet ? [...meetsFloor].sort(byPrimary) : [...fallbackPool].sort(byFallback);
  const chosen = pool[0];
  // For the record: what the unconstrained "flag everything" point looks like.
  const degenerate = [...candidates].sort(byPrimary)[0];

  // Recall/precision frontier: for each recall level, the best precision any
  // configuration attains at or above it. Makes the unattainable floor visible
  // as a curve rather than a single "not met".
  const frontier: { minRecall: number; precision: number; params: ThresholdParams }[] = [];
  for (const minRecall of [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.6, 0.5, 0.4]) {
    const eligible = candidates.filter((c) => c.report.nonCompliance.recall >= minRecall);
    if (!eligible.length) continue;
    const best = eligible.sort((a, b) => b.report.nonCompliance.precision - a.report.nonCompliance.precision)[0];
    frontier.push({ minRecall, precision: best.report.nonCompliance.precision, params: best.params });
  }

  console.log(`  sweep: ${grid.length} configurations, ${meetsFloor.length} meet the precision floor of ${pct(FLOOR)}`);
  console.log(
    `  chosen: covPass=${chosen.params.covPass} tauPass=${chosen.params.tauPass} tauSoften=${chosen.params.tauSoften}` +
      `  (calibration NC recall ${pct(chosen.report.nonCompliance.recall)}, NC precision ${pct(chosen.report.nonCompliance.precision)})`,
  );
  if (!floorMet) {
    console.log(`  ! NO configuration met the floor. Fallback rule applied: ${fallbackRule}.`);
    console.log(
      `    (unconstrained max-recall point would be covPass=${degenerate.params.covPass} tauPass=${degenerate.params.tauPass} tauSoften=${degenerate.params.tauSoften}: ` +
        `NC recall ${pct(degenerate.report.nonCompliance.recall)}, NC precision ${pct(degenerate.report.nonCompliance.precision)}, PASS recall ${pct(degenerate.report.perClass.PASS.recall)})`,
    );
    console.log(`  frontier (best precision attainable at ≥ recall):`);
    for (const f of frontier) console.log(`    recall ≥ ${pct(f.minRecall).padStart(6)} → precision ${pct(f.precision)}`);
  }

  // ---- held-out ------------------------------------------------------------
  process.stdout.write("  scoring held-out passages… ");
  const hoScored = await score(heldOut, chosen.params);
  console.log("done");
  const hoReport = evaluate(hoScored.map((s) => ({ expected: s.expectedVerdict, predicted: s.predicted })));

  // ---- dossiers ------------------------------------------------------------
  const dossierResults = await evaluateDossiers(clauses, async (clause, text) => {
    const index = await HybridIndex.build(text);
    return fallbackMatch(clause, text, index, chosen.params).verdict;
  });

  // ---- persist -------------------------------------------------------------
  fs.writeFileSync(
    path.join(REPORT_DIR, "thresholds.json"),
    JSON.stringify(
      {
        ...chosen.params,
        _calibratedAt: new Date().toISOString(),
        _seed: SEED,
        _precisionFloor: FLOOR,
        _floorMet: floorMet,
        _calibrationClauses: [...new Set(calibration.map((r) => r.clauseCode))].sort(),
      },
      null,
      2,
    ) + "\n",
  );
  writeCsv(path.join(REPORT_DIR, "evaluation.csv"), hoScored);

  const md = renderReport({
    matcher: "hybrid (BM25 + sentence embeddings, keyword coverage)",
    seed: SEED,
    calibrationN: calibration.length,
    heldOutN: heldOut.length,
    calibrationClauses: calibrationCodes(calibration),
    heldOutClauses: calibrationCodes(heldOut),
    heldOut: hoReport,
    scored: hoScored,
    dossiers: dossierResults,
    calibration: {
      floor: FLOOR,
      floorMet,
      gridSize: grid.length,
      meetingFloor: meetsFloor.length,
      chosen: chosen.params,
      chosenCalReport: chosen.report,
      top: pool.slice(0, 5).map((c) => ({ params: c.params, report: c.report })),
      frontier,
      fallbackRule: floorMet ? null : fallbackRule,
      degenerate: floorMet ? null : { params: degenerate.params, report: degenerate.report },
    },
    elapsedMs: Date.now() - ctx.started,
  });
  fs.writeFileSync(path.join(REPORT_DIR, "evaluation.md"), md);
  writeSummaryJson(path.join(REPORT_DIR, "evaluation.json"), {
    matcher: "hybrid",
    report: hoReport,
    scored: hoScored,
    dossiers: dossierResults,
    extra: { floorMet, precisionFloor: FLOOR, thresholds: chosen.params, fallbackRule: floorMet ? null : fallbackRule },
  });
  printSummary(hoReport, hoScored, dossierResults, "reports/evaluation.md");
}

/**
 * Headline numbers for the Settings page and the README. Only held-out
 * figures; per-relationship accuracy is what tells a reader where the matcher
 * fails, so it is included.
 */
function writeSummaryJson(
  file: string,
  input: { matcher: string; report: Report; scored: Scored[]; dossiers: DossierResult[]; extra?: Record<string, unknown> },
) {
  const byRelationship: Record<string, { n: number; accuracy: number; predictedPass: number }> = {};
  for (const rel of ["SATISFIED_LITERAL", "SATISFIED_PARAPHRASE", "NOT_SATISFIED_DISTRACTOR"]) {
    const rows = input.scored.filter((s) => s.wordingRelationship === rel);
    byRelationship[rel] = {
      n: rows.length,
      accuracy: rows.length ? rows.filter((s) => s.predicted === s.expectedVerdict).length / rows.length : 0,
      predictedPass: rows.filter((s) => s.predicted === "PASS").length,
    };
  }
  const judged = input.dossiers.filter((d) => d.predictedOverall !== "n/a");
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        matcher: input.matcher,
        generatedAt: new Date().toISOString(),
        heldOut: {
          n: input.report.n,
          accuracy: input.report.accuracy,
          macroF1: input.report.macroF1,
          nonCompliance: input.report.nonCompliance,
          perClass: input.report.perClass,
          byRelationship,
        },
        dossiers: { judged: judged.length, overallCorrect: judged.filter((d) => d.predictedOverall === d.expectedOverall).length },
        ...input.extra,
      },
      null,
      2,
    ) + "\n",
  );
}

// ============================================================================
// LLM: replay (or live) client, no sweep, held-out report
// ============================================================================
async function runLlm(ctx: {
  clauses: Map<string, ClauseForMatching & { deviceSlug: string | null }>;
  calibration: Row[];
  heldOut: Row[];
  started: number;
  context: (record: Row) => string;
}) {
  const { clauses, heldOut, context } = ctx;
  const client: LlmClient = LIVE ? createLlmClient("live") : createLlmClient("replay");
  if (LIVE) console.log(`  live model: ${env.anthropicModel}`);

  const toLlmClause = (c: ClauseForMatching): LlmClause => ({
    code: c.code,
    clauseRef: c.clauseRef,
    category: c.category,
    title: c.title,
    requirementText: c.requirementText,
    guidance: c.guidance,
    mandatory: c.mandatory,
  });

  async function verify(clause: ClauseForMatching, text: string): Promise<Verdict | null> {
    try {
      const v = await client.verify({ clause: toLlmClause(clause), dossier: text });
      if (LIVE) {
        writeTranscript({
          clauseCode: clause.code,
          passageHash: passageHash(text),
          passageExcerpt: text.slice(0, 120),
          recordedAt: new Date().toISOString(),
          source: "live",
          model: String(v.meta?.model ?? env.anthropicModel),
          response: { verdict: v.verdict, confidence: v.confidence, evidence_snippet: v.evidenceSnippet, fix_note: v.fixNote },
        });
      }
      return v.verdict;
    } catch (error) {
      if (error instanceof LlmError && error.code === "REPLAY_MISS") return null;
      throw error;
    }
  }

  const scored: Scored[] = [];
  let missing = 0;
  process.stdout.write(`  verifying ${heldOut.length} held-out passages via ${client.kind}… `);
  for (const row of heldOut) {
    const clause = clauses.get(row.clauseCode)!;
    const predicted = await verify(clause, context(row));
    if (predicted === null) {
      missing += 1;
      continue;
    }
    scored.push({
      ...row,
      predicted,
      confidence: 0,
      signals: { coverage: 0, retrieval: 0, bm25: 0, semantic: 0, mode: "none" },
    });
  }
  console.log(`done (${scored.length} answered, ${missing} without transcript)`);

  const report = evaluate(scored.map((s) => ({ expected: s.expectedVerdict, predicted: s.predicted })));
  const dossierResults = await evaluateDossiers(clauses, async (clause, text) => (await verify(clause, text)) ?? "PASS", {
    skipMissing: !LIVE,
    verifyRaw: verify,
  });

  writeCsv(path.join(REPORT_DIR, "evaluation-llm.csv"), scored);
  const md = renderReport({
    matcher: LIVE ? `LLM live (${env.anthropicModel})` : "LLM replay (recorded transcripts)",
    seed: SEED,
    calibrationN: ctx.calibration.length,
    heldOutN: heldOut.length,
    calibrationClauses: calibrationCodes(ctx.calibration),
    heldOutClauses: calibrationCodes(heldOut),
    heldOut: report,
    scored,
    dossiers: dossierResults,
    llmCoverage: { answered: scored.length, missing, total: heldOut.length },
    elapsedMs: Date.now() - ctx.started,
  });
  fs.writeFileSync(path.join(REPORT_DIR, "evaluation-llm.md"), md);
  writeSummaryJson(path.join(REPORT_DIR, "evaluation-llm.json"), {
    matcher: LIVE ? "llm-live" : "llm-replay",
    report,
    scored,
    dossiers: dossierResults,
    extra: { coverage: { answered: scored.length, missing, total: heldOut.length }, model: LIVE ? env.anthropicModel : null },
  });
  printSummary(report, scored, dossierResults, "reports/evaluation-llm.md");
  if (!LIVE && missing > 0) {
    console.log(
      `\n  NOTE: ${missing}/${heldOut.length} held-out passages have no recorded transcript. Figures above cover only the ` +
        `${scored.length} that do. Run with --live (ANTHROPIC_API_KEY set) to record the full set.`,
    );
  }
}

// ============================================================================
// Whole-dossier fixtures
// ============================================================================
type DossierFixture = {
  name: string;
  deviceSlug: string;
  expectedOverall: Verdict;
  composition: { clauseCode: string; expectedVerdict: Verdict; wordingRelationship: string }[];
  text: string;
};
type DossierResult = {
  name: string;
  expectedOverall: Verdict;
  predictedOverall: Verdict | "n/a";
  clauseAccuracy: number;
  evaluatedClauses: number;
  ncRecall: number;
  ncPrecision: number;
};

async function evaluateDossiers(
  clauses: Map<string, ClauseForMatching & { deviceSlug: string | null }>,
  predict: (clause: ClauseForMatching, text: string) => Promise<Verdict>,
  options: { skipMissing?: boolean; verifyRaw?: (clause: ClauseForMatching, text: string) => Promise<Verdict | null> } = {},
): Promise<DossierResult[]> {
  const results: DossierResult[] = [];
  const files = fs.readdirSync(DOSSIER_DIR).filter((f) => f.endsWith(".json")).sort();
  process.stdout.write(`  evaluating ${files.length} whole-dossier fixtures… `);
  for (const file of files) {
    const d = JSON.parse(fs.readFileSync(path.join(DOSSIER_DIR, file), "utf8")) as DossierFixture;
    const rows: Labelled[] = [];
    const predictedByClause: { code: string; verdict: Verdict }[] = [];
    let skipped = 0;
    for (const item of d.composition) {
      const clause = clauses.get(item.clauseCode)!;
      let predicted: Verdict | null;
      if (options.skipMissing && options.verifyRaw) {
        predicted = await options.verifyRaw(clause, d.text);
        if (predicted === null) {
          skipped += 1;
          continue;
        }
      } else predicted = await predict(clause, d.text);
      rows.push({ expected: item.expectedVerdict, predicted });
      predictedByClause.push({ code: item.clauseCode, verdict: predicted });
    }
    const r = evaluate(rows);
    const predictedOverall =
      skipped > 0
        ? ("n/a" as const)
        : computeOverallResult(predictedByClause.map((p) => ({ aiVerdict: p.verdict, reviewerVerdict: null, clause: { mandatory: true } })));
    results.push({
      name: d.name,
      expectedOverall: d.expectedOverall,
      predictedOverall,
      clauseAccuracy: r.accuracy,
      evaluatedClauses: rows.length,
      ncRecall: r.nonCompliance.recall,
      ncPrecision: r.nonCompliance.precision,
    });
  }
  console.log("done");
  return results;
}

// ============================================================================
// Reporting
// ============================================================================
function calibrationCodes(rows: Row[]): string[] {
  return [...new Set(rows.map((r) => r.clauseCode))].sort();
}

function writeCsv(file: string, rows: Scored[]) {
  const header = "clauseCode,category,wordingRelationship,expected,predicted,correct,coverage,retrieval,bm25,semantic,confidence";
  const lines = rows.map((r) =>
    [
      r.clauseCode,
      csv(r.category),
      r.wordingRelationship,
      r.expectedVerdict,
      r.predicted,
      r.expectedVerdict === r.predicted ? 1 : 0,
      r.signals.coverage.toFixed(3),
      r.signals.retrieval.toFixed(3),
      r.signals.bm25.toFixed(3),
      r.signals.semantic.toFixed(3),
      r.confidence.toFixed(2),
    ].join(","),
  );
  fs.writeFileSync(file, [header, ...lines].join("\n") + "\n");
}
const csv = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

function renderReport(input: {
  matcher: string;
  seed: number;
  calibrationN: number;
  heldOutN: number;
  calibrationClauses: string[];
  heldOutClauses: string[];
  heldOut: Report;
  scored: Scored[];
  dossiers: DossierResult[];
  calibration?: {
    floor: number;
    floorMet: boolean;
    gridSize: number;
    meetingFloor: number;
    chosen: ThresholdParams;
    chosenCalReport: Report;
    top: { params: ThresholdParams; report: Report }[];
    frontier: { minRecall: number; precision: number; params: ThresholdParams }[];
    fallbackRule: string | null;
    degenerate: { params: ThresholdParams; report: Report } | null;
  };
  llmCoverage?: { answered: number; missing: number; total: number };
  elapsedMs: number;
}): string {
  const { heldOut: r, scored } = input;
  const L: string[] = [];
  L.push(`# MedDevAudit-IN — evaluation report`);
  L.push("");
  L.push(`- **Matcher:** ${input.matcher}`);
  L.push(`- **Generated:** ${new Date().toISOString()} (${(input.elapsedMs / 1000).toFixed(1)} s)`);
  L.push(`- **Split:** clause-level, stratified by category, seed ${input.seed} — calibration ${input.calibrationClauses.length} clauses / ${input.calibrationN} passages; held-out ${input.heldOutClauses.length} clauses / ${input.heldOutN} passages`);
  L.push(`- **Held-out clauses:** ${input.heldOutClauses.join(", ")}`);
  if (input.llmCoverage) {
    L.push(`- **Transcript coverage:** ${input.llmCoverage.answered}/${input.llmCoverage.total} held-out passages answered; ${input.llmCoverage.missing} had no recorded transcript and are excluded from every figure below`);
  }
  L.push("");
  L.push(`> All figures in *Held-out results* are computed on the held-out split only. Nothing was tuned on it.`);
  L.push("");

  if (input.calibration) {
    const c = input.calibration;
    L.push(`## Calibration (calibration split only)`);
    L.push("");
    L.push(`Objective: maximise recall on non-compliance (REJECT ∪ MINOR_IMPROVEMENT) subject to non-compliance precision ≥ **${pct(c.floor)}**; ties broken by macro-F1, then accuracy, then the lower softening threshold.`);
    L.push("");
    L.push(`- Grid: ${c.gridSize} configurations (covPass × tauPass × tauSoften)`);
    L.push(
      `- Meeting the floor: **${c.meetingFloor}**${
        c.floorMet
          ? ""
          : ` — **the floor was not met by any configuration.** The primary rule then degenerates to flagging everything, so the stated fallback rule was applied: *${c.fallbackRule}*. This is a failure to reach the target and is reported as such.`
      }`,
    );
    if (c.degenerate) {
      L.push(
        `- For comparison, the unconstrained max-recall point (\`covPass=${c.degenerate.params.covPass}\`, \`tauPass=${c.degenerate.params.tauPass}\`, \`tauSoften=${c.degenerate.params.tauSoften}\`) gives NC recall ${pct(c.degenerate.report.nonCompliance.recall)} at NC precision ${pct(c.degenerate.report.nonCompliance.precision)} — but PASS recall of only ${pct(c.degenerate.report.perClass.PASS.recall)}, i.e. it flags almost everything and is not a usable operating point.`,
      );
    }
    L.push(`- Chosen: \`covPass=${c.chosen.covPass}\`, \`tauPass=${c.chosen.tauPass}\`, \`tauSoften=${c.chosen.tauSoften}\`, \`tauContext=${c.chosen.tauContext}\``);
    L.push(`- On calibration: NC recall ${pct(c.chosenCalReport.nonCompliance.recall)}, NC precision ${pct(c.chosenCalReport.nonCompliance.precision)}, accuracy ${pct(c.chosenCalReport.accuracy)}, macro-F1 ${pct(c.chosenCalReport.macroF1)}`);
    L.push("");
    L.push(`### Recall / precision frontier (calibration split)`);
    L.push("");
    L.push(`The best non-compliance precision any configuration reaches while holding recall at or above the stated level. This is the whole trade-off the sweep can offer; the floor is drawn against it.`);
    L.push("");
    L.push(`| recall ≥ | best precision | config (covPass / tauPass / tauSoften) |`);
    L.push(`|---|---|---|`);
    for (const f of c.frontier) L.push(`| ${pct(f.minRecall)} | ${pct(f.precision)}${f.precision >= c.floor ? " ✓" : ""} | ${f.params.covPass} / ${f.params.tauPass} / ${f.params.tauSoften} |`);
    L.push("");
    L.push(`| rank | covPass | tauPass | tauSoften | NC recall | NC precision | accuracy | macro-F1 |`);
    L.push(`|---|---|---|---|---|---|---|---|`);
    c.top.forEach((t, i) =>
      L.push(
        `| ${i + 1} | ${t.params.covPass} | ${t.params.tauPass} | ${t.params.tauSoften} | ${pct(t.report.nonCompliance.recall)} | ${pct(t.report.nonCompliance.precision)} | ${pct(t.report.accuracy)} | ${pct(t.report.macroF1)} |`,
      ),
    );
    L.push("");
  }

  L.push(`## Held-out results (n = ${r.n})`);
  L.push("");
  L.push(`| metric | value |`);
  L.push(`|---|---|`);
  L.push(`| Accuracy (3-class) | **${pct(r.accuracy)}** |`);
  L.push(`| Macro-F1 (3-class) | ${pct(r.macroF1)} |`);
  L.push(`| Non-compliance recall | **${pct(r.nonCompliance.recall)}** (${r.nonCompliance.truePositives}/${r.nonCompliance.support}) |`);
  L.push(`| Non-compliance precision | **${pct(r.nonCompliance.precision)}** (${r.nonCompliance.truePositives}/${r.nonCompliance.truePositives + r.nonCompliance.falsePositives}) |`);
  L.push(`| Non-compliance F1 | ${pct(r.nonCompliance.f1)} |`);
  L.push(`| Missed non-compliance (false PASS) | **${r.nonCompliance.falseNegatives}** |`);
  L.push(`| False alarms (compliant flagged) | ${r.nonCompliance.falsePositives} |`);
  L.push("");

  L.push(`### Confusion matrix (rows = expected, columns = predicted)`);
  L.push("");
  L.push(`| expected \\ predicted | PASS | MINOR_IMPROVEMENT | REJECT |`);
  L.push(`|---|---|---|---|`);
  for (const e of VERDICTS) L.push(`| **${e}** | ${r.confusion[e].PASS} | ${r.confusion[e].MINOR_IMPROVEMENT} | ${r.confusion[e].REJECT} |`);
  L.push("");

  L.push(`### Per verdict class`);
  L.push("");
  L.push(`| class | precision | recall | F1 | support |`);
  L.push(`|---|---|---|---|---|`);
  for (const c of VERDICTS) L.push(`| ${c} | ${pct(r.perClass[c].precision)} | ${pct(r.perClass[c].recall)} | ${pct(r.perClass[c].f1)} | ${r.perClass[c].support} |`);
  L.push("");

  L.push(`### Per wording relationship`);
  L.push("");
  L.push(`| relationship | n | accuracy | of which predicted PASS | predicted MINOR | predicted REJECT |`);
  L.push(`|---|---|---|---|---|---|`);
  for (const rel of ["SATISFIED_LITERAL", "SATISFIED_PARAPHRASE", "NOT_SATISFIED_DISTRACTOR"] as const) {
    const rows = scored.filter((s) => s.wordingRelationship === rel);
    if (!rows.length) continue;
    const acc = rows.filter((s) => s.predicted === s.expectedVerdict).length / rows.length;
    const cnt = (v: Verdict) => rows.filter((s) => s.predicted === v).length;
    L.push(`| ${rel} | ${rows.length} | ${pct(acc)} | ${cnt("PASS")} | ${cnt("MINOR_IMPROVEMENT")} | ${cnt("REJECT")} |`);
  }
  L.push("");

  L.push(`### Per clause category`);
  L.push("");
  L.push(`| category | n | accuracy | NC recall | NC precision | NC support |`);
  L.push(`|---|---|---|---|---|---|`);
  const cats = [...new Set(scored.map((s) => s.category))].sort();
  for (const cat of cats) {
    const rows = scored.filter((s) => s.category === cat);
    const rr = evaluate(rows.map((s) => ({ expected: s.expectedVerdict, predicted: s.predicted })));
    L.push(`| ${cat} | ${rr.n} | ${pct(rr.accuracy)} | ${rr.nonCompliance.support ? pct(rr.nonCompliance.recall) : "—"} | ${rr.nonCompliance.truePositives + rr.nonCompliance.falsePositives ? pct(rr.nonCompliance.precision) : "—"} | ${rr.nonCompliance.support} |`);
  }
  L.push("");

  L.push(`### Held-out misses`);
  L.push("");
  const misses = scored.filter((s) => s.predicted !== s.expectedVerdict);
  if (!misses.length) L.push(`None.`);
  else {
    L.push(`| clause | relationship | expected | predicted | coverage | retrieval |`);
    L.push(`|---|---|---|---|---|---|`);
    for (const m of misses) L.push(`| ${m.clauseCode} | ${m.wordingRelationship} | ${m.expectedVerdict} | ${m.predicted} | ${m.signals.coverage.toFixed(2)} | ${m.signals.retrieval.toFixed(2)} |`);
  }
  L.push("");

  L.push(`## Whole-dossier fixtures (system-level check — NOT held-out)`);
  L.push("");
  L.push(`These dossiers are assembled from the same passage pool and therefore contain calibration passages. They test the end-to-end path (multi-passage retrieval, overall-result rule) rather than generalisation.`);
  L.push("");
  L.push(`| dossier | expected overall | predicted overall | clause accuracy | NC recall | NC precision | clauses |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const d of input.dossiers) {
    const mark = d.predictedOverall === "n/a" ? "n/a" : d.predictedOverall === d.expectedOverall ? `${d.predictedOverall} ✓` : `**${d.predictedOverall} ✗**`;
    L.push(`| ${d.name} | ${d.expectedOverall} | ${mark} | ${pct(d.clauseAccuracy)} | ${pct(d.ncRecall)} | ${pct(d.ncPrecision)} | ${d.evaluatedClauses} |`);
  }
  const overallCorrect = input.dossiers.filter((d) => d.predictedOverall === d.expectedOverall).length;
  const overallJudged = input.dossiers.filter((d) => d.predictedOverall !== "n/a").length;
  L.push("");
  L.push(`Overall result correct on **${overallCorrect}/${overallJudged}** dossiers.`);
  L.push("");
  return L.join("\n");
}

function printSummary(r: Report, scored: Scored[], dossiers: DossierResult[], file: string) {
  console.log(`\n  HELD-OUT (n=${r.n})`);
  console.log(`  ┌──────────────────────────┬─────────┐`);
  console.log(`  │ accuracy (3-class)       │ ${pct(r.accuracy).padStart(7)} │`);
  console.log(`  │ macro-F1                 │ ${pct(r.macroF1).padStart(7)} │`);
  console.log(`  │ non-compliance recall    │ ${pct(r.nonCompliance.recall).padStart(7)} │`);
  console.log(`  │ non-compliance precision │ ${pct(r.nonCompliance.precision).padStart(7)} │`);
  console.log(`  │ missed non-compliance    │ ${String(r.nonCompliance.falseNegatives).padStart(7)} │`);
  console.log(`  └──────────────────────────┴─────────┘`);
  console.log(`  confusion (exp→pred)   PASS  MINOR  REJECT`);
  for (const e of VERDICTS) {
    console.log(`    ${e.padEnd(18)} ${String(r.confusion[e].PASS).padStart(5)} ${String(r.confusion[e].MINOR_IMPROVEMENT).padStart(6)} ${String(r.confusion[e].REJECT).padStart(7)}`);
  }
  console.log(`  by relationship:`);
  for (const rel of ["SATISFIED_LITERAL", "SATISFIED_PARAPHRASE", "NOT_SATISFIED_DISTRACTOR"] as const) {
    const rows = scored.filter((s) => s.wordingRelationship === rel);
    if (!rows.length) continue;
    const acc = rows.filter((s) => s.predicted === s.expectedVerdict).length / rows.length;
    console.log(`    ${rel.padEnd(26)} ${pct(acc).padStart(7)}  (n=${rows.length})`);
  }
  const ok = dossiers.filter((d) => d.predictedOverall === d.expectedOverall).length;
  const judged = dossiers.filter((d) => d.predictedOverall !== "n/a").length;
  console.log(`  dossiers: overall result correct ${ok}/${judged}`);
  console.log(`\n  report → ${file}\n`);
}

function round(x: number): number {
  return Math.round(x * 100) / 100;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
