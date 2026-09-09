import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { db } from "./db.ts";
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

function cookieOpts() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "Lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: WEEK,
  };
}

export async function createSession(c: Context, userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + WEEK * 1000),
  });
  setCookie(c, COOKIE, token, cookieOpts());
}

export async function destroySession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
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
  const [row] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
  if (!row || row.expiresAt < new Date()) {
    if (row) await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  return actorFromUserId(row.userId);
}

export async function requireActor(c: Context) {
  const actor = await actorFrom(c);
  if (!actor) return null;
  return actor;
}
