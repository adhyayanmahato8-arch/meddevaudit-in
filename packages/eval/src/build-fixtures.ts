/**
 * Emits the evaluation fixtures from the authored passage pool.
 *
 *   fixtures/eval/<clauseCode>.json   — every annotated passage for that clause
 *   fixtures/dossiers/<name>.json     — whole dossiers assembled from the pool,
 *                                        with per-clause and overall expectations
 *
 * Validation runs first and fails the build if any clause in the database has
 * fewer than three passages, is missing one of the three wording relationships,
 * or if a record names a clause that does not exist. The TypeScript modules
 * under src/fixtures are the source of truth; the JSON is generated and
 * committed so the eval set is inspectable without running anything.
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@meddevaudit/db";
import { computeOverallResult } from "@meddevaudit/api/src/services/verdicts";
import { ALL_RECORDS, type EvalRecord, type WordingRelationship } from "./fixtures";
import { DOSSIERS } from "./fixtures/dossiers";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const EVAL_DIR = path.join(ROOT, "fixtures", "eval");
const DOSSIER_DIR = path.join(ROOT, "fixtures", "dossiers");

const RELATIONSHIPS: WordingRelationship[] = ["SATISFIED_LITERAL", "SATISFIED_PARAPHRASE", "NOT_SATISFIED_DISTRACTOR"];

async function main() {
  const clauses = await prisma.clause.findMany({
    include: { deviceType: { select: { slug: true, name: true } } },
    orderBy: [{ deviceTypeId: "asc" }, { sortOrder: "asc" }],
  });
  const byCode = new Map(clauses.map((c) => [c.code, c]));

  // ---- validate ----------------------------------------------------------
  const problems: string[] = [];
  for (const record of ALL_RECORDS) {
    if (!byCode.has(record.clauseCode)) problems.push(`record references unknown clause code ${record.clauseCode}`);
    if (record.passage.split(/\s+/).length < 40) {
      problems.push(`${record.clauseCode} / ${record.wordingRelationship}: passage is under 40 words — not at submission detail`);
    }
  }
  for (const clause of clauses) {
    const records = ALL_RECORDS.filter((r) => r.clauseCode === clause.code);
    if (records.length < 3) problems.push(`${clause.code} has ${records.length} passages (need ≥3)`);
    for (const rel of RELATIONSHIPS) {
      if (!records.some((r) => r.wordingRelationship === rel)) problems.push(`${clause.code} has no ${rel} passage`);
    }
    for (const r of records) {
      const satisfied = r.wordingRelationship !== "NOT_SATISFIED_DISTRACTOR";
      if (satisfied && r.expectedVerdict !== "PASS") problems.push(`${clause.code}: a SATISFIED passage expects ${r.expectedVerdict}`);
      if (!satisfied && r.expectedVerdict === "PASS") problems.push(`${clause.code}: a DISTRACTOR passage expects PASS`);
    }
  }
  if (problems.length) {
    console.error("Fixture validation failed:\n  " + problems.join("\n  "));
    process.exit(1);
  }

  // ---- per-clause fixtures ------------------------------------------------
  fs.rmSync(EVAL_DIR, { recursive: true, force: true });
  fs.mkdirSync(EVAL_DIR, { recursive: true });
  for (const clause of clauses) {
    const records = ALL_RECORDS.filter((r) => r.clauseCode === clause.code);
    fs.writeFileSync(path.join(EVAL_DIR, `${clause.code}.json`), JSON.stringify(records, null, 2) + "\n");
  }

  // ---- whole-dossier fixtures --------------------------------------------
  fs.rmSync(DOSSIER_DIR, { recursive: true, force: true });
  fs.mkdirSync(DOSSIER_DIR, { recursive: true });

  const summary: { name: string; device: string; clauses: number; absent: number; expectedOverall: string }[] = [];

  for (const spec of DOSSIERS) {
    const device = clauses.find((c) => c.deviceType?.slug === spec.deviceSlug)?.deviceType;
    if (!device) throw new Error(`dossier ${spec.name}: unknown device slug ${spec.deviceSlug}`);
    const applicable = clauses.filter((c) => c.deviceTypeId === null || c.deviceType?.slug === spec.deviceSlug);
    const absent = new Set(spec.absent ?? []);
    for (const code of absent) {
      if (!applicable.some((c) => c.code === code)) throw new Error(`dossier ${spec.name}: absent clause ${code} is not applicable to ${spec.deviceSlug}`);
    }
    for (const code of Object.keys(spec.overrides ?? {})) {
      if (!applicable.some((c) => c.code === code)) throw new Error(`dossier ${spec.name}: override clause ${code} is not applicable to ${spec.deviceSlug}`);
    }

    const composition: {
      clauseCode: string;
      clauseRef: string;
      category: string;
      wordingRelationship: WordingRelationship | "ABSENT";
      expectedVerdict: string;
      rationale: string;
    }[] = [];
    const sections: string[] = [];

    for (const clause of applicable) {
      if (absent.has(clause.code)) {
        composition.push({
          clauseCode: clause.code,
          clauseRef: clause.clauseRef,
          category: clause.category,
          wordingRelationship: "ABSENT",
          expectedVerdict: "REJECT",
          rationale: "No passage addresses this clause anywhere in the dossier; the mandatory document is missing.",
        });
        continue;
      }
      const rel = spec.overrides?.[clause.code] ?? spec.default;
      const record = pickRecord(clause.code, rel);
      composition.push({
        clauseCode: clause.code,
        clauseRef: clause.clauseRef,
        category: clause.category,
        wordingRelationship: rel,
        expectedVerdict: record.expectedVerdict,
        rationale: record.rationale,
      });
      sections.push(record.passage);
    }

    const expectedOverall = computeOverallResult(
      composition.map((c) => ({ aiVerdict: c.expectedVerdict, reviewerVerdict: null, clause: { mandatory: true } })),
    );

    const text =
      `SUBMISSION DOSSIER — ${device.name}\n` +
      `Fixture: ${spec.name} (synthetic evaluation dossier, assembled from annotated passages)\n\n` +
      sections.join("\n\n") +
      "\n";

    fs.writeFileSync(
      path.join(DOSSIER_DIR, `${spec.name}.json`),
      JSON.stringify(
        { name: spec.name, deviceSlug: spec.deviceSlug, description: spec.description, expectedOverall, composition, text },
        null,
        2,
      ) + "\n",
    );
    summary.push({ name: spec.name, device: device.name, clauses: composition.length, absent: absent.size, expectedOverall });
  }

  // ---- report -------------------------------------------------------------
  const counts = { SATISFIED_LITERAL: 0, SATISFIED_PARAPHRASE: 0, NOT_SATISFIED_DISTRACTOR: 0 };
  const verdicts = { PASS: 0, MINOR_IMPROVEMENT: 0, REJECT: 0 };
  for (const r of ALL_RECORDS) {
    counts[r.wordingRelationship] += 1;
    verdicts[r.expectedVerdict] += 1;
  }
  console.log(`fixtures/eval: ${clauses.length} clause files, ${ALL_RECORDS.length} passages`);
  console.log(`  literal ${counts.SATISFIED_LITERAL} · paraphrase ${counts.SATISFIED_PARAPHRASE} · distractor ${counts.NOT_SATISFIED_DISTRACTOR}`);
  console.log(`  expected: PASS ${verdicts.PASS} · MINOR ${verdicts.MINOR_IMPROVEMENT} · REJECT ${verdicts.REJECT}`);
  const words = ALL_RECORDS.reduce((n, r) => n + r.passage.split(/\s+/).length, 0);
  console.log(`  ${words.toLocaleString()} words, mean ${Math.round(words / ALL_RECORDS.length)} per passage`);
  console.log(`fixtures/dossiers: ${summary.length} whole-dossier fixtures`);
  for (const s of summary) console.log(`  ${s.name.padEnd(38)} ${s.clauses} clauses (${s.absent} absent) → ${s.expectedOverall}`);
}

function pickRecord(code: string, rel: WordingRelationship): EvalRecord {
  const record = ALL_RECORDS.find((r) => r.clauseCode === code && r.wordingRelationship === rel);
  if (!record) throw new Error(`no ${rel} passage for ${code}`);
  return record;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
