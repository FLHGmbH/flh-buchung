import { createHash } from "node:crypto";
import { DateTime } from "luxon";

export const BOOK_DAYS = 14;
export const LOGIN_MAX = 10;
export const BOOK_MAX = 8;
export const PIN_MAX = 5;
export const WINDOW_MS = 15 * 60_000;

// ponytail: process-local Map, Redis if multi-instance abuse
const hits = new Map<string, { n: number; reset: number }>();

export function resetLimits() {
  hits.clear();
}

export function limited(key: string, max: number, windowMs = WINDOW_MS, now = Date.now()) {
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  row.n += 1;
  return row.n > max;
}

export function clientIp(headers: { get?: (n: string) => string | undefined; header?: (n: string) => string | undefined }) {
  const read = (n: string) => headers.header?.(n) ?? headers.get?.(n);
  return read("x-forwarded-for")?.split(",")[0]?.trim() || read("x-real-ip") || "local";
}

export function serviceMins(durationMin: unknown, bufferMin: unknown) {
  const d = typeof durationMin === "number" ? durationMin : Number(durationMin);
  const b = bufferMin == null || bufferMin === "" ? 0 : typeof bufferMin === "number" ? bufferMin : Number(bufferMin);
  if (!Number.isInteger(d) || d < 5 || d > 480) return null;
  if (!Number.isInteger(b) || b < 0 || b > 120) return null;
  return { durationMin: d, bufferMin: b };
}

export function priceCents(v: unknown): number | null | false {
  if (v == null) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 9_999_900) return false;
  return v;
}

const LOGO_MIME: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const LOGO_MAX = 5_000_000;

export function logoKind(type: unknown, size: unknown) {
  if (typeof type !== "string" || typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > LOGO_MAX) return null;
  const ext = LOGO_MIME[type];
  return ext ? { ext, mime: type } : null;
}

export function inIntRange(n: unknown, min: number, max: number) {
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
}

export function bookWindow(zone: string, now = new Date()) {
  const from = DateTime.fromJSDate(now, { zone }).startOf("day");
  return { from, to: from.plus({ days: BOOK_DAYS }).endOf("day") };
}

export const LEN = { name: 80, note: 500, email: 254, phone: 40, reason: 120, password: 200 };

export function clip(s: string, max: number) {
  return s.trim().slice(0, max);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function readJson<T>(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

export function siteOrigin(reqUrl: string) {
  const o = process.env.PUBLIC_ORIGIN?.trim().replace(/\/$/, "");
  if (o) return o;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return null;
  return new URL(reqUrl).origin;
}

export function securityHeaders(path: string, https = false) {
  const book = path === "/b" || path.startsWith("/b/");
  const h: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": book ? "frame-ancestors *" : "frame-ancestors 'self'",
  };
  if (https) h["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  return h;
}

export function passwordOk(pw: string) {
  return pw.length >= 8 && pw.length <= LEN.password;
}

export function seedAllowed(env: NodeJS.ProcessEnv = process.env) {
  if (env.VERCEL || env.NODE_ENV === "production") return false;
  return !/supabase\.co|supabase\.com/.test(env.DATABASE_URL ?? "");
}

export function mailFromAddr(from: string | undefined) {
  const v = from?.trim() || "";
  if (!v || /@resend\.dev$/i.test(v)) return null;
  return v;
}

export function sbConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.SUPABASE_URL?.trim() && env.SUPABASE_ANON_KEY?.trim());
}

export function platformAdminEmail(env: NodeJS.ProcessEnv = process.env) {
  return (env.AUTH_ADMIN_EMAIL ?? "mail@flh-mediadigital.de").trim().toLowerCase();
}
