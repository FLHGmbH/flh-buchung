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

async function withRawBody(req: IncomingMessage & { rawBody?: Buffer; body?: unknown }) {
  if (req.rawBody instanceof Buffer) return;
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
    return;
  }
  if (typeof req.body === "string") {
    req.rawBody = Buffer.from(req.body);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") return;
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  req.rawBody = Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  restoreUrl(req);
  await withRawBody(req);
  return run(req, res);
}
