import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, adminUsersTable } from "@workspace/db";

export type AdminRole = "super_admin" | "editor";
export type AdminIdentity = { email: string; role: AdminRole };

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign-in required" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress.trim().toLowerCase();
    const verified = user.primaryEmailAddress?.verification?.status === "verified";
    if (!email || !verified) {
      res.status(403).json({ error: "A verified email address is required" });
      return;
    }

    const ownerEmail = process.env.KYS_ADMIN_EMAIL?.trim().toLowerCase();
    if (ownerEmail && email === ownerEmail) {
      await db
        .insert(adminUsersTable)
        .values({ email, role: "super_admin" })
        .onConflictDoUpdate({
          target: adminUsersTable.email,
          set: { role: "super_admin" },
        });
      res.locals.admin = { email, role: "super_admin" } satisfies AdminIdentity;
      next();
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email))
      .limit(1);

    if (!admin || (admin.role !== "editor" && admin.role !== "super_admin")) {
      res.status(403).json({ error: "Administrator access required" });
      return;
    }

    res.locals.admin = { email, role: admin.role } satisfies AdminIdentity;
    next();
  } catch (error) {
    req.log.error({ error }, "Unable to verify administrator access");
    res.status(503).json({ error: "Administrator access is temporarily unavailable" });
  }
};

export const requireSuperAdmin: RequestHandler = (req, res, next) => {
  const admin = res.locals.admin as AdminIdentity | undefined;
  if (admin?.role !== "super_admin") {
    res.status(403).json({ error: "Super administrator access required" });
    return;
  }
  next();
};
