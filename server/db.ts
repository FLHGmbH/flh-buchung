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

function dbSsl(dbUrl: string) {
  if (/sslmode=disable/i.test(dbUrl)) return false;
  if (process.env.DATABASE_SSL === "insecure") return { rejectUnauthorized: false };
  // ponytail: Node rejects the pooler chain; pin Supabase CA for verify-full
  if (/supabase\.co|supabase\.com/.test(dbUrl)) return { rejectUnauthorized: false };
  if (/localhost|127\.0\.0\.1/.test(dbUrl)) return undefined;
  if (/^postgres/.test(dbUrl)) return { rejectUnauthorized: true };
  return undefined;
}

const here = dirname(fileURLToPath(import.meta.url));
const url = (process.env.DATABASE_URL ?? "").trim();
const isPg = url.startsWith("postgres");
const onVercel = !!process.env.VERCEL;

type Exec = (q: string) => Promise<unknown>;
let execSql: Exec;
let dbExport: ReturnType<typeof drizzlePg>;

if (onVercel || isPg) {
  if (!isPg) throw new Error("DATABASE_URL muss die Supabase-Postgres-URL sein (Pooler, Port 6543).");
  const pooler = /pooler\.supabase\.com|:6543\b/.test(url);
  const pgSql = postgres(url, {
    max: onVercel ? 1 : 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: !pooler,
    ssl: dbSsl(url),
  });
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
  if (!/already exists|duplicate|permission denied|must be owner|not allowed|insufficient/i.test(msg)) throw e;
}

function schemaFile(name: string) {
  for (const p of [join(here, name), join(process.cwd(), "server", name)]) {
    if (existsSync(p)) return p;
  }
  throw new Error(`Schema fehlt: ${name}`);
}

export async function migrate() {
  const file = isPg ? "schema.sql" : "schema.lite.sql";
  const sql = readFileSync(schemaFile(file), "utf8");
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await execSql(stmt).catch(ignoreExists);
  }
  await execSql(`
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
  `).catch(ignoreExists);
  await execSql(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pin_hash text NOT NULL DEFAULT ''`).catch(ignoreExists);
  await execSql(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pin_expires_at timestamptz`).catch(ignoreExists);
  await execSql(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name text NOT NULL,
      sort integer NOT NULL DEFAULT 0
    )
  `).catch(ignoreExists);
  await execSql(`ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL`).catch(ignoreExists);
  await execSql(`ALTER TABLE services ADD COLUMN IF NOT EXISTS price_cents integer`).catch(ignoreExists);
  await execSql(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url text`).catch(ignoreExists);
  if (isPg) {
    await requirePg(`ALTER TABLE staff ADD CONSTRAINT staff_id_tenant UNIQUE (id, tenant_id)`);
    await requirePg(`ALTER TABLE bookings ADD CONSTRAINT bookings_staff_tenant FOREIGN KEY (staff_id, tenant_id) REFERENCES staff(id, tenant_id)`);
    await requirePg(`ALTER TABLE time_off ADD CONSTRAINT time_off_staff_tenant FOREIGN KEY (staff_id, tenant_id) REFERENCES staff(id, tenant_id)`);
    await requirePg(`
      ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
      ) WHERE (status IN ('confirmed', 'pending'))
    `);
  }
}

function requirePg(sql: string) {
  return execSql(sql).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (/already exists|duplicate/i.test(msg)) return;
    throw e;
  });
}
