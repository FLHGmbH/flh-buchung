import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { DateTime } from "luxon";
import { actorFrom, actorFromUserId, createSession, destroySession, hashPassword, verifyPassword, type Actor } from "./auth.ts";
import { db } from "./db.ts";
import {
  bookings,
  memberships,
  openingHours,
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

async function busyFor(tenantId: string, staffIds: string[], bufferByService: Map<string, number>) {
  const off = await db.select().from(timeOff).where(eq(timeOff.tenantId, tenantId));
  const books = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.tenantId, tenantId), eq(bookings.status, "confirmed")));
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
  let body: { email?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Ungültige Anfrage." }, 400);
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(body.password ?? "", user.passwordHash))) {
    return c.json({ error: "E-Mail oder Passwort stimmt nicht." }, 401);
  }
  await createSession(c, user.id);
  const actor = await actorFromUserId(user.id);
  return c.json({ actor });
});

api.post("/auth/logout", async (c) => {
  await destroySession(c);
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
  const rows = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  const origin = process.env.PUBLIC_ORIGIN || new URL(c.req.url).origin;
  return c.json({
    tenants: rows.map((t) => ({
      ...t,
      bookUrl: `${origin}/b/${t.slug}`,
      iframe: `<iframe src="${origin}/b/${t.slug}" title="Termin buchen" style="width:100%;min-height:720px;border:0"></iframe>`,
    })),
  });
});

api.post("/admin/tenants", async (c) => {
  const body = await c.req.json<{
    name?: string;
    slug?: string;
    adminName?: string;
    adminEmail?: string;
    adminPassword?: string;
  }>();
  const name = body.name?.trim() ?? "";
  const slug = slugify(body.slug?.trim() || name);
  const adminEmail = body.adminEmail?.trim().toLowerCase() ?? "";
  const adminPassword = body.adminPassword ?? "";
  const adminName = body.adminName?.trim() || name;
  if (!name || !slug || !adminEmail || adminPassword.length < 8) {
    return c.json({ error: "Name, Slug, E-Mail und Passwort (min. 8 Zeichen) nötig." }, 400);
  }
  const [dup] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (dup) return c.json({ error: "Slug schon vergeben." }, 409);
  const [mailTaken] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (mailTaken) return c.json({ error: "Diese E-Mail hat schon einen Account." }, 409);

  const [tenant] = await db.insert(tenants).values({ name, slug }).returning();
  const [user] = await db
    .insert(users)
    .values({ email: adminEmail, name: adminName, passwordHash: await hashPassword(adminPassword) })
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
  const origin = process.env.PUBLIC_ORIGIN || new URL(c.req.url).origin;
  return c.json({ tenant, bookUrl: `${origin}/b/${slug}` }, 201);
});

api.get("/admin/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!tenant) return c.json({ error: "Nicht gefunden." }, 404);
  const mems = await db.select().from(memberships).where(eq(memberships.tenantId, id));
  const admins = [];
  for (const m of mems) {
    const [u] = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);
    if (u) admins.push({ id: u.id, email: u.email, name: u.name });
  }
  const origin = process.env.PUBLIC_ORIGIN || new URL(c.req.url).origin;
  return c.json({
    tenant,
    admins,
    bookUrl: `${origin}/b/${tenant.slug}`,
    iframe: `<iframe src="${origin}/b/${tenant.slug}" title="Termin buchen" style="width:100%;min-height:720px;border:0"></iframe>`,
  });
});

api.patch("/admin/tenants/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; active?: boolean }>();
  const patch: { name?: string; active?: boolean } = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.active === "boolean") patch.active = body.active;
  const [tenant] = await db.update(tenants).set(patch).where(eq(tenants.id, id)).returning();
  if (!tenant) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ tenant });
});

function tenantId(c: { get: (k: "actor") => Actor }) {
  return c.get("actor").tenantId as string;
}

api.get("/app/bootstrap", async (c) => {
  const tid = tenantId(c);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
  const staffRows = await db.select().from(staff).where(eq(staff.tenantId, tid)).orderBy(staff.sort);
  const serviceRows = await db.select().from(services).where(eq(services.tenantId, tid));
  const links = await db.select().from(serviceStaff);
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tid));
  return c.json({
    tenant,
    staff: staffRows,
    services: serviceRows.map((s) => ({
      ...s,
      staffIds: links.filter((l) => l.serviceId === s.id).map((l) => l.staffId),
    })),
    hours,
  });
});

