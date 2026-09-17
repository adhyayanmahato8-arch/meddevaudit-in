import path from "node:path";
import dotenv from "dotenv";

// The single .env lives at the workspace root so one file configures the whole
// project. Loading is best-effort: every value below has a working default.
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const env = {
  // Hosting platforms (Render, Railway, Fly, Heroku-style) inject PORT; API_PORT
  // is the local-development override.
  port: intFromEnv("PORT", intFromEnv("API_PORT", 4000, 1, 65535), 1, 65535),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY?.trim() || "",
  // The project brief named claude-sonnet-4-6; claude-sonnet-5 is the current
  // generation of that tier and is used as the default. Override here if needed.
  anthropicModel: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5",
  aiConcurrency: intFromEnv("AI_CONCURRENCY", 4, 1, 10),
  // Weight of the semantic (embedding) score in the hybrid retriever. 0.65 is
  // the empirical optimum reported by Rayo et al. (COLING 2025) for regulatory
  // text; see services/retrieval.ts.
  hybridAlpha: floatFromEnv("HYBRID_ALPHA", 0.65, 0, 1),
  isProduction: process.env.NODE_ENV === "production",
};

function floatFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const hasLlm = Boolean(env.anthropicApiKey);
