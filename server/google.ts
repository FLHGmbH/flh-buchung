import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { bookings, googleLinks, services, staff } from "./schema.ts";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");
const STATE_MS = 10 * 60 * 1000;

type Cal = { id: string; summary: string; primary?: boolean; accessRole?: string };

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function cfg() {
  const id = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!id || !secret) throw new Error("Google fehlt");
  return { id, secret };
}

function key(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function sealToken(plain: string, secret: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(secret), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}

export function openToken(stored: string, secret: string) {
  const buf = Buffer.from(stored, "base64url");
  const d = createDecipheriv("aes-256-gcm", key(secret), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

export function signState(tid: string, secret: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ tid, exp: now + STATE_MS })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readState(state: string, secret: string, now = Date.now()) {
  const dot = state.indexOf(".");
  if (dot < 1) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expect = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { tid?: string; exp?: number };
    if (!data.tid || typeof data.exp !== "number" || data.exp < now) return null;
    return data.tid;
  } catch {
    return null;
  }
}

export function googleRedirect(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/app/google/callback`;
}

export function googleAuthUrl(origin: string, tid: string) {
  const { id, secret } = cfg();
  const q = new URLSearchParams({
    client_id: id,
    redirect_uri: googleRedirect(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: signState(tid, secret),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export function eventBody(row: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  note: string;
  startsAt: Date;
  endsAt: Date;
  serviceName: string;
  staffName: string;
}) {
  const lines = [
    row.staffName && `Mitarbeiter: ${row.staffName}`,
    row.guestPhone && `Telefon: ${row.guestPhone}`,
    row.guestEmail && `E-Mail: ${row.guestEmail}`,
    row.note,
  ].filter(Boolean);
  return {
    summary: `${row.guestName} · ${row.serviceName || "Termin"}`,
    description: lines.join("\n"),
    start: { dateTime: row.startsAt.toISOString() },
    end: { dateTime: row.endsAt.toISOString() },
  };
}

type GEvent = {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  recurringEventId?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export function readGoogleEvent(ev: GEvent) {
  if (!ev.id || ev.recurringEventId) return null;
  if (ev.status === "cancelled" || !ev.start?.dateTime || !ev.end?.dateTime) {
    return ev.status === "cancelled" ? { id: ev.id, gone: true as const } : null;
  }
  const start = new Date(ev.start.dateTime);
  const end = new Date(ev.end.dateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  const summary = (ev.summary ?? "").trim();
  const cut = summary.split(" · ");
  const staffLine = (ev.description ?? "").split("\n").find((line) => line.startsWith("Mitarbeiter:"));
  return {
    id: ev.id,
    gone: false as const,
    start,
    end,
    guestName: (cut[0] || "Google Termin").slice(0, 80),
    serviceName: (cut[1] ?? "").trim(),
    staffName: staffLine ? staffLine.slice("Mitarbeiter:".length).trim() : "",
  };
}

const fresh = new Map<string, { token: string; until: number }>();

async function database() {
  return import("./db.ts");
}

async function postForm(url: string, body: URLSearchParams) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!res.ok || data.error) throw new Error(data.error || "Google");
  return data;
}

async function accessToken(tid: string, refresh: string) {
  const hit = fresh.get(tid);
  if (hit && hit.until > Date.now() + 60_000) return hit.token;
  const { id, secret } = cfg();
  const data = await postForm("https://oauth2.googleapis.com/token", new URLSearchParams({
    client_id: id,
    client_secret: secret,
    refresh_token: refresh,
    grant_type: "refresh_token",
  }));
  if (!data.access_token) throw new Error("token");
  fresh.set(tid, { token: data.access_token, until: Date.now() + (data.expires_in ?? 3600) * 1000 });
  return data.access_token;
}

async function gapi(token: string, path: string, init?: RequestInit) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (init?.body) headers["content-type"] = "application/json";
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, { ...init, headers });
}

async function linkOf(tid: string) {
  const { db } = await database();
  const [row] = await db.select().from(googleLinks).where(eq(googleLinks.tenantId, tid)).limit(1);
  return row ?? null;
}

async function calendars(token: string) {
  const res = await gapi(token, "/users/me/calendarList?minAccessRole=writer");
  const data = (await res.json().catch(() => ({}))) as { items?: Cal[] };
  if (!res.ok) throw new Error("Kalenderliste");
  return (data.items ?? []).filter((i) => i.id && (i.accessRole === "owner" || i.accessRole === "writer"));
}

function chosen(items: Cal[]) {
  return items.find((i) => i.primary) ?? items[0] ?? null;
}

export async function googleStatus(tid: string) {
  const row = await linkOf(tid);
  return {
    configured: googleConfigured(),
    email: row?.email ?? "",
    calendarId: row?.calendarId ?? "",
    calendarName: row?.calendarName ?? "",
  };
}

export async function googleCalendars(tid: string) {
  const row = await linkOf(tid);
  if (!row) return [];
  const token = await accessToken(tid, openToken(row.refreshToken, cfg().secret));
  return (await calendars(token)).map((i) => ({ id: i.id, summary: i.summary || i.id }));
}

export async function connectGoogle(tid: string, code: string, origin: string) {
  const { id, secret } = cfg();
  const data = await postForm("https://oauth2.googleapis.com/token", new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: googleRedirect(origin),
    grant_type: "authorization_code",
  }));
  if (!data.refresh_token || !data.access_token) return false;
  fresh.set(tid, { token: data.access_token, until: Date.now() + (data.expires_in ?? 3600) * 1000 });
  const items = await calendars(data.access_token).catch(() => [] as Cal[]);
  const cal = chosen(items);
  const { db } = await database();
  const values = {
    tenantId: tid,
    refreshToken: sealToken(data.refresh_token, secret),
    email: cal?.primary && cal.id.includes("@") ? cal.id : "",
    calendarId: cal?.id ?? "",
    calendarName: cal?.summary || cal?.id || "",
    syncToken: "",
  };
  const prev = await linkOf(tid);
  if (prev?.calendarId) await forgetEvents(tid, prev.calendarId, prev.refreshToken).catch(() => {});
  if (prev) await db.update(googleLinks).set(values).where(eq(googleLinks.tenantId, tid));
  else await db.insert(googleLinks).values(values);
  if (cal) await backlog(tid, 20);
  return true;
}

export async function chooseCalendar(tid: string, calendarId: string) {
  const items = await googleCalendars(tid);
  const hit = items.find((i) => i.id === calendarId);
  if (!hit) return false;
  const prev = await linkOf(tid);
  const { db } = await database();
  await db.update(googleLinks).set({
    calendarId: hit.id,
    calendarName: hit.summary,
    ...(prev?.calendarId === calendarId ? {} : { syncToken: "" }),
  }).where(eq(googleLinks.tenantId, tid));
  if (prev?.calendarId === calendarId) return true;
  if (prev?.calendarId) await forgetEvents(tid, prev.calendarId, prev.refreshToken).catch(() => {});
  await backlog(tid, 20);
  return true;
}

async function forgetEvents(tid: string, calendarId: string, refresh: string) {
  // ponytail: at most 25 deletes on a calendar switch. Further old events stay in the previous Google calendar.
  const { db } = await database();
  const rows = await db
    .select({ googleEventId: bookings.googleEventId })
    .from(bookings)
    .where(and(eq(bookings.tenantId, tid), isNotNull(bookings.googleEventId)))
    .limit(25);
  const token = await accessToken(tid, openToken(refresh, cfg().secret));
  for (const row of rows) {
    if (!row.googleEventId) continue;
    await gapi(token, `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(row.googleEventId)}`, { method: "DELETE" }).catch(() => {});
  }
}

async function backlog(tid: string, limit: number) {
  const { db } = await database();
  await db.update(bookings).set({ googleEventId: null, googleDirty: true }).where(and(eq(bookings.tenantId, tid), eq(bookings.status, "confirmed")));
  await drainGoogle(tid, limit);
}

export async function disconnectGoogle(tid: string) {
  const row = await linkOf(tid);
  fresh.delete(tid);
  if (row && googleConfigured()) {
    try {
      const token = openToken(row.refreshToken, cfg().secret);
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });
    } catch {
      /* local row still goes */
    }
  }
  const { db } = await database();
  await db.delete(googleLinks).where(eq(googleLinks.tenantId, tid));
}

const pulled = new Map<string, number>();

function overlap(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23P01";
}

async function listChanges(token: string, calendarId: string, syncToken: string) {
  const items: GEvent[] = [];
  let page = "";
  let sync = syncToken;
  const full = !syncToken;
  for (let n = 0; n < 4; n++) {
    const q = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "100" });
    if (page) q.set("pageToken", page);
    else if (full) {
      q.set("timeMin", new Date(Date.now() - 24 * 3600_000).toISOString());
      q.set("timeMax", new Date(Date.now() + 120 * 24 * 3600_000).toISOString());
    } else q.set("syncToken", syncToken);
    const res = await gapi(token, `/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
    if (res.status === 410 && !full) return { reset: true, items: [], sync: "" };
    if (!res.ok) throw new Error("list");
    const data = (await res.json()) as { items?: GEvent[]; nextPageToken?: string; nextSyncToken?: string };
    items.push(...(data.items ?? []));
    if (data.nextSyncToken) sync = data.nextSyncToken;
    if (!data.nextPageToken) return { reset: false, items, sync };
    page = data.nextPageToken;
  }
  // ponytail: 400 changes per open. The token stays until a later open finishes the list.
  return { reset: false, items, sync: syncToken };
}

