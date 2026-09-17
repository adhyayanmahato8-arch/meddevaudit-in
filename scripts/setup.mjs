/**
 * First-run provisioning for MedDevAudit-IN.
 *
 * `npm run dev` calls this before starting the servers. It is idempotent:
 *  - generates the Prisma client if it has never been generated
 *  - creates + seeds the SQLite database if the file is missing
 *  - does nothing at all on subsequent runs (so `npm run dev` stays fast)
 *
 * Pass --reset to drop and rebuild the database from the seed data.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dbPkg = join(root, "packages", "db");
const dbFile = join(dbPkg, "prisma", "dev.db");
const generated = join(dbPkg, "generated", "client");

const reset = process.argv.includes("--reset");

const WORKSPACE = { embed: "@meddevaudit/api" };

/**
 * `optional: true` marks a step the app can run without. The embedding step is
 * optional by design: if the sentence-transformer model cannot be fetched the
 * matcher degrades to BM25 + controlled vocabulary and says so on the Settings
 * page, rather than blocking startup.
 */
function run(script, label, { optional = false } = {}) {
  process.stdout.write(`  Â· ${label}...\n`);
  const workspace = WORKSPACE[script] ?? "@meddevaudit/db";
  const result = spawnSync("npm", ["run", script, "-w", workspace], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    if (optional) {
      console.warn(`\n  ! ${label} did not complete â€” continuing without it.\n`);
      return;
    }
    console.error(`\n  âœ— ${label} failed. Fix the error above and re-run "npm run dev".\n`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nMedDevAudit-IN â€” checking local environment");

if (!existsSync(generated)) {
  run("generate", "generating Prisma client");
} else {
  console.log("  Â· Prisma client already generated");
}

if (reset) {
  // A reset rebuilds the database from the schema and re-seeds it. --force-reset
  // is used rather than deleting dev.db from Node: on Windows a running API
  // holds a lock on the file, and this way `npm run db:reset` works whether or
  // not the dev servers are up. Past audits are discarded, which is what a
  // reset means.
  run("push:reset", "rebuilding database from schema (--reset)");
  run("seed", "re-seeding MDR-2017 rule library (--reset)");
  run("embed", "computing clause embeddings (--reset)", { optional: true });
} else if (!existsSync(dbFile)) {
  run("push", "creating SQLite database");
  run("seed", "seeding MDR-2017 rule library");
  run("embed", "computing clause embeddings", { optional: true });
} else {
  console.log("  Â· database already provisioned");
}

console.log(`
  âœ“ Ready.

    API   â†’  http://localhost:${process.env.API_PORT || 4000}
    APP   â†’  http://localhost:5173   â† open this one
`);
