import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

function loadEnv() {
  const file = join(dirname(fileURLToPath(import.meta.url)), "../.env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL ?? "";
const isPg = url.startsWith("postgres");
const dataDir = join(here, "../data/pg");
if (!isPg) mkdirSync(dataDir, { recursive: true });

const pgSql = isPg ? postgres(url, { max: 4 }) : null;
const lite = isPg ? null : await PGlite.create({ dataDir });
if (!isPg) console.log("DB: PGlite unter data/pg");

export const db = isPg ? drizzlePg(pgSql!, { schema }) : drizzlePglite(lite!, { schema });

async function execSql(q: string) {
  if (pgSql) await pgSql.unsafe(q);
  else await lite!.exec(q);
}

export async function migrate() {
  const file = isPg ? "schema.sql" : "schema.lite.sql";
  await execSql(readFileSync(join(here, file), "utf8"));
  await execSql(`
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
  `);
}
