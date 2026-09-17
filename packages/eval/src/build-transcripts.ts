/**
 * Records the hand-written responses as transcript fixtures, keyed by the hash
 * of the exact text the evaluation harness sends the model for that record —
 * the passage embedded in its dossier context (see context.ts). Verifies every
 * evidence_snippet is a verbatim substring of the target passage (allowing an
 * internal "..." ellipsis), so a transcript can never cite words the passage
 * does not contain.
 *
 *   npx tsx packages/eval/src/build-transcripts.ts
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@meddevaudit/db";
import { passageHash, writeTranscript, TRANSCRIPT_DIR } from "@meddevaudit/api/src/llm/replay";
import { ALL_RECORDS } from "./fixtures";
import { HANDWRITTEN } from "./transcripts/handwritten";
import { makeContextBuilder } from "./context";

async function main() {
  const clauses = await prisma.clause.findMany({ include: { deviceType: { select: { slug: true } } } });
  const context = makeContextBuilder(
    clauses.map((c) => ({ code: c.code, deviceSlug: c.deviceType?.slug ?? null })),
    ALL_RECORDS,
    "dossier",
  );

  // Remove stale hand-written transcripts so keys never drift from the context builder.
  if (fs.existsSync(TRANSCRIPT_DIR)) {
    for (const f of fs.readdirSync(TRANSCRIPT_DIR)) {
      const t = JSON.parse(fs.readFileSync(path.join(TRANSCRIPT_DIR, f), "utf8"));
      if (t.source === "hand-written") fs.rmSync(path.join(TRANSCRIPT_DIR, f));
    }
  }

  let written = 0;
  const problems: string[] = [];
  const normalise = (s: string) => s.replace(/\s+/g, " ").trim();

  for (const item of HANDWRITTEN) {
    const record = ALL_RECORDS.find((r) => r.clauseCode === item.clauseCode && r.wordingRelationship === item.wordingRelationship);
    if (!record) {
      problems.push(`${item.clauseCode}/${item.wordingRelationship}: no such fixture passage`);
      continue;
    }
    const passage = normalise(record.passage);
    for (const part of normalise(item.response.evidence_snippet).split("...").map((p) => p.trim()).filter(Boolean)) {
      if (!passage.includes(part)) problems.push(`${item.clauseCode}/${item.wordingRelationship}: evidence not verbatim: "${part.slice(0, 60)}…"`);
    }
    if (record.expectedVerdict !== item.response.verdict) {
      problems.push(`${item.clauseCode}/${item.wordingRelationship}: hand-written verdict ${item.response.verdict} ≠ fixture expectation ${record.expectedVerdict}`);
    }
    const text = context(record);
    writeTranscript({
      clauseCode: item.clauseCode,
      passageHash: passageHash(text),
      passageExcerpt: record.passage.slice(0, 120),
      recordedAt: "2026-09-17T00:00:00.000Z",
      source: "hand-written",
      response: item.response,
    });
    written += 1;
  }

  if (problems.length) {
    console.error("Transcript validation failed:\n  " + problems.join("\n  "));
    process.exit(1);
  }
  const total = fs.readdirSync(TRANSCRIPT_DIR).filter((f) => f.endsWith(".json")).length;
  console.log(`wrote ${written} hand-written transcripts to ${path.relative(process.cwd(), TRANSCRIPT_DIR)} (${total} total on disk)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
