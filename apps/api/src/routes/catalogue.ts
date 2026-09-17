import { Router } from "express";
import { prisma } from "@meddevaudit/db";

export const catalogueRouter = Router();

/** GET /api/device-types — the five supported imported device categories. */
catalogueRouter.get("/device-types", async (_req, res, next) => {
  try {
    const deviceTypes = await prisma.deviceType.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { clauses: true, audits: true } } },
    });

    const commonCoreCount = await prisma.clause.count({ where: { deviceTypeId: null } });

    res.json(
      deviceTypes.map((dt) => ({
        id: dt.id,
        slug: dt.slug,
        name: dt.name,
        riskClass: dt.riskClass,
        particularStandard: dt.particularStandard,
        summary: dt.summary,
        specificClauseCount: dt._count.clauses,
        commonCoreClauseCount: commonCoreCount,
        totalClauseCount: dt._count.clauses + commonCoreCount,
        auditCount: dt._count.audits,
      })),
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clauses?deviceTypeId=...
 * Without the filter: the whole rule library. With it: the common core plus
 * that device's own clauses — exactly the set an audit screens against.
 */
catalogueRouter.get("/clauses", async (req, res, next) => {
  try {
    const deviceTypeId = typeof req.query.deviceTypeId === "string" ? req.query.deviceTypeId : undefined;

    const clauses = await prisma.clause.findMany({
      where: deviceTypeId ? { OR: [{ deviceTypeId: null }, { deviceTypeId }] } : undefined,
      include: { deviceType: { select: { id: true, name: true, riskClass: true } } },
      orderBy: [{ deviceTypeId: "asc" }, { sortOrder: "asc" }],
    });

    res.json(
      clauses.map((clause) => ({
        id: clause.id,
        deviceTypeId: clause.deviceTypeId,
        deviceTypeName: clause.deviceType?.name ?? null,
        scope: clause.deviceTypeId ? "DEVICE_SPECIFIC" : "COMMON_CORE",
        category: clause.category,
        clauseRef: clause.clauseRef,
        title: clause.title,
        requirementText: clause.requirementText,
        guidance: clause.guidance,
        mandatory: clause.mandatory,
      })),
    );
  } catch (error) {
    next(error);
  }
});
