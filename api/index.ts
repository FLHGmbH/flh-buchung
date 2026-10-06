import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "@hono/node-server/vercel";
import { app } from "../server/app.ts";
import { LOGO_MAX, withinBytes } from "../server/guard.ts";

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
  if (req.rawBody instanceof Buffer) return req.rawBody.length <= LOGO_MAX;
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > LOGO_MAX) return false;
    req.rawBody = req.body;
    return true;
  }
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > LOGO_MAX) return false;
    req.rawBody = Buffer.from(req.body);
    return true;
  }
  if (req.method === "GET" || req.method === "HEAD") return true;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    const buf = Buffer.isBuffer(c) ? c : Buffer.from(c);
    const next = withinBytes(size, buf.length);
    if (next == null) {
      req.destroy();
      return false;
    }
    size = next;
    chunks.push(buf);
  }
  req.rawBody = Buffer.concat(chunks);
  return true;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  restoreUrl(req);
  if (!(await withRawBody(req))) {
    res.statusCode = 413;
    res.end();
    return;
  }
  return run(req, res);
}
