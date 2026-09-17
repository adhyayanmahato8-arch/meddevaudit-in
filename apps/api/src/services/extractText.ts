import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ExtractedDocument = {
  filename: string;
  text: string;
};

/**
 * Pulls plain text out of an uploaded dossier file.
 *
 * Supported: PDF (pdf-parse), DOCX (mammoth), and plain text / markdown / csv.
 * `pdf-parse/lib/pdf-parse.js` is imported directly rather than the package
 * root because the root module runs a debug branch that reads a bundled test
 * PDF from disk.
 */
export async function extractText(file: Express.Multer.File): Promise<ExtractedDocument> {
  const name = file.originalname || "dossier";
  const lower = name.toLowerCase();

  if (lower.endsWith(".pdf") || file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return { filename: name, text: normalise(parsed.text) };
  }

  if (
    lower.endsWith(".docx") ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return { filename: name, text: normalise(parsed.value) };
  }

  if (lower.endsWith(".doc")) {
    throw new Error(
      `"${name}" is a legacy .doc file, which cannot be parsed. Re-save it as .docx or .pdf and upload again.`,
    );
  }

  // .txt, .md, .csv and anything else that is realistically text
  return { filename: name, text: normalise(file.buffer.toString("utf8")) };
}

/**
 * Combines several uploaded files into one dossier body, keeping a visible
 * marker for each source document so evidence snippets stay traceable.
 */
export function combineDocuments(docs: ExtractedDocument[]): string {
  return docs
    .map((doc) => `===== DOCUMENT: ${doc.filename} =====\n${doc.text}`)
    .join("\n\n");
}

function normalise(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
