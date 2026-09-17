/**
 * Local sentence embeddings via @xenova/transformers (all-MiniLM-L6-v2, ONNX).
 *
 * The model (~23 MB, quantised) is downloaded from the Hugging Face hub the
 * first time it is needed and cached under MODEL_CACHE_DIR; every later load is
 * offline. If it cannot be loaded at all — no network on first run, or an
 * unsupported platform — `getEmbedder()` resolves to null and callers must
 * degrade to lexical matching. That degradation is reported through
 * `embeddingStatus()` so the Settings page can say so explicitly.
 */
import path from "node:path";

export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIM = 384;

const intEnv = (name: string, fallback: number) => {
  const v = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
/** Passages per inference call. Small keeps memory flat and yields often. */
const EMBED_BATCH = intEnv("EMBED_BATCH", 4);
/** Pause between batches so a co-located web process gets CPU time. */
const EMBED_YIELD_MS = intEnv("EMBED_YIELD_MS", 40);
/** Worker RSS ceiling; fail the job before the container limit is reached. */
const MAX_RSS_MB = intEnv("MAX_WORKER_RSS_MB", 380);
/** Characters embedded per passage; the remainder still counts for BM25. */
const MAX_CHARS = intEnv("EMBED_MAX_CHARS", 800);
/**
 * Fixed token length per item. Passages are ≤ ~800 characters (≈ 190 word
 * pieces); attention memory ∝ batch × length², so this and EMBED_BATCH set
 * the worker's memory ceiling.
 */
const MAX_TOKENS = intEnv("EMBED_MAX_TOKENS", 192);

export type Embedder = {
  embed(texts: string[]): Promise<number[][]>;
};

type Status = {
  state: "unloaded" | "loading" | "ready" | "unavailable";
  model: string;
  cacheDir: string;
  error?: string;
};

// Model files live inside the workspace so a deployed container keeps them
// between restarts where the filesystem persists, and so a local dev machine
// downloads once, not per package.
const cacheDir = process.env.MODEL_CACHE_DIR || path.resolve(__dirname, "..", "..", "..", "..", ".model-cache");

const status: Status = { state: "unloaded", model: EMBEDDING_MODEL, cacheDir };
let loading: Promise<Embedder | null> | null = null;

export function embeddingStatus(): Status {
  return { ...status };
}

export function getEmbedder(): Promise<Embedder | null> {
  if (loading) return loading;
  loading = load();
  return loading;
}

async function load(): Promise<Embedder | null> {
  status.state = "loading";
  try {
    // Dynamic import keeps the ONNX runtime out of the startup path — it is
    // only paid for when an audit actually runs (or at seed time).
    const transformers = await import("@xenova/transformers");
    transformers.env.cacheDir = cacheDir;
    transformers.env.allowLocalModels = true;

    // Tokenizer and model are driven directly rather than through the
    // feature-extraction pipeline so that EVERY batch has the same tensor
    // shape [EMBED_BATCH, MAX_TOKENS]. The pipeline pads each batch to its
    // longest member, which gives ONNX Runtime a new input shape almost every
    // call; its memory arena allocates afresh per shape and never releases,
    // so RSS climbed ~350 MB over a 222-passage document. With fixed shapes
    // the arena is reused and memory stays flat.
    const tokenizer = await transformers.AutoTokenizer.from_pretrained(EMBEDDING_MODEL);
    const model = await transformers.AutoModel.from_pretrained(EMBEDDING_MODEL, { quantized: true });

    const embedder: Embedder = {
      async embed(texts) {
        const vectors: number[][] = [];
        // Small batches with a yield between them: on a shared-CPU host the
        // screening worker must leave scheduler time for the web process, and
        // the RSS guard fails the job cleanly rather than letting the container
        // hit its memory limit (which restarts the whole instance).
        for (let i = 0; i < texts.length; i += EMBED_BATCH) {
          // all-MiniLM-L6-v2 was trained on ≤256 word pieces; longer text is
          // truncated (the remainder still counts for BM25). The batch is
          // padded with empty strings to a constant size for the same reason
          // as the fixed token length: one shape, one arena allocation.
          const slice = texts.slice(i, i + EMBED_BATCH).map((t) => (t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t));
          const batch = slice.concat(Array(EMBED_BATCH - slice.length).fill(""));
          const inputs = await tokenizer(batch, { padding: "max_length", truncation: true, max_length: MAX_TOKENS });
          const output = await model(inputs);
          const hidden = output.last_hidden_state.data as Float32Array;
          const mask = inputs.attention_mask.data as BigInt64Array | Int32Array | Float32Array;
          const [, seqLen, hiddenDim] = output.last_hidden_state.dims as number[];
          for (let j = 0; j < slice.length; j += 1) {
            vectors.push(meanPoolNormalised(hidden, mask, j, seqLen, hiddenDim));
          }
          const rssMb = process.memoryUsage().rss / 1048576;
          if (rssMb > MAX_RSS_MB) {
            throw new Error(
              `Embedding stopped: worker memory ${rssMb.toFixed(0)} MB exceeded the ${MAX_RSS_MB} MB limit for this host after ${vectors.length}/${texts.length} passages. ` +
                `Use a shorter document or a larger instance (MAX_WORKER_RSS_MB).`,
            );
          }
          if (i + EMBED_BATCH < texts.length) await new Promise((r) => setTimeout(r, EMBED_YIELD_MS));
        }
        return vectors;
      },
    };

    status.state = "ready";
    return embedder;
  } catch (error) {
    status.state = "unavailable";
    status.error = error instanceof Error ? error.message : String(error);
    return null;
  }
}

/**
 * Mean-pools one item's token vectors over the attention mask and L2-normalises
 * — exactly what the feature-extraction pipeline does with
 * { pooling: "mean", normalize: true }, reproduced here because the pipeline
 * is bypassed for shape control.
 */
function meanPoolNormalised(
  hidden: Float32Array,
  mask: ArrayLike<number | bigint>,
  item: number,
  seqLen: number,
  hiddenDim: number,
): number[] {
  const out = new Float64Array(hiddenDim);
  let count = 0;
  for (let t = 0; t < seqLen; t += 1) {
    if (Number(mask[item * seqLen + t]) === 0) continue;
    count += 1;
    const base = (item * seqLen + t) * hiddenDim;
    for (let h = 0; h < hiddenDim; h += 1) out[h] += hidden[base + h];
  }
  let norm = 0;
  for (let h = 0; h < hiddenDim; h += 1) {
    out[h] /= count || 1;
    norm += out[h] * out[h];
  }
  norm = Math.sqrt(norm) || 1;
  return Array.from(out, (v) => v / norm);
}

/** Cosine similarity of two L2-normalised vectors is their dot product. */
export function cosine(a: number[], b: number[]): number {
  let score = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) score += a[i] * b[i];
  return Math.max(0, Math.min(1, score));
}