api.get("/app/day", async (c) => {
  const tid = tenantId(c);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
  if (!tenant) return c.json({ error: "Mandant fehlt." }, 404);
  const date = c.req.query("date") || DateTime.now().setZone(tenant.timezone).toISODate();
  const day = DateTime.fromISO(date, { zone: tenant.timezone });
  const from = day.startOf("day").toJSDate();
  const to = day.endOf("day").toJSDate();
  const staffRows = await db.select().from(staff).where(eq(staff.tenantId, tid)).orderBy(staff.sort);
  const serviceRows = await db.select().from(services).where(eq(services.tenantId, tid));
  const books = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.tenantId, tid), gte(bookings.startsAt, from), lte(bookings.startsAt, to)));
  const off = await db.select().from(timeOff).where(eq(timeOff.tenantId, tid));
  const dayOff = off.filter((o) => o.startsAt < to && o.endsAt > from);
  return c.json({
    date,
    timezone: tenant.timezone,
    staff: staffRows,
    services: serviceRows,
    bookings: books,
    timeOff: dayOff,
  });
});

api.post("/app/staff", async (c) => {
  const tid = tenantId(c);
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim() ?? "";
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
  const body = await c.req.json<{ name?: string; active?: boolean }>();
  const [row] = await db
    .update(staff)
    .set({
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    })
    .where(and(eq(staff.id, c.req.param("id")), eq(staff.tenantId, tid)))
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ staff: row });
});

api.post("/app/services", async (c) => {
  const tid = tenantId(c);
  const body = await c.req.json<{ name?: string; durationMin?: number; bufferMin?: number; staffIds?: string[] }>();
  const name = body.name?.trim() ?? "";
  const durationMin = Number(body.durationMin);
  if (!name || !durationMin) return c.json({ error: "Name und Dauer nötig." }, 400);
  const [row] = await db
    .insert(services)
    .values({ tenantId: tid, name, durationMin, bufferMin: Number(body.bufferMin) || 0 })
    .returning();
  const ids = body.staffIds ?? [];
  if (ids.length) await db.insert(serviceStaff).values(ids.map((staffId) => ({ serviceId: row.id, staffId })));
  return c.json({ service: { ...row, staffIds: ids } }, 201);
});

