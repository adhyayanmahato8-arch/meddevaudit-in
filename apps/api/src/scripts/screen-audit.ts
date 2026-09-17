/**
 * Screening worker. Spawned by services/screeningQueue.ts as a separate
 * process — one audit per process — so the CPU-bound embedding work can
 * never block the web server, and a crash or out-of-memory kill takes down
 * only this process, which the queue records as FAILED.
 *
 *   tsx src/scripts/screen-audit.ts <auditId>
 */
import os from "node:os";
import { prisma } from "@meddevaudit/db";
import { screenAudit } from "../services/screening";
import { embeddingStatus } from "../services/embeddings";

const auditId = process.argv[2];
if (!auditId) {
  console.error("usage: screen-audit <auditId>");
  process.exit(2);
}

// Lowest scheduling priority: on a shared-CPU host the web process must win
// every contest for CPU so the site stays responsive while this runs.
try {
  os.setPriority(process.pid, 19);
} catch {
  /* not permitted on this platform — proceed at normal priority */
}

let peakRss = 0;
const rssSampler = setInterval(() => {
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
}, 100);

screenAudit(auditId)
  .then(() => {
    clearInterval(rssSampler);
    const s = embeddingStatus();
    if (s.state !== "ready") console.error(`[screen-audit] embedding model ${s.state}${s.error ? `: ${s.error}` : ""} (cache ${s.cacheDir})`);
    console.error(`[screen-audit] peak worker RSS ${(peakRss / 1048576).toFixed(0)} MB`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[screen-audit] ${auditId}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