export async function pullGoogle(tid: string) {
  const none = { cancelled: [] as string[], moved: [] as { id: string; startsAt: Date; endsAt: Date }[] };
  if (!googleConfigured()) return none;
  const last = pulled.get(tid) ?? 0;
  if (Date.now() - last < 20_000) return none;
  const mail = { cancelled: [] as string[], moved: [] as { id: string; startsAt: Date; endsAt: Date }[] };
  try {
    const link = await linkOf(tid);
    if (!link?.calendarId) return none;
    const access = await accessToken(tid, openToken(link.refreshToken, cfg().secret));
    let listed = await listChanges(access, link.calendarId, link.syncToken);
    if (listed.reset) listed = await listChanges(access, link.calendarId, "");
    const { db } = await database();
    const known = await db.select().from(bookings).where(eq(bookings.tenantId, tid));
    const byEvent = new Map(known.filter((row) => row.googleEventId).map((row) => [row.googleEventId as string, row]));
    const who = await db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.tenantId, tid));
    const svcs = await db.select({ id: services.id, name: services.name }).from(services).where(eq(services.tenantId, tid));
    for (const raw of listed.items) {
      const ev = readGoogleEvent(raw);
      if (!ev) continue;
      const cur = byEvent.get(ev.id);
      if (ev.gone) {
        if (cur && cur.status !== "cancelled") {
          await db.update(bookings).set({ status: "cancelled", googleDirty: false }).where(eq(bookings.id, cur.id));
          mail.cancelled.push(cur.id);
        }
        continue;
      }
      if (cur) {
        if (cur.status !== "confirmed") continue;
        const sameTime = Math.abs(cur.startsAt.getTime() - ev.start.getTime()) < 1000 && Math.abs(cur.endsAt.getTime() - ev.end.getTime()) < 1000;
        if (sameTime && cur.guestName === ev.guestName) continue;
        try {
          await db.update(bookings).set({ startsAt: ev.start, endsAt: ev.end, guestName: ev.guestName }).where(eq(bookings.id, cur.id));
          if (!sameTime) mail.moved.push({ id: cur.id, startsAt: cur.startsAt, endsAt: cur.endsAt });
        } catch (e) {
          if (!overlap(e)) throw e;
          await db.update(bookings).set({ googleDirty: true }).where(eq(bookings.id, cur.id));
        }
        continue;
      }
      const staffId = ev.staffName ? who.find((row) => row.name.toLowerCase() === ev.staffName.toLowerCase())?.id ?? null : null;
      const serviceId = ev.serviceName ? svcs.find((row) => row.name.toLowerCase() === ev.serviceName.toLowerCase())?.id ?? null : null;
      try {
        await db.insert(bookings).values({
          tenantId: tid,
          staffId,
          serviceId,
          startsAt: ev.start,
          endsAt: ev.end,
          guestName: ev.guestName,
          status: "confirmed",
          googleEventId: ev.id,
          googleDirty: false,
        });
      } catch (e) {
        if (!overlap(e)) throw e;
      }
    }
    if (listed.sync !== link.syncToken) {
      await db.update(googleLinks).set({ syncToken: listed.sync }).where(eq(googleLinks.tenantId, tid));
    }
    pulled.set(tid, Date.now());
    return mail;
  } catch (e) {
    console.error("google pull", e instanceof Error ? e.message : e);
    return none;
  }
}

