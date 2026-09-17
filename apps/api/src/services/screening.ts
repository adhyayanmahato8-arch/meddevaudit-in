import { prisma } from "@meddevaudit/db";
import { runMatching, type ClauseForMatching } from "./matcher";
import { computeOverallResult } from "./verdicts";

/**
 * Screens one audit end to end: loads the applicable clauses, runs the
 * matcher over the stored dossier text, writes findings and the final status.
 * Progress is written to statusMessage so the report page can show it.
 *
 * Called from the screening worker process (scripts/screen-audit.ts), never
 * directly from a request handler — embedding a long dossier is CPU-bound
 * and would block the web server's event loop.
 */
export async function screenAudit(auditId: string): Promise<void> {
  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error(`audit ${auditId} not found`);
  if (audit.status !== "RUNNING") return;

  try {
    const clauseRows = await prisma.clause.findMany({
      where: { OR: [{ deviceTypeId: null }, { deviceTypeId: audit.deviceTypeId }] },
      orderBy: [{ deviceTypeId: "asc" }, { sortOrder: "asc" }],
    });

    const clauses: ClauseForMatching[] = clauseRows.map((clause) => ({
      id: clause.id,
      code: clause.code,
      clauseRef: clause.clauseRef,
      title: clause.title,
      requirementText: clause.requirementText,
      guidance: clause.guidance,
      mandatory: clause.mandatory,
      keywords: clause.keywords,
      synonyms: clause.synonyms,
      embedding: clause.embedding,
      category: clause.category,
    }));

    await prisma.audit.update({ where: { id: auditId }, data: { statusMessage: "Indexing dossier passages…" } });

    let lastProgressWrite = 0;
    const { results, engine, retrievalMode, notes } = await runMatching(clauses, audit.dossierText, (done, total) => {
      const now = Date.now();
      // The final update below writes the engine notes; a progress write for
      // the last clause could land after it and overwrite them.
      if (done >= total || now - lastProgressWrite < 750) return;
      lastProgressWrite = now;
      prisma.audit
        .update({ where: { id: auditId }, data: { statusMessage: `${done}/${total} clauses screened` } })
        .catch(() => undefined);
    });

    const mandatoryById = new Map(clauseRows.map((clause) => [clause.id, clause.mandatory]));
    const overallResult = computeOverallResult(
      results.map((result) => ({
        aiVerdict: result.verdict,
        reviewerVerdict: null,
        clause: { mandatory: mandatoryById.get(result.clauseId) ?? true },
      })),
    );

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "COMPLETED",
        statusMessage: notes.join(" "),
        completedAt: new Date(),
        overallResult,
        engine,
        retrievalMode,
        findings: {
          create: results.map((result) => ({
            clauseId: result.clauseId,
            aiVerdict: result.verdict,
            aiConfidence: result.confidence,
            aiEvidenceSnippet: result.evidenceSnippet,
            aiEvidenceKind: result.evidenceKind,
            aiFixNote: result.fixNote,
            aiEngine: result.engine,
          })),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error during screening.";
    await prisma.audit
      .update({ where: { id: auditId }, data: { status: "FAILED", statusMessage: message, completedAt: new Date() } })
      .catch(() => undefined);
    throw error;
  }
}
