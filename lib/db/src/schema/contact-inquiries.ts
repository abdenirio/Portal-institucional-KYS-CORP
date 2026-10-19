import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const contactInquiriesTable = pgTable("kys_contact_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContactInquiry = typeof contactInquiriesTable.$inferSelect;
