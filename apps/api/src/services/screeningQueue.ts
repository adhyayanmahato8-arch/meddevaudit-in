import { spawn } from "node:child_process";
import path from "node:path";
import { prisma } from "@meddevaudit/db";

/**
 * Runs screening jobs one at a time in a separate process each.
 *
 * Why a process rather than a thread or an in-process promise: the embedding
 * model is CPU-bound and, on the ONNX/WASM backends, holds the JavaScript
 * thread. In-process, a long dossier made the web server unresponsive; on a
 * small host that failed the platform health check and the instance was
 * restarted with an empty database. A child process isolates both the CPU
 * time and the memory: the server keeps serving, and if the worker dies the
 * audit is marked FAILED with the exit reason.
 *
 * Serial execution bounds peak memory to one model instance.
 */
const WORKER_SCRIPT = path.resolve(__dirname, "..", "scripts", "screen-audit.ts");
const TSX_CLI = path.join(path.dirname(require.resolve("tsx/package.json")), "dist", "cli.mjs");
const TIMEOUT_MS = Number.parseInt(process.env.SCREENING_TIMEOUT_MS ?? String(20 * 60_000), 10);

const queue: string[] = [];
let running = false;

export function enqueueScreening(auditId: string): void {
  queue.push(auditId);
  void drain();
}

export function queueDepth(): number {
  return queue.length + (running ? 1 : 0);
}

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    while (queue.length > 0) {
      const auditId = queue.shift()!;
      if (queue.length > 0) {
        // Let waiting audits say so rather than sit on "Queued" silently.
        for (const [i, id] of queue.entries()) {
          await prisma.audit
            .update({ where: { id }, data: { statusMessage: `Queued — ${i + 1} audit${i ? "s" : ""} ahead` } })
            .catch(() => undefined);
        }
      }
      await runOne(auditId);
    }
  } finally {
    running = false;
  }
}

function runOne(auditId: string): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [TSX_CLI, WORKER_SCRIPT, auditId], {
      cwd: path.resolve(__dirname, "..", ".."),
      env: { ...process.env },
      stdio: ["ignore", "inherit", "pipe"],
    });

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 4000) stderr = stderr.slice(-4000);
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      void fail(auditId, `Screening exceeded ${Math.round(TIMEOUT_MS / 60000)} minutes and was stopped.`);
    }, TIMEOUT_MS);

    child.on("error", (error) => {
      clearTimeout(timer);
      void fail(auditId, `Could not start the screening worker: ${error.message}`).finally(resolve);
    });

    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      const seconds = Math.round((Date.now() - started) / 1000);
      if (code === 0) {
        console.log(`[screening] ${auditId} completed in ${seconds}s`);
        resolve();
        return;
      }
      const reason =
        signal === "SIGKILL"
          ? "The screening worker was killed — most likely it ran out of memory on this host. Try a shorter document, or run the app on a larger instance."
          : `The screening worker exited with code ${code}${stderr.trim() ? `: ${stderr.trim().split("\n").slice(-2).join(" ")}` : ""}`;
      console.error(`[screening] ${auditId} failed after ${seconds}s: ${reason}`);
      void fail(auditId, reason).finally(resolve);
    });
  });
}

async function fail(auditId: string, message: string): Promise<void> {
  // Only overwrite if the worker did not already settle the record itself.
  const current = await prisma.audit.findUnique({ where: { id: auditId }, select: { status: true } }).catch(() => null);
  if (!current || current.status !== "RUNNING") return;
  await prisma.audit
    .update({ where: { id: auditId }, data: { status: "FAILED", statusMessage: message, completedAt: new Date() } })
    .catch(() => undefined);
}

/**
 * On startup, anything left RUNNING belongs to a previous process that died
 * mid-screening. Re-queue it rather than leave it spinning forever.
 */
export async function recoverInterruptedAudits(): Promise<void> {
  const stale = await prisma.audit.findMany({ where: { status: "RUNNING" }, select: { id: true } });
  for (const { id } of stale) enqueueScreening(id);
  if (stale.length) console.log(`[screening] re-queued ${stale.length} interrupted audit(s)`);
}
