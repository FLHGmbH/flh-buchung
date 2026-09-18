import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { and, desc, eq, gte, inArray, lt, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import { DateTime } from "luxon";
import { actorFrom, actorFromEmail, actorFromUserId, createSession, destroySession, ensurePlatformAdmin, hashPassword, sbEnsureUser, sbPassword, sbRecover, sbSetPassword, verifyLogin, verifyPassword, type Actor } from "./auth.ts";
import { db } from "./db.ts";
import { BOOK_MAX, LEN, LOGIN_MAX, PIN_MAX, WINDOW_MS, bookWindow, clip, clientIp, inIntRange, limited, logoKind, passwordOk, priceCents, readJson, sbConfigured, serviceMins, siteOrigin } from "./guard.ts";
import { newPin, PIN_MS, sendPinMail } from "./mail.ts";
import {
  bookings,
  memberships,
  openingHours,
  serviceCategories,
  serviceStaff,
  services,
  staff,
  tenants,
  timeOff,
  users,
} from "./schema.ts";
import { freeSlots } from "./slots.ts";

type Env = { Variables: { actor: Actor } };

export const api = new Hono<Env>();

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function overlapError(e: unknown) {
  return typeof e === "object" && e && "code" in e && (e as { code: string }).code === "23P01";
}

const bookingCols = {
  id: bookings.id,
  tenantId: bookings.tenantId,
  staffId: bookings.staffId,
  serviceId: bookings.serviceId,
  startsAt: bookings.startsAt,
  endsAt: bookings.endsAt,
  guestName: bookings.guestName,
  guestEmail: bookings.guestEmail,
  guestPhone: bookings.guestPhone,
  note: bookings.note,
  status: bookings.status,
  createdAt: bookings.createdAt,
};

async function staffInTenant(tenantId: string, staffId: string, activeOnly = false) {
  const [row] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.tenantId, tenantId), ...(activeOnly ? [eq(staff.active, true)] : [])))
    .limit(1);
  return Boolean(row);
}

async function staffIdsInTenant(tenantId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return true;
  const rows = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.tenantId, tenantId), inArray(staff.id, unique)));
  return rows.length === unique.length;
}

async function bookableStaffIds(tenantId: string, serviceId: string, staffId: string | null) {
  const links = await db.select().from(serviceStaff).where(eq(serviceStaff.serviceId, serviceId));
  let ids = links.map((l) => l.staffId);
  if (staffId) ids = ids.filter((id) => id === staffId);
  const active = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.tenantId, tenantId), eq(staff.active, true)));
  const allow = new Set(active.map((s) => s.id));
  return ids.filter((id) => allow.has(id));
}

async function staffLinks(serviceIds: string[]) {
  if (!serviceIds.length) return [];
  return db.select().from(serviceStaff).where(inArray(serviceStaff.serviceId, serviceIds));
}

async function categoryInTenant(tid: string, id: string | null | undefined) {
  if (!id) return true;
  const [row] = await db
    .select({ id: serviceCategories.id })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.id, id), eq(serviceCategories.tenantId, tid)))
    .limit(1);
  return Boolean(row);
}

async function ensureTenantDefaults(tenantId: string) {
  let staffRows = await db.select().from(staff).where(eq(staff.tenantId, tenantId));
  if (!staffRows.length) {
    const [row] = await db.insert(staff).values({ tenantId, name: "Team", sort: 0 }).returning();
    staffRows = [row];
  }
  const serviceRows = await db.select().from(services).where(eq(services.tenantId, tenantId));
  if (!serviceRows.length) {
    const [svc] = await db
      .insert(services)
      .values({ tenantId, name: "Termin", durationMin: 45, bufferMin: 0 })
      .returning();
    await db.insert(serviceStaff).values(staffRows.map((s) => ({ serviceId: svc.id, staffId: s.id })));
  } else {
    for (const svc of serviceRows) {
      const links = await db.select().from(serviceStaff).where(eq(serviceStaff.serviceId, svc.id));
      if (!links.length) {
        await db.insert(serviceStaff).values(staffRows.map((s) => ({ serviceId: svc.id, staffId: s.id })));
      }
    }
  }
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tenantId));
  if (!hours.length) {
    await db.insert(openingHours).values([
      ...[1, 2, 3, 4, 5].map((weekday) => ({ tenantId, weekday, startHm: "09:00", endHm: "18:00" })),
      { tenantId, weekday: 6, startHm: "09:00", endHm: "14:00" },
    ]);
  }
}

async function expireHolds() {
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.status, "pending"), lt(bookings.pinExpiresAt, new Date())));
}

