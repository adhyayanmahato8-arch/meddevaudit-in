import { Router } from "express";
import multer from "multer";
import { prisma } from "@meddevaudit/db";
import { combineDocuments, extractText, type ExtractedDocument } from "../services/extractText";
import { streamAuditReport } from "../services/pdfReport";
import { computeOverallResult, countByVerdict, effectiveVerdict } from "../services/verdicts";
import { enqueueScreening } from "../services/screeningQueue";
import { hasLlm, env } from "../env";

export const auditsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

const VALID_VERDICTS = new Set(["PASS", "MINOR_IMPROVEMENT", "REJECT"]);

/**
 * POST /api/audits
 * Accepts either multipart/form-data (deviceTypeId + one or more `files`,
 * optionally plus a `text` field) or JSON ({ deviceTypeId, text, filename }).
 * Runs every applicable clause and persists the audit with its findings.
 */
auditsRouter.post("/audits", upload.array("files", 10), async (req, res, next) => {
  try {
    const deviceTypeId = String(req.body?.deviceTypeId ?? "").trim();
    const pastedText = String(req.body?.text ?? "").trim();
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (!deviceTypeId) {
      return res.status(400).json({ error: "deviceTypeId is required." });
    }

    const deviceType = await prisma.deviceType.findUnique({ where: { id: deviceTypeId } });
    if (!deviceType) {
      return res.status(404).json({ error: "Unknown device type." });
    }

    if (files.length === 0 && !pastedText) {
      return res.status(400).json({ error: "Upload at least one dossier file, or paste the dossier text." });
    }

    const documents: ExtractedDocument[] = [];
    for (const file of files) {
      documents.push(await extractText(file));
    }
    if (pastedText) {
      documents.push({ filename: String(req.body?.filename || "Pasted dossier text"), text: pastedText });
    }

    const dossierText = combineDocuments(documents);
    if (dossierText.replace(/=+ DOCUMENT:.*?=+/g, "").trim().length < 40) {
      return res.status(400).json({
        error:
          "No readable text could be extracted from the submission. If the PDF is a scan, it needs OCR before it can be screened.",
      });
    }

    const dossierLabel =
      documents.length === 1 ? documents[0].filename : `${documents.length} documents (${documents[0].filename}, …)`;

    // The audit record is created immediately and screened in the background.
    // Screening a long document embeds every passage, which on a small host can
    // take minutes — longer than an HTTP proxy will hold a request open. The
    // client polls GET /api/audits/:id until status is COMPLETED or FAILED.
    const audit = await prisma.audit.create({
      data: {
        deviceTypeId,
        dossierFilename: dossierLabel,
        dossierText,
        status: "RUNNING",
        statusMessage: "Queued",
      },
    });

    res.status(202).json({ id: audit.id, status: "RUNNING" });
    enqueueScreening(audit.id);
  } catch (error) {
    next(error);
  }
});

/** GET /api/audits — history, newest first. */
auditsRouter.get("/audits", async (_req, res, next) => {
  try {
    const audits = await prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        deviceType: { select: { id: true, name: true, riskClass: true } },
        findings: { select: { aiVerdict: true, reviewerVerdict: true } },
      },
    });

    res.json(
      audits.map((audit) => ({
        id: audit.id,
        createdAt: audit.createdAt,
        dossierFilename: audit.dossierFilename,
        status: audit.status,
        statusMessage: audit.statusMessage,
        overallResult: audit.overallResult,
        engine: audit.engine,
        submittedBy: audit.submittedBy,
        deviceType: audit.deviceType,
        counts: countByVerdict(audit.findings),
        clauseCount: audit.findings.length,
        overriddenCount: audit.findings.filter((f) => f.reviewerVerdict).length,
      })),
    );
  } catch (error) {
    next(error);
  }
});

