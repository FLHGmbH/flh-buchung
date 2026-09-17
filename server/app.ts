import { Hono } from "hono";
import { migrate } from "./db.ts";
import { securityHeaders } from "./guard.ts";
import { api } from "./routes.ts";
import { seedIfEmpty } from "./seed.ts";

export const app = new Hono();

let boot: Promise<void> | null = null;
function ready() {
  if (process.env.VERCEL) return Promise.resolve();
  boot ??= migrate().then(() => seedIfEmpty());
  return boot;
}

function applySecurity(c: { req: { path: string; url: string }; header: (k: string, v: string) => void }) {
  const https = c.req.url.startsWith("https:") || !!process.env.VERCEL;
  for (const [k, v] of Object.entries(securityHeaders(c.req.path, https))) c.header(k, v);
}

app.use("*", async (c, next) => {
  try {
    await ready();
  } catch (e) {
    console.error(e);
    applySecurity(c);
    const msg = e instanceof Error ? e.message : "Datenbank nicht erreichbar.";
    return c.json({ error: msg }, 503);
  }
  await next();
  applySecurity(c);
});

app.onError((err, c) => {
  console.error(err);
  applySecurity(c);
  return c.json({ error: "Datenbank nicht erreichbar." }, 503);
});

app.get("/health", (c) => c.json({ ok: true }));
app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api", api);
app.route("/", api);