async function busyFor(tenantId: string, staffIds: string[], bufferByService: Map<string, number>) {
  await expireHolds();
  const off = await db.select().from(timeOff).where(eq(timeOff.tenantId, tenantId));
  const books = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.tenantId, tenantId), or(eq(bookings.status, "confirmed"), eq(bookings.status, "pending"))),
    );
  // ponytail: buffer only in slot busy times, GiST uses raw ends_at. Persist buffer on the row if that window gets double-booked.
  const busy = [
    ...off
      .filter((o) => staffIds.includes(o.staffId))
      .map((o) => ({ staffId: o.staffId, start: o.startsAt, end: o.endsAt })),
    ...books
      .filter((b) => staffIds.includes(b.staffId))
      .map((b) => ({
        staffId: b.staffId,
        start: b.startsAt,
        end: new Date(b.endsAt.getTime() + (bufferByService.get(b.serviceId) ?? 0) * 60_000),
      })),
  ];
  return busy;
}

api.post("/auth/login", async (c) => {
  if (limited(`login:${clientIp(c.req)}`, LOGIN_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Versuche. Bitte später erneut." }, 429);
  }
  let body: { email?: string; password?: string } | null = await readJson(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const email = clip(body.email?.toLowerCase() ?? "", LEN.email);
  const password = body.password ?? "";
  if (sbConfigured()) {
    let authed = false;
    try {
      authed = await sbPassword(email, password);
    } catch (e) {
      console.error(e);
      return c.json({ error: "Anmeldung gerade nicht möglich." }, 503);
    }
    if (!authed) return c.json({ error: "E-Mail oder Passwort stimmt nicht." }, 401);
    const actor = (await actorFromEmail(email)) ?? (await ensurePlatformAdmin(email));
    if (!actor) return c.json({ error: "Kein Zugang. Mandant zuerst anlegen, Login in Supabase Auth." }, 403);
    await createSession(c, actor.id);
    return c.json({ actor });
  }
  if (process.env.VERCEL) return c.json({ error: "Auth nicht konfiguriert." }, 503);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await verifyLogin(password, user?.passwordHash);
  if (!user || !ok) return c.json({ error: "E-Mail oder Passwort stimmt nicht." }, 401);
  await createSession(c, user.id);
  const actor = await actorFromUserId(user.id);
  return c.json({ actor });
});

api.post("/auth/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

api.post("/auth/recover", async (c) => {
  if (limited(`recover:${clientIp(c.req)}`, LOGIN_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Versuche. Bitte später erneut." }, 429);
  }
  if (!sbConfigured()) return c.json({ error: "Auth nicht konfiguriert." }, 503);
  const body = await readJson<{ email?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const email = clip(body.email?.toLowerCase() ?? "", LEN.email);
  if (!email.includes("@")) return c.json({ error: "E-Mail fehlt." }, 400);
  const origin = siteOrigin(c.req.url);
  if (!origin) return c.json({ error: "PUBLIC_ORIGIN fehlt." }, 503);
  try {
    const ok = await sbRecover(email, `${origin}/reset`);
    if (!ok) return c.json({ error: "Mail gerade nicht möglich." }, 503);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Mail gerade nicht möglich." }, 503);
  }
  return c.json({ ok: true });
});

api.post("/auth/reset", async (c) => {
  if (limited(`reset:${clientIp(c.req)}`, LOGIN_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Versuche. Bitte später erneut." }, 429);
  }
  if (!sbConfigured()) return c.json({ error: "Auth nicht konfiguriert." }, 503);
  const body = await readJson<{ accessToken?: string; password?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const accessToken = body.accessToken ?? "";
  if (!accessToken || accessToken.length > 4096) return c.json({ error: "Link ungültig oder abgelaufen." }, 400);
  if (!passwordOk(body.password ?? "")) return c.json({ error: "Passwort mindestens 8 Zeichen." }, 400);
  try {
    const ok = await sbSetPassword(accessToken, body.password as string);
    if (!ok) return c.json({ error: "Link ungültig oder abgelaufen." }, 401);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Passwort konnte nicht gesetzt werden." }, 503);
  }
  return c.json({ ok: true });
});

api.get("/me", async (c) => {
  const actor = await actorFrom(c);
  if (!actor) return c.json({ actor: null });
  return c.json({ actor });
});

api.use("/admin/*", async (c, next) => {
  const actor = await actorFrom(c);
  if (!actor || actor.role !== "platform_admin") return c.json({ error: "Nicht erlaubt." }, 403);
  c.set("actor", actor);
  await next();
});

api.use("/app/*", async (c, next) => {
  const actor = await actorFrom(c);
  if (!actor || actor.role !== "tenant_admin" || !actor.tenantId) {
    return c.json({ error: "Nicht erlaubt." }, 403);
  }
  c.set("actor", actor);
  await next();
});

api.get("/admin/tenants", async (c) => {
  const origin = siteOrigin(c.req.url);
  if (!origin) return c.json({ error: "PUBLIC_ORIGIN fehlt." }, 500);
  const rows = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  return c.json({
    tenants: rows.map((t) => ({
      ...t,
      bookUrl: `${origin}/b/${t.slug}`,
      iframe: `<iframe src="${origin}/b/${t.slug}" title="Termin buchen" style="width:100%;min-height:720px;border:0"></iframe>`,
    })),
  });
});

api.post("/admin/tenants", async (c) => {
  const body = await readJson<{
    name?: string;
    slug?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
  }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const origin = siteOrigin(c.req.url);
  if (!origin) return c.json({ error: "PUBLIC_ORIGIN fehlt." }, 500);
  const name = clip(body.name ?? "", LEN.name);
  const slug = slugify(body.slug?.trim() || name);
  const adminEmail = clip(body.adminEmail?.toLowerCase() ?? "", LEN.email);
  const adminPassword = body.adminPassword ?? "";
  const adminName = clip(body.adminName ?? "", LEN.name) || name;
  if (!name || !slug || !adminEmail.includes("@") || !passwordOk(adminPassword)) {
    return c.json({ error: "Name, Slug, E-Mail und Passwort (min. 8 Zeichen) nötig." }, 400);
  }
  const [dup] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (dup) return c.json({ error: "Slug schon vergeben." }, 409);
  const [mailTaken] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (mailTaken) return c.json({ error: "Diese E-Mail hat schon einen Account." }, 409);
  if (sbConfigured()) {
    const created = await sbEnsureUser(adminEmail, adminPassword, adminName);
    if (!created.ok) return c.json({ error: created.error }, created.status);
  }

  const [tenant] = await db.insert(tenants).values({ name, slug }).returning();
  const [user] = await db
    .insert(users)
    .values({
      email: adminEmail,
      name: adminName,
      passwordHash: sbConfigured() ? "" : await hashPassword(adminPassword),
    })
    .returning();
  await db.insert(memberships).values({ userId: user.id, tenantId: tenant.id, role: "tenant_admin" });
  const hours = [1, 2, 3, 4, 5].map((weekday) => ({
    tenantId: tenant.id,
    weekday,
    startHm: "09:00",
    endHm: "18:00",
  }));
  hours.push({ tenantId: tenant.id, weekday: 6, startHm: "09:00", endHm: "14:00" });
  await db.insert(openingHours).values(hours);
  await ensureTenantDefaults(tenant.id);
  return c.json({ tenant, bookUrl: `${origin}/b/${slug}` }, 201);
});

api.get("/admin/tenants/:id", async (c) => {
  const origin = siteOrigin(c.req.url);
  if (!origin) return c.json({ error: "PUBLIC_ORIGIN fehlt." }, 500);
  const id = c.req.param("id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: "Nicht gefunden." }, 404);
  }
  try {
    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, active: tenants.active })
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);
    if (!tenant) return c.json({ error: "Nicht gefunden." }, 404);
    const mems = await db.select().from(memberships).where(eq(memberships.tenantId, id));
    const admins = [];
    for (const m of mems) {
      const [u] = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, m.userId)).limit(1);
      if (u) admins.push(u);
    }
    return c.json({
      tenant,
      admins,
      bookUrl: `${origin}/b/${tenant.slug}`,
      iframe: `<iframe src="${origin}/b/${tenant.slug}" title="Termin buchen" style="width:100%;min-height:720px;border:0"></iframe>`,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Mandant konnte nicht geladen werden." }, 500);
  }
});

api.patch("/admin/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const body = await readJson<{ name?: string; active?: boolean }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const patch: { name?: string; active?: boolean } = {};
  if (typeof body.name === "string") patch.name = clip(body.name, LEN.name);
  if (typeof body.active === "boolean") patch.active = body.active;
  const [tenant] = await db.update(tenants).set(patch).where(eq(tenants.id, id)).returning();
  if (!tenant) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ tenant });
});

api.patch("/admin/tenants/:id/password", async (c) => {
  const id = c.req.param("id");
  const body = await readJson<{ userId?: string; password?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  if (!body.userId || !passwordOk(body.password ?? "")) {
    return c.json({ error: "Nutzer und Passwort (min. 8 Zeichen) nötig." }, 400);
  }
  const [mem] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, body.userId), eq(memberships.tenantId, id), eq(memberships.role, "tenant_admin")))
    .limit(1);
  if (!mem) return c.json({ error: "Nicht gefunden." }, 404);
  const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (!user) return c.json({ error: "Nicht gefunden." }, 404);
  if (sbConfigured()) {
    const ensured = await sbEnsureUser(user.email, body.password as string, user.name);
    if (!ensured.ok) return c.json({ error: ensured.error }, ensured.status);
    await db.update(users).set({ passwordHash: "" }).where(eq(users.id, user.id));
  } else {
    await db.update(users).set({ passwordHash: await hashPassword(body.password as string) }).where(eq(users.id, user.id));
  }
  return c.json({ ok: true });
});

