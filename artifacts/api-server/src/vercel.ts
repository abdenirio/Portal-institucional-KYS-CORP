import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app";

// Vercel entrypoint: the Express app is invoked as a plain request handler.
// The routing layer may hand over the rewritten path, so make sure Express
// always sees the /api prefix its routes are mounted on.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
