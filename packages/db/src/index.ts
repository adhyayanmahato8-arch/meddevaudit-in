import path from "node:path";
import { PrismaClient } from "../generated/client";

/**
 * The SQLite file lives next to the Prisma schema. Resolving it to an absolute
 * path here means the API can be started from any working directory (the root
 * workspace, apps/api, or a packaged build) and still find the same database.
 */
const databaseFile = path.resolve(__dirname, "..", "prisma", "dev.db");

export const prisma = new PrismaClient({
  datasources: { db: { url: `file:${databaseFile}` } },
});

export { databaseFile };
export * from "../generated/client";
