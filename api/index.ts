import type { IncomingMessage, ServerResponse } from "node:http";

export const config = { runtime: "nodejs", maxDuration: 30 };

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    restoreUrl(req);
    const { handle } = await import("@hono/node-server/vercel");
    const { app } = await import("../server/app.ts");
    return await handle(app)(req, res);
  } catch (e) {
    console.error(e);
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Serverfehler" }));
  }
}
