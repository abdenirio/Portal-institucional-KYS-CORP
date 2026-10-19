import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const companiesTable = pgTable("kys_companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sector: text("sector"),
  services: text("services"),
  logoUrl: text("logo_url"),
  officialWebsite: text("official_website"),
  status: text("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Company = typeof companiesTable.$inferSelect;