function tenantId(c: { get: (k: "actor") => Actor }) {
  return c.get("actor").tenantId as string;
}

const logoDir = join(dirname(fileURLToPath(import.meta.url)), "../data/logos");
const LOGO_EXTS = ["png", "jpg", "webp"] as const;
let logosBucket = false;

function sbStorage() {
  const base = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!base || !key) return null;
  return { base, key };
}

async function wipeLogoFiles(tenantId: string, keep?: string) {
  const sb = sbStorage();
  if (sb) {
    await Promise.all(LOGO_EXTS.filter((e) => e !== keep).map((e) =>
      fetch(`${sb.base}/storage/v1/object/logos/${tenantId}/logo.${e}`, {
        method: "DELETE",
        headers: { apikey: sb.key, authorization: `Bearer ${sb.key}` },
      }),
    ));
  }
  for (const e of LOGO_EXTS) {
    if (e === keep) continue;
    const p = join(logoDir, `${tenantId}.${e}`);
    if (existsSync(p)) unlinkSync(p);
  }
}

async function storeLogo(tenant: { id: string; slug: string }, mime: string, bytes: Buffer) {
  const kind = logoKind(mime, bytes.length);
  if (!kind) return { ok: false as const, error: "PNG, JPG oder WebP, max. 5 MB." };
  const sb = sbStorage();
  if (sb) {
    if (!logosBucket) {
      const made = await fetch(`${sb.base}/storage/v1/bucket`, {
        method: "POST",
        headers: { apikey: sb.key, authorization: `Bearer ${sb.key}`, "content-type": "application/json" },
        body: JSON.stringify({
          id: "logos",
          name: "logos",
          public: true,
          file_size_limit: 5_000_000,
          allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
        }),
      });
      if (made.ok || made.status === 409) logosBucket = true;
    }
    const object = `${tenant.id}/logo.${kind.ext}`;
    const up = await fetch(`${sb.base}/storage/v1/object/logos/${object}`, {
      method: "POST",
      headers: {
        apikey: sb.key,
        authorization: `Bearer ${sb.key}`,
        "content-type": kind.mime,
        "x-upsert": "true",
        "cache-control": "3600",
      },
      body: bytes,
    });
    if (!up.ok) {
      console.error("storeLogo", up.status, await up.text());
      return { ok: false as const, error: "Logo konnte nicht gespeichert werden." };
    }
    await wipeLogoFiles(tenant.id, kind.ext);
    return { ok: true as const, url: `${sb.base}/storage/v1/object/public/logos/${object}?v=${Date.now()}` };
  }
  // ponytail: local PGlite has no Storage keys; disk until SUPABASE_* is set
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return { ok: false as const, error: "Supabase Storage nicht konfiguriert." };
  }
  mkdirSync(logoDir, { recursive: true });
  await wipeLogoFiles(tenant.id, kind.ext);
  writeFileSync(join(logoDir, `${tenant.id}.${kind.ext}`), bytes);
  return { ok: true as const, url: `/api/public/${tenant.slug}/logo?v=${Date.now()}` };
}

