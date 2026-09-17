import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import multer from "multer";
import { prisma } from "@meddevaudit/db";
import { env, hasLlm } from "./env";
import { embeddingStatus } from "./services/embeddings";
import { catalogueRouter } from "./routes/catalogue";
import { auditsRouter } from "./routes/audits";

const app = express();

app.disable("x-powered-by");

// In production the API serves the built frontend from the same origin, so no
// cross-origin access is needed and none is granted unless CORS_ORIGIN says
// otherwise. In development the Vite dev server proxies /api, so the same
// same-origin rule holds; the permissive default only applies when a dev
// client is talking to the API directly.
const corsOrigin = process.env.CORS_ORIGIN?.trim();
app.use(cors(corsOrigin ? { origin: corsOrigin.split(",").map((s) => s.trim()) } : env.isProduction ? { origin: false } : {}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Lightweight rate limit on audit runs. Each audit embeds every passage of the
 * dossier, so on a public URL this is the one endpoint worth protecting from
 * accidental or hostile hammering. In-memory and per-process — sufficient for a
 * single-instance deployment; swap for a shared store if you scale out.
 */
const auditRuns = new Map<string, number[]>();
const AUDIT_LIMIT = Number.parseInt(process.env.AUDIT_RATE_LIMIT ?? "20", 10);
app.use("/api/audits", (req, res, next) => {
  if (req.method !== "POST") return next();
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const recent = (auditRuns.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= AUDIT_LIMIT) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: `Rate limit: at most ${AUDIT_LIMIT} audits per minute. Try again shortly.` });
  }
  recent.push(now);
  auditRuns.set(key, recent);
  next();
});

/**
 * Single-user local session.
 *
 * This prototype runs on the reviewer's own machine, so there is no login and
 * every request is attributed to one local reviewer. EXTENSION POINT: to add
 * real auth, replace this middleware with your session/JWT verification and
 * populate req.reviewer from the authenticated principal; the audit routes
 * already read the reviewer identity from here rather than hardcoding it.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      reviewer?: { id: string; name: string };
    }
  }
}
app.use((req, _res, next) => {
  req.reviewer = { id: "local", name: "Local Reviewer" };
  next();
});

/**
 * Engine status. `embeddings` reflects whether clause embeddings exist in the
 * database (computed at seed time) — the honest signal of whether the hybrid
 * matcher is actually running with its semantic half, not just whether the
 * model could load in principle.
 */
app.get("/api/health", async (_req, res) => {
  const [clauseCount, embeddedCount] = await Promise.all([
    prisma.clause.count(),
    prisma.clause.count({ where: { embedding: { not: null } } }),
  ]);
  const embeddings = embeddingStatus();
  res.json({
    ok: true,
    engine: hasLlm ? "llm" : "fallback",
    model: hasLlm ? env.anthropicModel : null,
    retrieval: {
      mode: embeddedCount > 0 ? "hybrid" : "lexical",
      alpha: env.hybridAlpha,
      embeddingModel: embeddings.model,
      embeddedClauses: embeddedCount,
      totalClauses: clauseCount,
      modelState: embeddings.state,
      modelError: embeddings.error ?? null,
    },
  });
});

/**
 * Measured evaluation figures, straight from reports/evaluation*.json as
 * written by `npm run eval`. Served so the Settings page shows the numbers the
 * README quotes, from the same file. Absent files mean "not yet evaluated".
 */
app.get("/api/evaluation", (_req, res) => {
  const reportsDir = path.resolve(__dirname, "..", "..", "..", "reports");
  const read = (name: string) => {
    const file = path.join(reportsDir, name);
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return null;
    }
  };
  res.json({ hybrid: read("evaluation.json"), llm: read("evaluation-llm.json") });
});

app.use("/api", catalogueRouter);
app.use("/api", auditsRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown endpoint." });
});

/**
 * Production: serve the built React app from this same process, so one URL
 * hosts the whole application (no CORS, no second service). The dist folder
 * exists only after `npm run build`; in development Vite serves the app on its
 * own port and this block is a no-op.
 */
const webDist = path.resolve(__dirname, "..", "..", "web", "dist");
if (fs.existsSync(path.join(webDist, "index.html"))) {
  app.use(
    express.static(webDist, {
      // Vite fingerprints everything under /assets, so those can be cached hard.
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );
  // SPA fallback: any non-API, non-file route renders the app shell and lets
  // React Router resolve it.
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
  console.log(`[api] serving frontend from ${webDist}`);
} else {
  app.use((_req, res) => {
    res.status(404).send("Frontend not built. Run `npm run build`, or use `npm run dev` for development.");
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "That file is larger than the 25 MB upload limit."
        : `Upload failed: ${error.message}`;
    return res.status(400).json({ error: message });
  }
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  console.error("[api]", error);
  res.status(500).json({ error: message });
});

const server = app.listen(env.port, () => {
  // Behind a hosting proxy (Render, ALB, nginx) the app's keep-alive must
  // outlive the proxy's idle timeout, or the proxy reuses a socket the app has
  // just closed and the client sees a reset. 65 s clears the common 60 s
  // proxy defaults; headersTimeout must exceed keepAliveTimeout.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  console.log(`[api] listening on http://localhost:${env.port}`);
  console.log(
    hasLlm
      ? `[api] clause verification: Claude (${env.anthropicModel}), concurrency ${env.aiConcurrency}`
      : "[api] clause verification: deterministic matcher (set ANTHROPIC_API_KEY in .env to enable the LLM)",
  );
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
