import type { Response } from "express";
import PDFDocument from "pdfkit";
import { VERDICT_LABEL, type Verdict, countByVerdict, effectiveVerdict } from "./verdicts";

type ReportFinding = {
  aiVerdict: string;
  aiConfidence: number;
  aiEvidenceSnippet: string;
  aiEvidenceKind: string;
  aiFixNote: string;
  aiEngine: string;
  reviewerVerdict: string | null;
  reviewerComment: string | null;
  clause: {
    clauseRef: string;
    title: string;
    category: string;
    requirementText: string;
    mandatory: boolean;
    deviceTypeId: string | null;
  };
};

type ReportAudit = {
  id: string;
  dossierFilename: string;
  createdAt: Date;
  overallResult: string;
  engine: string;
  submittedBy: string;
  deviceType: { name: string; riskClass: string; particularStandard: string };
  findings: ReportFinding[];
};

const INK = "#111827";
const MUTED = "#6b7280";
const RULE = "#d1d5db";
const COLORS: Record<Verdict, string> = {
  PASS: "#15803d",
  MINOR_IMPROVEMENT: "#b45309",
  REJECT: "#b91c1c",
};

/**
 * Streams a regulator-style audit report straight to the HTTP response.
 * pdfkit is used rather than a headless browser so there is no extra binary
 * dependency to install.
 */
export function streamAuditReport(audit: ReportAudit, res: Response): void {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  doc.pipe(res);

  const counts = countByVerdict(audit.findings);
  const overall = audit.overallResult as Verdict;

  // ---- Cover block ----
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text("MedDevAudit-IN");
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text("Compliance audit report — Medical Device Rules, 2017 (India)");
  doc.moveDown(1);

  rule(doc);
  doc.moveDown(0.6);

  kv(doc, "Device type", `${audit.deviceType.name}  (Class ${audit.deviceType.riskClass})`);
  kv(doc, "Particular standard", audit.deviceType.particularStandard);
  kv(doc, "Dossier", audit.dossierFilename);
  kv(doc, "Audit reference", audit.id);
  kv(doc, "Date of review", audit.createdAt.toLocaleString("en-IN"));
  kv(doc, "Reviewed by", audit.submittedBy);
  kv(doc, "Screening engine", engineLabel(audit.engine));

  doc.moveDown(0.6);
  rule(doc);
  doc.moveDown(0.8);

  // ---- Overall result ----
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("Overall result");
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS[overall]).text(VERDICT_LABEL[overall].toUpperCase());
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      `${counts.PASS} pass · ${counts.MINOR_IMPROVEMENT} minor improvement required · ${counts.REJECT} reject · ${audit.findings.length} clauses screened`,
    );
  doc.moveDown(0.3);
  doc
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(
      "Result rule: REJECT if any mandatory clause is rejected; MINOR IMPROVEMENT if any clause is incomplete and no mandatory clause is rejected; otherwise PASS.",
      { width: 495 },
    );

  doc.moveDown(1);

  // ---- Findings grouped by category ----
  const byCategory = new Map<string, ReportFinding[]>();
  for (const finding of audit.findings) {
    const list = byCategory.get(finding.clause.category) ?? [];
    list.push(finding);
    byCategory.set(finding.clause.category, list);
  }

  for (const [category, findings] of byCategory) {
    ensureSpace(doc, 90);
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(INK).text(category);
    doc.moveDown(0.3);
    rule(doc);
    doc.moveDown(0.5);

    for (const finding of findings) {
      writeFinding(doc, finding);
    }
  }

  // ---- Footer on every page ----
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `MedDevAudit-IN · audit ${audit.id} · page ${i + 1} of ${range.count} · prototype output, not a regulatory determination`,
        50,
        doc.page.height - 38,
        { width: doc.page.width - 100, align: "center", lineBreak: false },
      );
  }

  doc.end();
}

function writeFinding(doc: PDFKit.PDFDocument, finding: ReportFinding): void {
  ensureSpace(doc, 150);

  const verdict = effectiveVerdict(finding);
  const overridden = Boolean(finding.reviewerVerdict);

  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS[verdict]).text(VERDICT_LABEL[verdict].toUpperCase(), {
    continued: true,
  });
  doc
    .font("Helvetica")
    .fillColor(MUTED)
    .text(
      `   ${finding.clause.clauseRef}${finding.clause.mandatory ? "  · mandatory" : "  · advisory"}` +
        `   · confidence ${(finding.aiConfidence * 100).toFixed(0)}%` +
        (overridden ? "   · reviewer override" : ""),
    );

  doc.moveDown(0.15);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(finding.clause.title);
  doc.moveDown(0.25);

  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text("Requirement");
  doc.font("Helvetica").fontSize(9).fillColor(INK).text(finding.clause.requirementText, { width: 495 });

  if (finding.aiEvidenceSnippet) {
    doc.moveDown(0.25);
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(
        finding.aiEvidenceKind === "semantic"
          ? "Closest related passage (no direct match for this requirement)"
          : "Evidence found in dossier",
      );
    doc
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor(INK)
      .text(`"${finding.aiEvidenceSnippet}"`, { width: 495, indent: 10 });
  }

  if (finding.aiFixNote) {
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text("Required action");
    doc.font("Helvetica").fontSize(9).fillColor(COLORS[verdict]).text(finding.aiFixNote, { width: 495 });
  }

  if (finding.reviewerComment) {
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text("Reviewer comment");
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(finding.reviewerComment, { width: 495 });
  }

  doc.moveDown(0.7);
}

function kv(doc: PDFKit.PDFDocument, key: string, value: string): void {
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`${key}: `, { continued: true });
  doc.font("Helvetica-Bold").fillColor(INK).text(value);
}

function rule(doc: PDFKit.PDFDocument): void {
  const y = doc.y;
  doc.strokeColor(RULE).lineWidth(0.7).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 60) doc.addPage();
}

function engineLabel(engine: string): string {
  if (engine === "llm") return "Grounded LLM verification (Claude)";
  if (engine === "mixed") return "Grounded LLM with hybrid lexical + semantic fallback on some clauses";
  return "Hybrid lexical + semantic matcher (no API key configured)";
}