api.get("/app/bootstrap", async (c) => {
  const tid = tenantId(c);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
  const staffRows = await db.select().from(staff).where(eq(staff.tenantId, tid)).orderBy(staff.sort);
  const serviceRows = await db.select().from(services).where(eq(services.tenantId, tid));
  const links = await staffLinks(serviceRows.map((s) => s.id));
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tid));
  const categories = await db.select().from(serviceCategories).where(eq(serviceCategories.tenantId, tid)).orderBy(serviceCategories.sort);
  return c.json({
    tenant,
    staff: staffRows,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    services: serviceRows.map((s) => ({
      ...s,
      staffIds: links.filter((l) => l.serviceId === s.id).map((l) => l.staffId),
    })),
    hours,
  });
});

api.get("/app/week", async (c) => {
  const tid = tenantId(c);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
  if (!tenant) return c.json({ error: "Mandant fehlt." }, 404);
  const raw = c.req.query("from") || "";
  const day = DateTime.fromISO(raw, { zone: tenant.timezone });
  if (!day.isValid) return c.json({ error: "Woche ungültig." }, 400);
  const from = day.startOf("day");
  const to = from.plus({ days: 6 }).endOf("day");
  const books = await db
    .select(bookingCols)
    .from(bookings)
    .where(and(eq(bookings.tenantId, tid), gte(bookings.startsAt, from.toJSDate()), lte(bookings.startsAt, to.toJSDate())));
  const off = await db.select().from(timeOff).where(eq(timeOff.tenantId, tid));
  const start = from.toJSDate();
  const end = to.toJSDate();
  return c.json({
    from: from.toISODate(),
    timezone: tenant.timezone,
    bookings: books,
    timeOff: off.filter((o) => o.startsAt < end && o.endsAt > start),
  });
});

