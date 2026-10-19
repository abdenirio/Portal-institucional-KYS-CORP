import { Router, type IRouter } from "express";
import { CreateContactInquiryBody, CreateContactInquiryResponse } from "@workspace/api-zod";
import { contactInquiriesTable, db } from "@workspace/db";

const router: IRouter = Router();
const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

router.post("/contact-inquiries", async (req, res): Promise<void> => {
  const now = Date.now();
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const window = windows.get(ip);
  if (!window || window.resetAt <= now) {
    windows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else if (window.count >= MAX_PER_WINDOW) {
    res.status(429).json({ error: "Muitas mensagens. Tente novamente mais tarde." });
    return;
  } else {
    window.count += 1;
  }

  const parsed = CreateContactInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.website?.trim()) {
    res.status(201).json(CreateContactInquiryResponse.parse({ id: 0, received: true }));
    return;
  }

  const [inquiry] = await db.insert(contactInquiriesTable).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    category: parsed.data.category,
    message: parsed.data.message.trim(),
  }).returning();
  res.status(201).json(CreateContactInquiryResponse.parse({ id: inquiry.id, received: true }));
});

export default router;
