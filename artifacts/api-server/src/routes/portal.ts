import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetPublicCompanyParams,
  GetPublicCompanyResponse,
  GetPublicationsBySlugParams,
  GetPublicationsBySlugResponse,
  ListPublicCompaniesResponse,
  ListPublicationsQueryParams,
  ListPublicationsResponse,
} from "@workspace/api-zod";
import { companiesTable, db, publicationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/companies", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.status, "published"))
    .orderBy(asc(companiesTable.sortOrder), asc(companiesTable.name));
  res.json(ListPublicCompaniesResponse.parse(records));
});

router.get("/companies/:slug", async (req, res): Promise<void> => {
  const params = GetPublicCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db
    .select()
    .from(companiesTable)
    .where(and(eq(companiesTable.slug, params.data.slug), eq(companiesTable.status, "published")))
    .limit(1);
  if (!record) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.json(GetPublicCompanyResponse.parse(record));
});

router.get("/publications", async (req, res): Promise<void> => {
  const parsed = ListPublicationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category, page, pageSize } = parsed.data;
  const filters = [eq(publicationsTable.status, "published")];
  if (category) filters.push(eq(publicationsTable.category, category));
  if (search) {
    filters.push(or(
      ilike(publicationsTable.title, `%${search}%`),
      ilike(publicationsTable.content, `%${search}%`),
    )!);
  }
  const where = and(...filters);
  const [records, [totalRow]] = await Promise.all([
    db.select().from(publicationsTable).where(where)
      .orderBy(desc(publicationsTable.publishedAt), desc(publicationsTable.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(publicationsTable).where(where),
  ]);
  res.json(ListPublicationsResponse.parse({
    items: records,
    total: totalRow.total,
    page,
    pageSize,
  }));
});

router.get("/publications/:slug", async (req, res): Promise<void> => {
  const params = GetPublicationsBySlugParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db.select().from(publicationsTable)
    .where(and(eq(publicationsTable.slug, params.data.slug), eq(publicationsTable.status, "published")))
    .limit(1);
  if (!record) {
    res.status(404).json({ error: "Publication not found" });
    return;
  }
  res.json(GetPublicationsBySlugResponse.parse(record));
});

export default router;
