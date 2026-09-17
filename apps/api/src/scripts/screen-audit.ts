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

screenAudit(auditId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[screen-audit] ${auditId}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