/** GET /api/audits/summary — dashboard aggregates. */
auditsRouter.get("/audits/summary", async (_req, res, next) => {
  try {
    // Only finished audits carry a result; running or failed ones are excluded
    // from the aggregates so the pass rate is not diluted.
    const audits = await prisma.audit.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: {
        deviceType: { select: { name: true, riskClass: true } },
        findings: { include: { clause: { select: { title: true, clauseRef: true, category: true } } } },
      },
    });

    const totals = { PASS: 0, MINOR_IMPROVEMENT: 0, REJECT: 0 };
    const gapFrequency = new Map<string, { title: string; clauseRef: string; category: string; count: number }>();

    for (const audit of audits) {
      totals[audit.overallResult as keyof typeof totals] += 1;
      for (const finding of audit.findings) {
        if (effectiveVerdict(finding) === "PASS") continue;
        const key = finding.clause.clauseRef;
        const existing = gapFrequency.get(key);
        if (existing) existing.count += 1;
        else
          gapFrequency.set(key, {
            title: finding.clause.title,
            clauseRef: finding.clause.clauseRef,
            category: finding.clause.category,
            count: 1,
          });
      }
    }

    const totalAudits = audits.length;
    res.json({
      totalAudits,
      passRate: totalAudits === 0 ? 0 : Math.round((totals.PASS / totalAudits) * 100),
      resultTotals: totals,
      topGaps: [...gapFrequency.values()].sort((a, b) => b.count - a.count).slice(0, 6),
      recent: audits.slice(0, 6).map((audit) => ({
        id: audit.id,
        createdAt: audit.createdAt,
        dossierFilename: audit.dossierFilename,
        overallResult: audit.overallResult,
        deviceTypeName: audit.deviceType.name,
        counts: countByVerdict(audit.findings),
      })),
      engine: { llmConfigured: hasLlm, model: hasLlm ? env.anthropicModel : null },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/audits/:id — the full report with every finding and clause. */
auditsRouter.get("/audits/:id", async (req, res, next) => {
  try {
    const audit = await loadAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found." });

    res.json({
      id: audit.id,
      createdAt: audit.createdAt,
      dossierFilename: audit.dossierFilename,
      status: audit.status,
      statusMessage: audit.statusMessage,
      completedAt: audit.completedAt,
      overallResult: audit.overallResult,
      engine: audit.engine,
      retrievalMode: audit.retrievalMode,
      submittedBy: audit.submittedBy,
      deviceType: audit.deviceType,
      counts: countByVerdict(audit.findings),
      dossierPreview: audit.dossierText.slice(0, 4000),
      dossierLength: audit.dossierText.length,
      findings: audit.findings.map((finding) => ({
        id: finding.id,
        aiVerdict: finding.aiVerdict,
        aiConfidence: finding.aiConfidence,
        aiEvidenceSnippet: finding.aiEvidenceSnippet,
        aiEvidenceKind: finding.aiEvidenceKind,
        aiFixNote: finding.aiFixNote,
        aiEngine: finding.aiEngine,
        reviewerVerdict: finding.reviewerVerdict,
        reviewerComment: finding.reviewerComment,
        reviewedAt: finding.reviewedAt,
        effectiveVerdict: effectiveVerdict(finding),
        clause: {
          id: finding.clause.id,
          category: finding.clause.category,
          clauseRef: finding.clause.clauseRef,
          title: finding.clause.title,
          requirementText: finding.clause.requirementText,
          guidance: finding.clause.guidance,
          mandatory: finding.clause.mandatory,
          scope: finding.clause.deviceTypeId ? "DEVICE_SPECIFIC" : "COMMON_CORE",
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/audits/:id/findings/:findingId — human-in-the-loop override.
 * Sending reviewerVerdict: null clears the override and restores the AI verdict.
 * The audit's overall result is recomputed on every override.
 */
auditsRouter.patch("/audits/:id/findings/:findingId", async (req, res, next) => {
  try {
    const { id, findingId } = req.params;
    const hasVerdict = Object.prototype.hasOwnProperty.call(req.body ?? {}, "reviewerVerdict");
    const rawVerdict = req.body?.reviewerVerdict;
    const comment = req.body?.reviewerComment;

    if (hasVerdict && rawVerdict !== null && rawVerdict !== "" && !VALID_VERDICTS.has(String(rawVerdict))) {
      return res.status(400).json({ error: "reviewerVerdict must be PASS, MINOR_IMPROVEMENT, REJECT or null." });
    }

    const existing = await prisma.finding.findFirst({ where: { id: findingId, auditId: id } });
    if (!existing) return res.status(404).json({ error: "Finding not found on this audit." });

    const reviewerVerdict = hasVerdict
      ? rawVerdict === null || rawVerdict === ""
        ? null
        : String(rawVerdict)
      : existing.reviewerVerdict;

    await prisma.finding.update({
      where: { id: findingId },
      data: {
        reviewerVerdict,
        reviewerComment:
          comment === undefined ? existing.reviewerComment : String(comment).trim() || null,
        reviewedAt: new Date(),
      },
    });

    const audit = await loadAudit(id);
    if (!audit) return res.status(404).json({ error: "Audit not found." });

    const overallResult = computeOverallResult(audit.findings);
    await prisma.audit.update({ where: { id }, data: { overallResult } });

    const updated = audit.findings.find((f) => f.id === findingId)!;
    res.json({
      overallResult,
      counts: countByVerdict(audit.findings),
      finding: {
        id: updated.id,
        reviewerVerdict,
        reviewerComment: comment === undefined ? updated.reviewerComment : String(comment).trim() || null,
        effectiveVerdict: (reviewerVerdict || updated.aiVerdict) as string,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/audits/:id/export — downloadable PDF audit report. */
auditsRouter.get("/audits/:id/export", async (req, res, next) => {
  try {
    const audit = await loadAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: "Audit not found." });
    if (audit.status !== "COMPLETED") {
      return res.status(409).json({ error: `Audit is ${audit.status.toLowerCase()}; a report can be exported once screening has completed.` });
    }

    const safeName = `MedDevAudit-IN_${audit.deviceType.name.replace(/[^a-z0-9]+/gi, "-")}_${audit.id.slice(-6)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    streamAuditReport(audit, res);
  } catch (error) {
    next(error);
  }
});

function loadAudit(id: string) {
  return prisma.audit.findUnique({
    where: { id },
    include: {
      deviceType: true,
      findings: {
        include: { clause: true },
        orderBy: [{ clause: { deviceTypeId: "asc" } }, { clause: { sortOrder: "asc" } }],
      },
    },
  });
}