api.post("/app/staff", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ name?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const name = clip(body.name ?? "", LEN.name);
  if (!name) return c.json({ error: "Name nötig." }, 400);
  const existing = await db.select().from(staff).where(eq(staff.tenantId, tid));
  const [row] = await db
    .insert(staff)
    .values({ tenantId: tid, name, sort: existing.length })
    .returning();
  return c.json({ staff: row }, 201);
});

api.patch("/app/staff/:id", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ name?: string; active?: boolean }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const [row] = await db
    .update(staff)
    .set({
      ...(typeof body.name === "string" ? { name: clip(body.name, LEN.name) } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    })
    .where(and(eq(staff.id, c.req.param("id")), eq(staff.tenantId, tid)))
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ staff: row });
});

api.post("/app/services", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ name?: string; durationMin?: number; bufferMin?: number; staffIds?: string[]; categoryId?: string | null; priceCents?: number | null }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const name = clip(body.name ?? "", LEN.name);
  const mins = serviceMins(body.durationMin, body.bufferMin);
  if (!name || !mins) return c.json({ error: "Name und Dauer (5–480 Min.) nötig." }, 400);
  const cents = priceCents(body.priceCents);
  if (cents === false) return c.json({ error: "Preis ungültig." }, 400);
  const ids = body.staffIds ?? [];
  if (!(await staffIdsInTenant(tid, ids))) return c.json({ error: "Mitarbeiter ungültig." }, 400);
  const categoryId = body.categoryId || null;
  if (!(await categoryInTenant(tid, categoryId))) return c.json({ error: "Kategorie ungültig." }, 400);
  const [row] = await db
    .insert(services)
    .values({ tenantId: tid, name, durationMin: mins.durationMin, bufferMin: mins.bufferMin, categoryId, priceCents: cents })
    .returning();
  if (ids.length) await db.insert(serviceStaff).values(ids.map((staffId) => ({ serviceId: row.id, staffId })));
  return c.json({ service: { ...row, staffIds: ids } }, 201);
});

api.patch("/app/services/:id", async (c) => {
  const tid = tenantId(c);
  const id = c.req.param("id");
  const body = await readJson<{
    name?: string;
    durationMin?: number;
    bufferMin?: number;
    active?: boolean;
    staffIds?: string[];
    categoryId?: string | null;
    priceCents?: number | null;
  }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  if (body.durationMin !== undefined && !inIntRange(body.durationMin, 5, 480)) {
    return c.json({ error: "Dauer muss 5–480 Minuten sein." }, 400);
  }
  if (body.bufferMin !== undefined && !inIntRange(body.bufferMin, 0, 120)) {
    return c.json({ error: "Puffer muss 0–120 Minuten sein." }, 400);
  }
  const cents = "priceCents" in body ? priceCents(body.priceCents) : undefined;
  if (cents === false) return c.json({ error: "Preis ungültig." }, 400);
  if (body.staffIds && !(await staffIdsInTenant(tid, body.staffIds))) {
    return c.json({ error: "Mitarbeiter ungültig." }, 400);
  }
  if ("categoryId" in body && !(await categoryInTenant(tid, body.categoryId))) {
    return c.json({ error: "Kategorie ungültig." }, 400);
  }
  const [row] = await db
    .update(services)
    .set({
      ...(typeof body.name === "string" ? { name: clip(body.name, LEN.name) } : {}),
      ...(typeof body.durationMin === "number" ? { durationMin: body.durationMin } : {}),
      ...(typeof body.bufferMin === "number" ? { bufferMin: body.bufferMin } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      ...("categoryId" in body ? { categoryId: body.categoryId || null } : {}),
      ...(cents !== undefined ? { priceCents: cents } : {}),
    })
    .where(and(eq(services.id, id), eq(services.tenantId, tid)))
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  if (body.staffIds) {
    await db.delete(serviceStaff).where(eq(serviceStaff.serviceId, id));
    if (body.staffIds.length) {
      await db.insert(serviceStaff).values(body.staffIds.map((staffId) => ({ serviceId: id, staffId })));
    }
  }
  return c.json({ service: { ...row, staffIds: body.staffIds } });
});

api.post("/app/categories", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ name?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const name = clip(body.name ?? "", LEN.name);
  if (!name) return c.json({ error: "Name nötig." }, 400);
  const existing = await db.select().from(serviceCategories).where(eq(serviceCategories.tenantId, tid));
  if (existing.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
    return c.json({ error: "Kategorie gibt es schon." }, 409);
  }
  const [row] = await db
    .insert(serviceCategories)
    .values({ tenantId: tid, name, sort: existing.length })
    .returning();
  return c.json({ category: { id: row.id, name: row.name } }, 201);
});

api.patch("/app/categories/:id", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ name?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const name = clip(body.name ?? "", LEN.name);
  if (!name) return c.json({ error: "Name nötig." }, 400);
  const [row] = await db
    .update(serviceCategories)
    .set({ name })
    .where(and(eq(serviceCategories.id, c.req.param("id")), eq(serviceCategories.tenantId, tid)))
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ category: { id: row.id, name: row.name } });
});