export async function drainGoogle(tid: string, limit: number) {
  const { db } = await database();
  const rows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.tenantId, tid), eq(bookings.googleDirty, true)))
    .limit(limit);
  for (const row of rows) await syncBooking(row.id);
}

export async function syncBooking(id: string) {
  try {
    if (!googleConfigured()) return;
    const { db } = await database();
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!row) return;
    const link = await linkOf(row.tenantId);
    if (!link?.calendarId) return;
    const token = await accessToken(row.tenantId, openToken(link.refreshToken, cfg().secret));
    const base = `/calendars/${encodeURIComponent(link.calendarId)}/events`;
    const gone = row.status === "cancelled" || row.status === "noshow";
    if (gone) {
      if (row.googleEventId) {
        const res = await gapi(token, `${base}/${encodeURIComponent(row.googleEventId)}`, { method: "DELETE" });
        if (!res.ok && res.status !== 404 && res.status !== 410) throw new Error("delete");
      }
      await db.update(bookings).set({ googleEventId: null, googleDirty: false }).where(eq(bookings.id, row.id));
      return;
    }
    if (row.status !== "confirmed") {
      await db.update(bookings).set({ googleDirty: false }).where(eq(bookings.id, row.id));
      return;
    }
    const [svc] = row.serviceId
      ? await db.select({ name: services.name }).from(services).where(eq(services.id, row.serviceId)).limit(1)
      : [];
    const [who] = row.staffId
      ? await db.select({ name: staff.name }).from(staff).where(eq(staff.id, row.staffId)).limit(1)
      : [];
    const body = JSON.stringify(eventBody({
      guestName: row.guestName,
      guestEmail: row.guestEmail,
      guestPhone: row.guestPhone,
      note: row.note,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      serviceName: svc?.name ?? "Termin",
      staffName: who?.name ?? "",
    }));
    let eventId = row.googleEventId;
    if (eventId) {
      const res = await gapi(token, `${base}/${encodeURIComponent(eventId)}`, { method: "PATCH", body });
      if (res.status === 404) eventId = null;
      else if (!res.ok) throw new Error("patch");
    }
    if (!eventId) {
      const res = await gapi(token, base, { method: "POST", body });
      const made = (await res.json().catch(() => ({}))) as { id?: string };
      if (!res.ok || !made.id) throw new Error("insert");
      eventId = made.id;
    }
    await db.update(bookings).set({ googleEventId: eventId, googleDirty: false }).where(eq(bookings.id, row.id));
  } catch (e) {
    console.error("google", e instanceof Error ? e.message : e);
    const { db } = await database();
    await db.update(bookings).set({ googleDirty: true }).where(eq(bookings.id, id)).catch(() => {});
  }
}
