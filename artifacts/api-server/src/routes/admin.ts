import { and, asc, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ArchiveAdminCompanyParams,
  ArchiveAdminPublicationParams,
  CreateAdminCompanyBody,
  CreateAdminCompanyResponse,
  CreateAdminPublicationBody,
  CreateAdminPublicationResponse,
  GetAdminOverviewResponse,
  GetAdminSessionResponse,
  ListAdminCompaniesResponse,
  ListAdminInquiriesQueryParams,
  ListAdminInquiriesResponse,
  ListAdminPublicationsResponse,
  UpdateAdminCompanyBody,
  UpdateAdminCompanyParams,
  UpdateAdminCompanyResponse,
  UpdateAdminInquiryBody,
  UpdateAdminInquiryParams,
  UpdateAdminInquiryResponse,
  UpdateAdminPublicationBody,
  UpdateAdminPublicationParams,
  UpdateAdminPublicationResponse,
} from "@workspace/api-zod";
import {
  companiesTable,
  contactInquiriesTable,
  db,
  publicationsTable,
} from "@workspace/db";
import { requireAdmin, type AdminIdentity } from "../middlewares/adminAccess";

const router: IRouter = Router();
router.use("/admin", requireAdmin);

router.get("/admin/session", (_req, res): void => {
  const admin = res.locals.admin as AdminIdentity;
  res.json(GetAdminSessionResponse.parse(admin));
});

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const [[companyCount], [draftCount], [publishedCount], [newInquiryCount]] = await Promise.all([
    db.select({ value: count() }).from(companiesTable).where(eq(companiesTable.status, "published")),
    db.select({ value: count() }).from(publicationsTable).where(eq(publicationsTable.status, "draft")),
    db.select({ value: count() }).from(publicationsTable).where(eq(publicationsTable.status, "published")),
    db.select({ value: count() }).from(contactInquiriesTable).where(eq(contactInquiriesTable.status, "new")),
  ]);
  res.json(GetAdminOverviewResponse.parse({
    companies: companyCount.value,
    drafts: draftCount.value,
    publications: publishedCount.value,
    newInquiries: newInquiryCount.value,
  }));
});

router.get("/admin/companies", async (_req, res): Promise<void> => {
  const records = await db.select().from(companiesTable)
    .orderBy(asc(companiesTable.sortOrder), asc(companiesTable.name));
  res.json(ListAdminCompaniesResponse.parse(records));
});

router.post("/admin/companies", async (req, res): Promise<void> => {
  const parsed = CreateAdminCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [record] = await db.insert(companiesTable).values(parsed.data).returning();
    res.status(201).json(CreateAdminCompanyResponse.parse(record));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Já existe uma empresa com este endereço." });
      return;
    }
    throw error;
  }
});

router.patch("/admin/companies/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminCompanyParams.safeParse(req.params);
  const body = UpdateAdminCompanyBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid input" });
    return;
  }
  try {
    const [record] = await db.update(companiesTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(companiesTable.id, params.data.id)).returning();
    if (!record) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(UpdateAdminCompanyResponse.parse(record));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Já existe uma empresa com este endereço." });
      return;
    }
    throw error;
  }
});

router.delete("/admin/companies/:id", async (req, res): Promise<void> => {
  const params = ArchiveAdminCompanyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db.update(companiesTable)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(companiesTable.id, params.data.id)).returning({ id: companiesTable.id });
  if (!record) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/admin/publications", async (_req, res): Promise<void> => {
  const records = await db.select().from(publicationsTable)
    .orderBy(desc(publicationsTable.updatedAt));
  res.json(ListAdminPublicationsResponse.parse(records));
});

router.post("/admin/publications", async (req, res): Promise<void> => {
  const parsed = CreateAdminPublicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, publishedAt, ...content } = parsed.data;
  try {
    const [record] = await db.insert(publicationsTable).values({
      ...content,
      status,
      publishedAt: publishedAt ? new Date(publishedAt) : (status === "published" ? new Date() : null),
    }).returning();
    res.status(201).json(CreateAdminPublicationResponse.parse(record));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Já existe uma publicação com este endereço." });
      return;
    }
    throw error;
  }
});

router.patch("/admin/publications/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminPublicationParams.safeParse(req.params);
  const body = UpdateAdminPublicationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid input" });
    return;
  }
  const update = { ...body.data, updatedAt: new Date() };
  if (body.data.publishedAt !== undefined) {
    Object.assign(update, { publishedAt: body.data.publishedAt ? new Date(body.data.publishedAt) : null });
  } else if (body.data.status === "published") {
    Object.assign(update, { publishedAt: new Date() });
  }
  try {
    const [record] = await db.update(publicationsTable).set(update)
      .where(eq(publicationsTable.id, params.data.id)).returning();
    if (!record) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }
    res.json(UpdateAdminPublicationResponse.parse(record));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Já existe uma publicação com este endereço." });
      return;
    }
    throw error;
  }
});

router.delete("/admin/publications/:id", async (req, res): Promise<void> => {
  const params = ArchiveAdminPublicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db.update(publicationsTable)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(publicationsTable.id, params.data.id)).returning({ id: publicationsTable.id });
  if (!record) {
    res.status(404).json({ error: "Publication not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/admin/inquiries", async (req, res): Promise<void> => {
  const parsed = ListAdminInquiriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const records = await db.select().from(contactInquiriesTable)
    .where(parsed.data.status ? eq(contactInquiriesTable.status, parsed.data.status) : undefined)
    .orderBy(desc(contactInquiriesTable.createdAt));
  res.json(ListAdminInquiriesResponse.parse(records));
});

router.patch("/admin/inquiries/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminInquiryParams.safeParse(req.params);
  const body = UpdateAdminInquiryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid input" });
    return;
  }
  const [record] = await db.update(contactInquiriesTable)
    .set(body.data)
    .where(eq(contactInquiriesTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json(UpdateAdminInquiryResponse.parse(record));
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export default router;
