/**
 * Screening worker. Spawned by services/screeningQueue.ts as a separate
 * process — one audit per process — so the CPU-bound embedding work can
 * never block the web server, and a crash or out-of-memory kill takes down
 * only this process, which the queue records as FAILED.
 *
 *   tsx src/scripts/screen-audit.ts <auditId>
 */
import { prisma } from "@meddevaudit/db";
import { screenAudit } from "../services/screening";

const auditId = process.argv[2];
if (!auditId) {
  console.error("usage: screen-audit <auditId>");
  process.exit(2);
}

screenAudit(auditId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[screen-audit] ${auditId}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