api.delete("/app/categories/:id", async (c) => {
  const tid = tenantId(c);
  const [row] = await db
    .delete(serviceCategories)
    .where(and(eq(serviceCategories.id, c.req.param("id")), eq(serviceCategories.tenantId, tid)))
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ ok: true });
});

api.put("/app/hours", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ hours?: { weekday: number; startHm: string; endHm: string }[] }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  await db.delete(openingHours).where(eq(openingHours.tenantId, tid));
  const hours = (body.hours ?? []).filter((h) => h.startHm && h.endHm);
  if (hours.length) await db.insert(openingHours).values(hours.map((h) => ({ ...h, tenantId: tid })));
  return c.json({ hours });
});

api.post("/app/logo", async (c) => {
  const tid = tenantId(c);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
  if (!tenant) return c.json({ error: "Mandant fehlt." }, 404);
  const body = await c.req.parseBody();
  const file = body.file;
  if (!file || typeof file === "string") return c.json({ error: "Datei fehlt." }, 400);
  const saved = await storeLogo(tenant, file.type, Buffer.from(await file.arrayBuffer()));
  if (!saved.ok) return c.json({ error: saved.error }, 400);
  await db.update(tenants).set({ logoUrl: saved.url }).where(eq(tenants.id, tid));
  return c.json({ logoUrl: saved.url });
});

api.delete("/app/logo", async (c) => {
  const tid = tenantId(c);
  await wipeLogoFiles(tid);
  await db.update(tenants).set({ logoUrl: null }).where(eq(tenants.id, tid));
  return c.json({ ok: true });
});

api.get("/app/time-off", async (c) => {
  const tid = tenantId(c);
  const rows = await db.select().from(timeOff).where(eq(timeOff.tenantId, tid)).orderBy(desc(timeOff.startsAt));
  return c.json({ timeOff: rows });
});

api.post("/app/time-off", async (c) => {
  const tid = tenantId(c);
  const body = await readJson<{ staffId?: string; startsAt?: string; endsAt?: string; reason?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  if (!body.staffId || !body.startsAt || !body.endsAt) return c.json({ error: "Mitarbeiter und Zeitraum nötig." }, 400);
  if (!(await staffInTenant(tid, body.staffId))) return c.json({ error: "Mitarbeiter ungültig." }, 400);
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return c.json({ error: "Zeitraum ungültig." }, 400);
  }
  const [row] = await db
    .insert(timeOff)
    .values({
      tenantId: tid,
      staffId: body.staffId,
      startsAt,
      endsAt,
      reason: clip(body.reason ?? "", LEN.reason),
    })
    .returning();
  return c.json({ timeOff: row }, 201);
});

api.delete("/app/time-off/:id", async (c) => {
  const tid = tenantId(c);
  await db.delete(timeOff).where(and(eq(timeOff.id, c.req.param("id")), eq(timeOff.tenantId, tid)));
  return c.json({ ok: true });
});

async function bookingFields(tid: string, body: {
  staffId?: string;
  serviceId?: string;
  startsAt?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  note?: string;
} | null) {
  if (!body) return { error: "Ungültige Anfrage.", status: 400 as const };
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, body.serviceId ?? ""), eq(services.tenantId, tid)))
    .limit(1);
  const guestName = clip(body.guestName ?? "", LEN.name);
  if (!service || !body.staffId || !body.startsAt || !guestName) {
    return { error: "Mitarbeiter, Leistung, Start und Name nötig.", status: 400 as const };
  }
  if (!(await staffInTenant(tid, body.staffId))) return { error: "Mitarbeiter ungültig.", status: 400 as const };
  const start = new Date(body.startsAt);
  if (Number.isNaN(start.getTime())) return { error: "Start ungültig.", status: 400 as const };
  return {
    fields: {
      staffId: body.staffId,
      serviceId: service.id,
      startsAt: start,
      endsAt: new Date(start.getTime() + service.durationMin * 60_000),
      guestName,
      guestEmail: clip(body.guestEmail ?? "", LEN.email),
      guestPhone: clip(body.guestPhone ?? "", LEN.phone),
      note: clip(body.note ?? "", LEN.note),
    },
  };
}

api.get("/app/bookings", async (c) => {
  const tid = tenantId(c);
  const rows = await db
    .select(bookingCols)
    .from(bookings)
    .where(eq(bookings.tenantId, tid))
    .orderBy(desc(bookings.startsAt))
    .limit(200);
  return c.json({ bookings: rows });
});

