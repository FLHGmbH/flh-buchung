import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { migrate } from "./db.ts";
import { api } from "./routes.ts";
import { seedIfEmpty } from "./seed.ts";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api", api);

const here = dirname(fileURLToPath(import.meta.url));
const clientDir = join(here, "../client/dist");

app.get("*", async (c) => {
  if (c.req.path.startsWith("/api") || c.req.path === "/health") return c.notFound();
  const rel = c.req.path === "/" ? "index.html" : c.req.path.replace(/^\/+/, "");
  const asset = join(clientDir, rel);
  if (!asset.startsWith(clientDir)) return c.notFound();
  try {
    const body = await readFile(asset);
    const ext = asset.split(".").pop();
    const types: Record<string, string> = {
      html: "text/html; charset=utf-8",
      js: "text/javascript",
      css: "text/css",
      svg: "image/svg+xml",
      png: "image/png",
      ico: "image/x-icon",
    };
    return new Response(body, { headers: { "content-type": types[ext ?? ""] ?? "application/octet-stream" } });
  } catch {
    try {
      const html = await readFile(join(clientDir, "index.html"));
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    } catch {
      return c.text("API läuft. UI mit npm run dev auf Port 5173 starten.", 200);
    }
  }
});

const port = Number(process.env.PORT) || 3000;
await migrate();
await seedIfEmpty();
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
  console.log(`flh-buchung http://0.0.0.0:${port}`);
});
