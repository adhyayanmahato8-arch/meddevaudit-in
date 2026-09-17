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
const EMBED_BATCH = intEnv("EMBED_BATCH", 8);
/** Pause between batches so a co-located web process gets CPU time. */
const EMBED_YIELD_MS = intEnv("EMBED_YIELD_MS", 40);
/** Worker RSS ceiling; fail the job before the container limit is reached. */
const MAX_RSS_MB = intEnv("MAX_WORKER_RSS_MB", 380);

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

    const pipe = await transformers.pipeline("feature-extraction", EMBEDDING_MODEL, { quantized: true });

    const embedder: Embedder = {
      async embed(texts) {
        const vectors: number[][] = [];
        // Small batches with a yield between them: on a shared-CPU host the
        // screening worker must leave scheduler time for the web process, and
        // the RSS guard fails the job cleanly rather than letting the container
        // hit its memory limit (which restarts the whole instance).
        for (let i = 0; i < texts.length; i += EMBED_BATCH) {
          const batch = texts.slice(i, i + EMBED_BATCH);
          const output = await pipe(batch, { pooling: "mean", normalize: true });
          const data = output.data as Float32Array;
          for (let j = 0; j < batch.length; j += 1) {
            vectors.push(Array.from(data.subarray(j * EMBEDDING_DIM, (j + 1) * EMBEDDING_DIM)));
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

/** Cosine similarity of two L2-normalised vectors is their dot product. */
export function cosine(a: number[], b: number[]): number {
  let score = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) score += a[i] * b[i];
  return Math.max(0, Math.min(1, score));
}
