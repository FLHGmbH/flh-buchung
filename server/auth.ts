import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { db } from "./db.ts";
import { hashToken, platformAdminEmail } from "./guard.ts";
import { memberships, sessions, tenants, users } from "./schema.ts";

const scryptAsync = promisify(scrypt);
const COOKIE = "sid";
const WEEK = 60 * 60 * 24 * 7;

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const buf = (await scryptAsync(pw, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${buf.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const buf = (await scryptAsync(pw, Buffer.from(salt, "hex"), 64)) as Buffer;
  const a = Buffer.from(hash, "hex");
  return a.length === buf.length && timingSafeEqual(a, buf);
}

let padHash: Promise<string> | null = null;
export async function verifyLogin(pw: string, stored: string | null | undefined) {
  padHash ??= hashPassword("timing-pad");
  return verifyPassword(pw, stored || (await padHash));
}

export async function sbPassword(email: string, password: string) {
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!base || !key) return false;
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.ok;
}

export async function sbCreateUser(email: string, password: string, name: string) {
  const cfg = sbAdmin();
  if (!cfg) return { ok: false as const, status: 503, error: "SUPABASE_SERVICE_ROLE_KEY fehlt." };
  const res = await fetch(`${cfg.base}/auth/v1/admin/users`, {
    method: "POST",
    headers: cfg.headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
  });
  if (res.ok) return { ok: true as const };
  const text = await res.text();
  if (res.status === 422 || /already|registered|exists/i.test(text)) {
    return { ok: false as const, status: 409, error: "Diese E-Mail hat schon einen Login." };
  }
  console.error("sbCreateUser", res.status, text);
  return { ok: false as const, status: 502, error: "Auth-User konnte nicht angelegt werden." };
}

function sbAdmin() {
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !key) return null;
  return { base, headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" } };
}

export async function sbEnsureUser(email: string, password: string, name: string) {
  const created = await sbCreateUser(email, password, name);
  if (created.ok || created.status !== 409) return created;
  const cfg = sbAdmin();
  if (!cfg) return created;
  const list = await fetch(`${cfg.base}/auth/v1/admin/users?per_page=200`, { headers: cfg.headers });
  if (!list.ok) return { ok: false as const, status: 502, error: "Auth-User nicht gefunden." };
  const data = (await list.json()) as { users?: { id: string; email?: string }[] };
  const row = data.users?.find((u) => u.email?.toLowerCase() === email);
  if (!row) return { ok: false as const, status: 502, error: "Auth-User nicht gefunden." };
  const upd = await fetch(`${cfg.base}/auth/v1/admin/users/${row.id}`, {
    method: "PUT",
    headers: cfg.headers,
    body: JSON.stringify({ password, email_confirm: true, user_metadata: { name } }),
  });
  if (!upd.ok) {
    console.error("sbEnsureUser", upd.status, await upd.text());
    return { ok: false as const, status: 502, error: "Auth-Passwort konnte nicht gesetzt werden." };
  }
  return { ok: true as const };
}

function cookieOpts() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
    maxAge: WEEK,
  };
}

export async function createSession(c: Context, userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    token: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + WEEK * 1000),
  });
  setCookie(c, COOKIE, token, cookieOpts());
}

export async function destroySession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) await db.delete(sessions).where(eq(sessions.token, hashToken(token)));
  deleteCookie(c, COOKIE, { path: "/" });
}

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: "platform_admin" | "tenant_admin";
  tenantId: string | null;
  tenantName: string | null;
};

export async function actorFromEmail(email: string): Promise<Actor | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  return actorFromUserId(user.id);
}

export async function ensurePlatformAdmin(email: string): Promise<Actor | null> {
  if (email !== platformAdminEmail()) return null;
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ email, name: "FLH DIGITAL", passwordHash: "" }).returning();
  }
  const mems = await db.select().from(memberships).where(eq(memberships.userId, user.id));
  if (!mems.some((m) => m.role === "platform_admin")) {
    await db.insert(memberships).values({ userId: user.id, tenantId: null, role: "platform_admin" });
  }
  return actorFromUserId(user.id);
}

export async function actorFromUserId(userId: string): Promise<Actor | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const mems = await db.select().from(memberships).where(eq(memberships.userId, user.id));
  const platform = mems.find((m) => m.role === "platform_admin");
  const tenantMem = mems.find((m) => m.role === "tenant_admin");
  if (platform) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "platform_admin",
      tenantId: null,
      tenantName: null,
    };
  }
  if (!tenantMem?.tenantId) return null;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantMem.tenantId)).limit(1);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "tenant_admin",
    tenantId: tenantMem.tenantId,
    tenantName: tenant?.name ?? null,
  };
}

export async function actorFrom(c: Context): Promise<Actor | null> {
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  const [row] = await db.select().from(sessions).where(eq(sessions.token, hashToken(token))).limit(1);
  if (!row || row.expiresAt < new Date()) {
    if (row) await db.delete(sessions).where(eq(sessions.token, row.token));
    return null;
  }
  return actorFromUserId(row.userId);
}

export async function requireActor(c: Context) {
  const actor = await actorFrom(c);
  if (!actor) return null;
  return actor;
}
