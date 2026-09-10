import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
const url = (process.env.DATABASE_URL ?? "").trim();
const isPg = url.startsWith("postgres");

if (process.env.NODE_ENV === "production" && !isPg) {
  throw new Error("DATABASE_URL muss auf Render die interne Postgres-URL sein.");
}

type Exec = (q: string) => Promise<unknown>;
let execSql: Exec;
let dbExport: ReturnType<typeof drizzlePg>;

if (isPg) {
  const pgSql = postgres(url, { max: 4 });
  execSql = (q) => pgSql.unsafe(q);
  dbExport = drizzlePg(pgSql, { schema });
} else {
  mkdirSync(join(here, "../data/pg"), { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const lite = await PGlite.create({ dataDir: join(here, "../data/pg") });
  execSql = (q) => lite.exec(q);
  dbExport = drizzlePglite(lite, { schema }) as unknown as ReturnType<typeof drizzlePg>;
  console.log("DB: PGlite unter data/pg");
}

export const db = dbExport;

function ignoreExists(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (!/already exists|duplicate/i.test(msg)) throw e;
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
  await execSql(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pin_hash text NOT NULL DEFAULT ''`).catch(ignoreExists);
  await execSql(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pin_expires_at timestamptz`).catch(ignoreExists);
  if (isPg) {
    try {
      await execSql(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap`);
      await execSql(`
        ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
        EXCLUDE USING gist (
          staff_id WITH =,
          tstzrange(starts_at, ends_at) WITH &&
        ) WHERE (status IN ('confirmed', 'pending'))
      `);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/already exists/i.test(msg)) throw e;
    }
  }
}