api.post("/app/bookings", async (c) => {
  const tid = tenantId(c);
  const parsed = await bookingFields(tid, await readJson(c));
  if ("error" in parsed) return c.json({ error: parsed.error }, parsed.status);
  try {
    const [row] = await db.insert(bookings).values({ tenantId: tid, ...parsed.fields }).returning(bookingCols);
    return c.json({ booking: row }, 201);
  } catch (e) {
    if (overlapError(e)) return c.json({ error: "Dieser Slot ist gerade vergeben." }, 409);
    throw e;
  }
});

api.patch("/app/bookings/:id", async (c) => {
  const tid = tenantId(c);
  const [cur] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(eq(bookings.id, c.req.param("id")), eq(bookings.tenantId, tid)))
    .limit(1);
  if (!cur) return c.json({ error: "Nicht gefunden." }, 404);
  if (cur.status === "cancelled") return c.json({ error: "Stornierter Termin." }, 400);
  const parsed = await bookingFields(tid, await readJson(c));
  if ("error" in parsed) return c.json({ error: parsed.error }, parsed.status);
  try {
    const [row] = await db
      .update(bookings)
      .set(parsed.fields)
      .where(and(eq(bookings.id, cur.id), eq(bookings.tenantId, tid)))
      .returning(bookingCols);
    return c.json({ booking: row });
  } catch (e) {
    if (overlapError(e)) return c.json({ error: "Dieser Slot ist gerade vergeben." }, 409);
    throw e;
  }
});

api.post("/app/bookings/:id/cancel", async (c) => {
  const tid = tenantId(c);
  const [row] = await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.id, c.req.param("id")), eq(bookings.tenantId, tid)))
    .returning(bookingCols);
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ booking: row });
});

api.get("/public/:slug/logo", async (c) => {
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant) return c.json({ error: "Unbekannt." }, 404);
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
  for (const ext of Object.keys(types)) {
    const file = join(logoDir, `${tenant.id}.${ext}`);
    if (!existsSync(file)) continue;
    return new Response(readFileSync(file), {
      headers: { "content-type": types[ext], "cache-control": "public, max-age=3600" },
    });
  }
  return c.json({ error: "Kein Logo." }, 404);
});

api.get("/public/:slug", async (c) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant || !tenant.active) return c.json({ error: "Unbekannt." }, 404);
  await ensureTenantDefaults(tenant.id);
  const staffRows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.tenantId, tenant.id), eq(staff.active, true)))
    .orderBy(staff.sort);
  const serviceRows = await db
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenant.id), eq(services.active, true)));
  const links = await staffLinks(serviceRows.map((s) => s.id));
  const categories = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.tenantId, tenant.id))
    .orderBy(serviceCategories.sort);
  return c.json({
    tenant: { name: tenant.name, slug: tenant.slug, timezone: tenant.timezone, logoUrl: tenant.logoUrl },
    staff: staffRows.map((s) => ({ id: s.id, name: s.name })),
    categories,
    services: serviceRows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      categoryId: s.categoryId,
      priceCents: s.priceCents,
      staffIds: links.filter((l) => l.serviceId === s.id).map((l) => l.staffId),
    })),
  });
});

api.get("/public/:slug/slots", async (c) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant || !tenant.active) return c.json({ error: "Unbekannt." }, 404);
  const serviceId = c.req.query("serviceId") ?? "";
  const staffId = c.req.query("staffId") || null;
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id), eq(services.active, true)))
    .limit(1);
  if (!service) return c.json({ error: "Leistung unbekannt." }, 400);
  const staffIds = await bookableStaffIds(tenant.id, service.id, staffId);
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tenant.id));
  const { from, to } = bookWindow(tenant.timezone);
  const buffers = new Map((await db.select().from(services).where(eq(services.tenantId, tenant.id))).map((s) => [s.id, s.bufferMin]));
  const busy = await busyFor(tenant.id, staffIds, buffers);
  const slots = freeSlots({
    zone: tenant.timezone,
    hours,
    busy,
    staffIds,
    durationMin: service.durationMin,
    from: from.toJSDate(),
    to: to.toJSDate(),
    now: new Date(),
    minNoticeMin: tenant.minNoticeMin,
  });
  return c.json({
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), staffId: s.staffId })),
  });
});

