import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normaliseVerdict } from "./parse";
import { LlmError, type LlmClient, type LlmRawVerdict, type LlmVerdict, type LlmVerdictRequest } from "./types";

/**
 * Transcript fixtures live at fixtures/llm-transcripts/<clauseCode>__<hash>.json
 * where <hash> is the first 12 hex chars of the SHA-256 of the normalised
 * dossier text. Keying on the passage means a transcript can only ever be
 * replayed against the exact text it was recorded for.
 */
export const TRANSCRIPT_DIR = path.resolve(__dirname, "..", "..", "..", "..", "fixtures", "llm-transcripts");

export type Transcript = {
  clauseCode: string;
  passageHash: string;
  passageExcerpt: string;
  recordedAt: string;
  /** "hand-written" when authored without a model; "live" when recorded from the API. */
  source: "hand-written" | "live";
  model?: string;
  response: LlmRawVerdict;
};

export function passageHash(dossier: string): string {
  const normalised = dossier.replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalised, "utf8").digest("hex").slice(0, 12);
}

export function transcriptPath(clauseCode: string, dossier: string, dir = TRANSCRIPT_DIR): string {
  return path.join(dir, `${clauseCode}__${passageHash(dossier)}.json`);
}

export function writeTranscript(transcript: Transcript, dir = TRANSCRIPT_DIR): string {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${transcript.clauseCode}__${transcript.passageHash}.json`);
  fs.writeFileSync(file, JSON.stringify(transcript, null, 2) + "\n");
  return file;
}

export class ReplayLlmClient implements LlmClient {
  readonly kind = "replay" as const;
  constructor(private readonly dir = TRANSCRIPT_DIR) {}

  has(request: LlmVerdictRequest): boolean {
    return fs.existsSync(transcriptPath(request.clause.code, request.dossier, this.dir));
  }

  async verify(request: LlmVerdictRequest): Promise<LlmVerdict> {
    const file = transcriptPath(request.clause.code, request.dossier, this.dir);
    if (!fs.existsSync(file)) {
      throw new LlmError(
        `no transcript for ${request.clause.code} / ${passageHash(request.dossier)} — record one with a live run`,
        "REPLAY_MISS",
        false,
      );
    }
    const transcript = JSON.parse(fs.readFileSync(file, "utf8")) as Transcript;
    const verdict = normaliseVerdict(transcript.response, "replay");
    return { ...verdict, meta: { transcript: path.basename(file), recordedSource: transcript.source } };
  }
}
