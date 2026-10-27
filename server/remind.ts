import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { DateTime } from "luxon";
import { db } from "./db.ts";
import { guestMail } from "./guest.ts";
import { siteOrigin } from "./guard.ts";
import { sendRemindMail } from "./mail.ts";
import { bookings, services, staff, tenants } from "./schema.ts";
import { REMIND_MS, remindSms, sendConfirmSms, shouldRemind, smsTo } from "./sms.ts";

function whenLabel(start: Date, end: Date, zone: string) {
  const a = DateTime.fromJSDate(start).setZone(zone);
  const b = DateTime.fromJSDate(end).setZone(zone);
  return `${a.toFormat("dd.MM.yyyy HH:mm")}–${b.toFormat("HH:mm")}`;
}

function abs(origin: string | null, raw: string | null) {
  const v = raw?.trim() ?? "";
  if (!v) return "";
  if (/^https?:\/\//.test(v)) return v;
  if (!origin) return "";
  return `${origin}${v.startsWith("/") ? v : `/${v}`}`;
}

// Hourly cron. Bookings made inside the last 24 hours before the start get no reminder; the confirmation just went out.
export async function runReminders(reqUrl: string, now = new Date()) {
  const origin = siteOrigin(reqUrl);
  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      remindedAt: bookings.remindedAt,
      createdAt: bookings.createdAt,
      guestName: bookings.guestName,
      guestEmail: bookings.guestEmail,
      guestPhone: bookings.guestPhone,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      cancelToken: bookings.cancelToken,
      tenantName: tenants.name,
      slug: tenants.slug,
      timezone: tenants.timezone,
      mailSign: tenants.mailSign,
      mailImageUrl: tenants.mailImageUrl,
      logoUrl: tenants.logoUrl,
      website: tenants.website,
      brand: tenants.brand,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(tenants, eq(tenants.id, bookings.tenantId))
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(staff, eq(staff.id, bookings.staffId))
    .where(and(
      eq(bookings.status, "confirmed"),
      isNull(bookings.remindedAt),
      gt(bookings.startsAt, now),
      lte(bookings.startsAt, new Date(now.getTime() + REMIND_MS)),
    ))
    .orderBy(bookings.startsAt)
    .limit(40);
  let sent = 0;
  for (const row of rows) {
    if (!shouldRemind(row, now) || sent >= 12) continue;
    const when = whenLabel(row.startsAt, row.endsAt, row.timezone || "Europe/Berlin");
    const serviceName = row.serviceName || "Termin";
    const staffName = row.staffName || "";
    const cancelUrl = origin && row.cancelToken ? `${origin}/b/${row.slug}/storno/${row.cancelToken}` : "";
    const text = remindSms({ tenantName: row.tenantName, serviceName, staffName, when, cancelUrl });
    if (smsTo(row.guestPhone)) {
      const ok = await sendConfirmSms({ to: row.guestPhone, fromName: row.tenantName, text });
      if (!ok) continue;
    }
    if (guestMail(row.guestEmail)) {
      try {
        await sendRemindMail({
          to: row.guestEmail,
          guestName: row.guestName,
          tenantName: row.tenantName,
          serviceName,
          staffName,
          when,
          cancelUrl,
          sign: row.mailSign ?? "",
          logoUrl: abs(origin, row.logoUrl),
          imageUrl: abs(origin, row.mailImageUrl),
          site: row.website ?? "",
          brand: row.brand ?? "",
        });
      } catch (e) {
        console.error("remind mail", e instanceof Error ? e.message : e);
      }
    }
    await db.update(bookings).set({ remindedAt: now }).where(eq(bookings.id, row.id));
    sent += 1;
  }
  return sent;
}
