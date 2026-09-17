import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "@hono/node-server/vercel";
import { app } from "../server/app.ts";

export const config = { runtime: "nodejs", maxDuration: 30, api: { bodyParser: false } };

const run = handle(app);

function restoreUrl(req: IncomingMessage) {
  const raw = req.url ?? "/";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  const path = raw.split("?")[0] ?? "/";
  if (path.startsWith("/api/") || path === "/health") return;
  for (const key of ["x-forwarded-uri", "x-invoke-path"] as const) {
    const v = req.headers[key];
    if (typeof v === "string" && (v.startsWith("/api/") || v.startsWith("/health"))) {
      req.url = v.split("?")[0] + q;
      return;
    }
  }
  if (path === "/api" || path === "/api/" || path === "/") return;
  req.url = `/api${path.startsWith("/") ? path : `/${path}`}${q}`;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  restoreUrl(req);
  return run(req, res);
}