api.post("/public/:slug/book", async (c) => {
  const ip = clientIp(c.req);
  if (limited(`book:${ip}`, BOOK_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Buchungen. Bitte später erneut." }, 429);
  }
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant || !tenant.active) return c.json({ error: "Unbekannt." }, 404);
  let body: {
    serviceId?: string;
    staffId?: string;
    start?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    note?: string;
  } | null = await readJson(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, body.serviceId ?? ""), eq(services.tenantId, tenant.id), eq(services.active, true)))
    .limit(1);
  const guestEmail = clip(body.guestEmail?.toLowerCase() ?? "", LEN.email);
  const guestName = clip(body.guestName ?? "", LEN.name);
  if (!service || !body.staffId || !body.start || !guestName || !guestEmail.includes("@")) {
    return c.json({ error: "Bitte alle Pflichtfelder ausfüllen (inkl. E-Mail)." }, 400);
  }
  if (limited(`bookmail:${tenant.id}:${guestEmail}`, BOOK_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Buchungen. Bitte später erneut." }, 429);
  }
  const allowed = await bookableStaffIds(tenant.id, service.id, body.staffId);
  if (!allowed.length) return c.json({ error: "Dieser Termin ist nicht mehr frei." }, 409);
  const start = new Date(body.start);
  if (Number.isNaN(start.getTime())) return c.json({ error: "Start ungültig." }, 400);
  const { from, to } = bookWindow(tenant.timezone);
  if (start < from.toJSDate() || start > to.toJSDate()) {
    return c.json({ error: "Dieser Termin ist nicht mehr frei." }, 409);
  }
  const end = new Date(start.getTime() + service.durationMin * 60_000);
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tenant.id));
  const buffers = new Map((await db.select().from(services).where(eq(services.tenantId, tenant.id))).map((s) => [s.id, s.bufferMin]));
  const busy = await busyFor(tenant.id, allowed, buffers);
  const [openHold] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenant.id),
        eq(bookings.guestEmail, guestEmail),
        eq(bookings.status, "pending"),
        gte(bookings.pinExpiresAt, new Date()),
      ),
    )
    .limit(1);
  if (openHold) return c.json({ error: "Bitte zuerst den offenen Code bestätigen." }, 429);
  const ok = freeSlots({
    zone: tenant.timezone,
    hours,
    busy,
    staffIds: allowed,
    durationMin: service.durationMin,
    from: from.toJSDate(),
    to: to.toJSDate(),
    now: new Date(),
    minNoticeMin: tenant.minNoticeMin,
  }).some((s) => s.start.getTime() === start.getTime() && s.staffId === body.staffId);
  if (!ok) return c.json({ error: "Dieser Termin ist nicht mehr frei." }, 409);
  const pin = newPin();
  try {
    const [row] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        staffId: body.staffId,
        serviceId: service.id,
        startsAt: start,
        endsAt: end,
        guestName,
        guestEmail,
        guestPhone: clip(body.guestPhone ?? "", LEN.phone),
        note: clip(body.note ?? "", LEN.note),
        status: "pending",
        pinHash: await hashPassword(pin),
        pinExpiresAt: new Date(Date.now() + PIN_MS),
      })
      .returning();
    try {
      await sendPinMail({
        to: guestEmail,
        pin,
        tenantName: tenant.name,
        when: DateTime.fromJSDate(start).setZone(tenant.timezone).toFormat("dd.MM.yyyy HH:mm"),
      });
    } catch {
      await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, row.id));
      return c.json({ error: "Code konnte nicht gesendet werden. Bitte später erneut buchen." }, 502);
    }
    return c.json({
      booking: {
        id: row.id,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        guestName: row.guestName,
        status: "pending",
      },
    }, 201);
  } catch (e) {
    if (overlapError(e)) return c.json({ error: "Dieser Slot ist gerade vergeben. Bitte neu wählen." }, 409);
    throw e;
  }
});

api.post("/public/:slug/bookings/:id/confirm", async (c) => {
  if (limited(`pin:${clientIp(c.req)}:${c.req.param("id")}`, PIN_MAX, WINDOW_MS)) {
    return c.json({ error: "Zu viele Versuche. Bitte später erneut." }, 429);
  }
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant || !tenant.active) return c.json({ error: "Unbekannt." }, 404);
  await expireHolds();
  const body = await readJson<{ pin?: string }>(c);
  if (!body) return c.json({ error: "Ungültige Anfrage." }, 400);
  const pin = (body.pin ?? "").replace(/\s/g, "");
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, c.req.param("id")), eq(bookings.tenantId, tenant.id)))
    .limit(1);
  if (!row || row.status === "cancelled") return c.json({ error: "Buchung unbekannt oder abgelaufen." }, 404);
  if (row.status === "confirmed") {
    return c.json({ booking: { id: row.id, startsAt: row.startsAt, endsAt: row.endsAt, guestName: row.guestName } });
  }
  if (row.status !== "pending" || !row.pinHash) return c.json({ error: "Buchung unbekannt oder abgelaufen." }, 404);
  if (!(await verifyPassword(pin, row.pinHash))) return c.json({ error: "Code stimmt nicht." }, 400);
  const [ok] = await db
    .update(bookings)
    .set({ status: "confirmed", pinHash: "", pinExpiresAt: null })
    .where(and(eq(bookings.id, row.id), eq(bookings.status, "pending")))
    .returning();
  if (!ok) return c.json({ error: "Buchung unbekannt oder abgelaufen." }, 404);
  return c.json({ booking: { id: ok.id, startsAt: ok.startsAt, endsAt: ok.endsAt, guestName: ok.guestName } });
});
