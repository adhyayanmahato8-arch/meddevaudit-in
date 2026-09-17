/**
 * Hybrid lexical + semantic retrieval over one dossier.
 *
 *   score = alpha * semantic + (1 - alpha) * bm25
 *
 * where `semantic` is the cosine similarity between the clause embedding
 * (computed at seed time) and the best dossier passage embedding, and `bm25`
 * is the normalised BM25 score of the clause query — title, requirement text
 * and controlled vocabulary — against the same passages.
 *
 * alpha defaults to 0.65, the value Rayo, de la Rosa & Garrido (COLING 2025,
 * "A Hybrid Approach to Information Retrieval and Answer Generation for
 * Regulatory Texts") found empirically best for regulatory passages. It is
 * configurable through HYBRID_ALPHA.
 *
 * If the embedding model is unavailable the index runs BM25 only and reports
 * `mode: "lexical"` so the UI can say so.
 */
import { Bm25Index, splitPassages } from "./bm25";
import { cosine, getEmbedder, type Embedder } from "./embeddings";
import { env } from "../env";

export type RetrievalMode = "hybrid" | "lexical";

export type RetrievalHit = {
  /** Fused score, 0..1. */
  score: number;
  bm25: number;
  semantic: number;
  passage: string;
  mode: RetrievalMode;
};

export type RetrievalClause = {
  title: string;
  requirementText: string;
  synonyms: string;
  embedding: string | null;
};

export class HybridIndex {
  readonly mode: RetrievalMode;
  private readonly bm25: Bm25Index;
  private readonly passageVectors: number[][] | null;

  private constructor(bm25: Bm25Index, passageVectors: number[][] | null) {
    this.bm25 = bm25;
    this.passageVectors = passageVectors;
    this.mode = passageVectors ? "hybrid" : "lexical";
  }

  static async build(dossier: string, embedder?: Embedder | null): Promise<HybridIndex> {
    const passages = splitPassages(dossier);
    const bm25 = new Bm25Index(passages);

    const model = embedder === undefined ? await getEmbedder() : embedder;
    let vectors: number[][] | null = null;
    if (model && passages.length > 0) {
      try {
        vectors = await model.embed(passages);
      } catch {
        vectors = null;
      }
    }
    return new HybridIndex(bm25, vectors);
  }

  get passageCount(): number {
    return this.bm25.size;
  }

  query(clause: RetrievalClause): RetrievalHit {
    if (this.bm25.size === 0) return { score: 0, bm25: 0, semantic: 0, passage: "", mode: this.mode };

    const queryText = `${clause.title}. ${clause.requirementText} ${clause.synonyms}`;
    const lexical = this.bm25.query(queryText);
    const bm25ByIndex = new Map(lexical.map((hit) => [hit.index, hit.score]));

    const clauseVector = parseEmbedding(clause.embedding);
    const semanticAvailable = Boolean(this.passageVectors && clauseVector);
    const alpha = semanticAvailable ? env.hybridAlpha : 0;

    let best: RetrievalHit = { score: 0, bm25: 0, semantic: 0, passage: "", mode: this.mode };
    const total = this.bm25.size;
    for (let i = 0; i < total; i += 1) {
      const bm25 = bm25ByIndex.get(i) ?? 0;
      const semantic = semanticAvailable ? cosine(clauseVector!, this.passageVectors![i]) : 0;
      const score = alpha * semantic + (1 - alpha) * bm25;
      if (score > best.score) {
        best = { score, bm25, semantic, passage: trimPassage(this.bm25.passages[i]), mode: this.mode };
      }
    }
    return best;
  }
}

function parseEmbedding(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as number[]) : null;
  } catch {
    return null;
  }
}

function trimPassage(passage: string): string {
  return passage.length > 280 ? `${passage.slice(0, 277)}...` : passage;
}
