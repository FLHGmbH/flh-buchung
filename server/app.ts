import { Hono } from "hono";
import { migrate } from "./db.ts";
import { api } from "./routes.ts";
import { seedIfEmpty } from "./seed.ts";

export const app = new Hono();

let boot: Promise<void> | null = null;
function ready() {
  if (process.env.VERCEL) {
    boot ??= seedIfEmpty();
    return boot;
  }
  boot ??= migrate().then(() => seedIfEmpty());
  return boot;
}

app.get("/health", (c) => c.json({ ok: true }));
app.get("/api/health", (c) => c.json({ ok: true }));

app.use("*", async (c, next) => {
  try {
    await ready();
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Datenbank nicht erreichbar.";
    return c.json({ error: msg }, 503);
  }
  await next();
});

app.route("/api", api);
app.route("/", api);