api.patch("/app/services/:id", async (c) => {
  const tid = tenantId(c);
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    durationMin?: number;
    bufferMin?: number;
    active?: boolean;
    staffIds?: string[];
  }>();
  const [row] = await db
    .update(services)
    .set({
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(typeof body.durationMin === "number" ? { durationMin: body.durationMin } : {}),
      ...(typeof body.bufferMin === "number" ? { bufferMin: body.bufferMin } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
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

api.put("/app/hours", async (c) => {
  const tid = tenantId(c);
  const body = await c.req.json<{ hours?: { weekday: number; startHm: string; endHm: string }[] }>();
  await db.delete(openingHours).where(eq(openingHours.tenantId, tid));
  const hours = (body.hours ?? []).filter((h) => h.startHm && h.endHm);
  if (hours.length) await db.insert(openingHours).values(hours.map((h) => ({ ...h, tenantId: tid })));
  return c.json({ hours });
});

api.get("/app/time-off", async (c) => {
  const tid = tenantId(c);
  const rows = await db.select().from(timeOff).where(eq(timeOff.tenantId, tid)).orderBy(desc(timeOff.startsAt));
  return c.json({ timeOff: rows });
});

api.post("/app/time-off", async (c) => {
  const tid = tenantId(c);
  const body = await c.req.json<{ staffId?: string; startsAt?: string; endsAt?: string; reason?: string }>();
  if (!body.staffId || !body.startsAt || !body.endsAt) return c.json({ error: "Mitarbeiter und Zeitraum nötig." }, 400);
  const [row] = await db
    .insert(timeOff)
    .values({
      tenantId: tid,
      staffId: body.staffId,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      reason: body.reason?.trim() ?? "",
    })
    .returning();
  return c.json({ timeOff: row }, 201);
});

api.delete("/app/time-off/:id", async (c) => {
  const tid = tenantId(c);
  await db.delete(timeOff).where(and(eq(timeOff.id, c.req.param("id")), eq(timeOff.tenantId, tid)));
  return c.json({ ok: true });
});

api.get("/app/bookings", async (c) => {
  const tid = tenantId(c);
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.tenantId, tid))
    .orderBy(desc(bookings.startsAt))
    .limit(200);
  return c.json({ bookings: rows });
});

api.post("/app/bookings", async (c) => {
  const tid = tenantId(c);
  const body = await c.req.json<{
    staffId?: string;
    serviceId?: string;
    startsAt?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    note?: string;
  }>();
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, body.serviceId ?? ""), eq(services.tenantId, tid)))
    .limit(1);
  if (!service || !body.staffId || !body.startsAt || !body.guestName?.trim()) {
    return c.json({ error: "Mitarbeiter, Leistung, Start und Name nötig." }, 400);
  }
  const start = new Date(body.startsAt);
  const end = new Date(start.getTime() + service.durationMin * 60_000);
  try {
    const [row] = await db
      .insert(bookings)
      .values({
        tenantId: tid,
        staffId: body.staffId,
        serviceId: service.id,
        startsAt: start,
        endsAt: end,
        guestName: body.guestName.trim(),
        guestEmail: body.guestEmail?.trim() ?? "",
        guestPhone: body.guestPhone?.trim() ?? "",
        note: body.note?.trim() ?? "",
      })
      .returning();
    return c.json({ booking: row }, 201);
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
    .returning();
  if (!row) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json({ booking: row });
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
  const links = await db.select().from(serviceStaff);
  return c.json({
    tenant: { name: tenant.name, slug: tenant.slug, timezone: tenant.timezone },
    staff: staffRows.map((s) => ({ id: s.id, name: s.name })),
    services: serviceRows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
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
  const links = await db.select().from(serviceStaff).where(eq(serviceStaff.serviceId, service.id));
  let staffIds = links.map((l) => l.staffId);
  if (staffId) staffIds = staffIds.filter((id) => id === staffId);
  const active = await db
    .select()
    .from(staff)
    .where(and(eq(staff.tenantId, tenant.id), eq(staff.active, true)));
  staffIds = staffIds.filter((id) => active.some((s) => s.id === id));
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tenant.id));
  const from = DateTime.now().setZone(tenant.timezone).startOf("day");
  const to = from.plus({ days: 14 }).endOf("day");
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
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, c.req.param("slug"))).limit(1);
  if (!tenant || !tenant.active) return c.json({ error: "Unbekannt." }, 404);
  const body = await c.req.json<{
    serviceId?: string;
    staffId?: string;
    start?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    note?: string;
  }>();
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, body.serviceId ?? ""), eq(services.tenantId, tenant.id)))
    .limit(1);
  if (!service || !body.staffId || !body.start || !body.guestName?.trim()) {
    return c.json({ error: "Bitte alle Pflichtfelder ausfüllen." }, 400);
  }
  const start = new Date(body.start);
  const end = new Date(start.getTime() + service.durationMin * 60_000);
  const hours = await db.select().from(openingHours).where(eq(openingHours.tenantId, tenant.id));
  const buffers = new Map((await db.select().from(services).where(eq(services.tenantId, tenant.id))).map((s) => [s.id, s.bufferMin]));
  const busy = await busyFor(tenant.id, [body.staffId], buffers);
  const ok = freeSlots({
    zone: tenant.timezone,
    hours,
    busy,
    staffIds: [body.staffId],
    durationMin: service.durationMin,
    from: start,
    to: end,
    now: new Date(),
    minNoticeMin: tenant.minNoticeMin,
  }).some((s) => s.start.getTime() === start.getTime());
  if (!ok) return c.json({ error: "Dieser Termin ist nicht mehr frei." }, 409);
  try {
    const [row] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        staffId: body.staffId,
        serviceId: service.id,
        startsAt: start,
        endsAt: end,
        guestName: body.guestName.trim(),
        guestEmail: body.guestEmail?.trim() ?? "",
        guestPhone: body.guestPhone?.trim() ?? "",
        note: body.note?.trim() ?? "",
      })
      .returning();
    return c.json({
      booking: {
        id: row.id,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        guestName: row.guestName,
      },
    }, 201);
  } catch (e) {
    if (overlapError(e)) return c.json({ error: "Dieser Slot ist gerade vergeben. Bitte neu wählen." }, 409);
    throw e;
  }
});
