import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminUsersTable = pgTable("kys_admin_users", {
  email: text("email").primaryKey(),
  role: text("role").notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
