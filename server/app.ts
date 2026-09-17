import { Hono } from "hono";
import { migrate } from "./db.ts";
import { api } from "./routes.ts";
import { seedIfEmpty } from "./seed.ts";

export const app = new Hono();

let boot: Promise<void> | null = null;
function ready() {
  boot ??= migrate().then(() => seedIfEmpty());
  return boot;
}

app.use("*", async (_c, next) => {
  await ready();
  await next();
});

app.get("/health", (c) => c.json({ ok: true }));
app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api", api);
