/**
 * Renders the whole-dossier fixtures and the two demo dossiers as PDF files
 * under apps/web/public/samples/, so they are served by the deployed site and
 * can be downloaded and uploaded back into New Audit as test inputs with a
 * known expected result.
 *
 *   npx tsx packages/eval/src/build-sample-pdfs.ts
 */
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const ROOT = path.resolve(__dirname, "..", "..", "..");
const OUT = path.join(ROOT, "apps", "web", "public", "samples");
const DOSSIERS = path.join(ROOT, "fixtures", "dossiers");
const SAMPLES = path.join(ROOT, "samples");

type Entry = { file: string; title: string; device: string; expected: string; description: string; kind: "synthetic" };

function render(file: string, title: string, subtitle: string, body: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);
    doc.font("Helvetica-Bold").fontSize(15).text(title);
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(9).fillColor("#555").text(subtitle);
    doc.moveDown(0.3);
    doc
      .fontSize(8)
      .fillColor("#888")
      .text(
        "SYNTHETIC TEST DOCUMENT — assembled from the MedDevAudit-IN evaluation fixtures for the purpose of exercising the auditor. Not a real submission. Device names, companies, certificate and licence numbers are fictitious.",
      );
    doc.moveDown(0.8);
    doc.fillColor("#000").font("Helvetica").fontSize(10.5);
    for (const para of body.split(/\n\s*\n/)) {
      doc.text(para.replace(/\s*\n\s*/g, " ").trim(), { align: "left", lineGap: 2 });
      doc.moveDown(0.6);
    }
    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const index: Entry[] = [];

  for (const f of fs.readdirSync(DOSSIERS).filter((x) => x.endsWith(".json")).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(DOSSIERS, f), "utf8"));
    const file = `${d.name}.pdf`;
    await render(
      path.join(OUT, file),
      `Submission dossier — ${d.deviceSlug.replace(/-/g, " ")}`,
      `Fixture ${d.name} · expected overall result: ${d.expectedOverall}`,
      d.text.replace(/^SUBMISSION DOSSIER.*\n.*\n/, ""),
    );
    index.push({ file, title: d.name, device: d.deviceSlug, expected: d.expectedOverall, description: d.description, kind: "synthetic" });
  }

  const demos: [string, string, string, string][] = [
    ["pulse-oximeter-complete.txt", "demo-pulse-oximeter-complete.pdf", "pulse-oximeter", "PASS"],
    ["bp-monitor-deficient.txt", "demo-bp-monitor-deficient.pdf", "bp-monitor", "REJECT"],
  ];
  for (const [src, file, device, expected] of demos) {
    const text = fs.readFileSync(path.join(SAMPLES, src), "utf8");
    await render(path.join(OUT, file), `Demo dossier — ${device.replace(/-/g, " ")}`, `Expected overall result: ${expected}`, text);
    index.push({
      file,
      title: file.replace(".pdf", ""),
      device,
      expected,
      description: expected === "PASS" ? "The original demo dossier: every clause satisfied in its own vocabulary." : "The original deficient demo dossier: licensing documents missing, self-declaration in place of a Free Sale Certificate, English-only label.",
      kind: "synthetic",
    });
  }

  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`wrote ${index.length} sample PDFs to ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
