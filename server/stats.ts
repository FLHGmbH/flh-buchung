import { DateTime } from "luxon";

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export type DashBooking = {
  serviceId: string;
  startsAt: Date;
  guestName: string;
  guestEmail: string;
  status: string;
  fromPage: boolean;
};

export function buildDashboard(
  now: DateTime,
  zone: string,
  bookings: DashBooking[],
  services: { id: string; name: string; priceCents: number | null }[],
) {
  const price = new Map(services.map((s) => [s.id, s.priceCents ?? 0]));
  const name = new Map(services.map((s) => [s.id, s.name]));
  const live = bookings.filter((b) => b.status !== "cancelled");
  const when = (b: DashBooking) => DateTime.fromJSDate(b.startsAt, { zone });
  const inMonth = (b: DashBooking, y: number, m: number) => {
    const d = when(b);
    return d.year === y && d.month === m;
  };
  const cents = (rows: DashBooking[]) =>
    rows.reduce((sum, b) => (b.status === "confirmed" ? sum + (price.get(b.serviceId) ?? 0) : sum), 0);

  const prev = now.minus({ months: 1 });
  const thisMonth = live.filter((b) => inMonth(b, now.year, now.month));
  const lastMonth = live.filter((b) => inMonth(b, prev.year, prev.month));
  const revenueCents = cents(thisMonth);

  const firstSeen = new Map<string, DateTime>();
  for (const b of live) {
    const key = guestKey(b);
    if (!key) continue;
    const d = when(b);
    const cur = firstSeen.get(key);
    if (!cur || d < cur) firstSeen.set(key, d);
  }
  let customersDelta = 0;
  for (const d of firstSeen.values()) {
    if (d.year === now.year && d.month === now.month) customersDelta++;
  }

  const byService = new Map<string, number>();
  for (const b of live) byService.set(b.serviceId, (byService.get(b.serviceId) ?? 0) + 1);
  const ranked = [...byService.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked.slice(0, 5).map(([id, count]) => ({ name: name.get(id) ?? "Leistung", count }));
  const rest = ranked.slice(5).reduce((n, [, count]) => n + count, 0);

  return {
    monthLabel: now.setLocale("de").toFormat("LLLL yyyy"),
    year: now.year,
    revenueCents,
    revenueDeltaCents: revenueCents - cents(lastMonth),
    appointments: thisMonth.length,
    appointmentsDelta: thisMonth.length - lastMonth.length,
    bookings: live.length,
    bookingsDelta: thisMonth.length,
    customers: firstSeen.size,
    customersDelta,
    months: MONTHS.map((label, i) => ({
      label,
      revenueCents: cents(live.filter((b) => inMonth(b, now.year, i + 1))),
    })),
    services: rest ? [...top, { name: "Weitere", count: rest }] : top,
    origins: MONTHS.map((label, i) => {
      const rows = live.filter((b) => inMonth(b, now.year, i + 1));
      return {
        label,
        calendar: rows.filter((b) => !b.fromPage).length,
        page: rows.filter((b) => b.fromPage).length,
      };
    }),
    weekdays: DAYS.map((label, i) => ({
      label,
      count: live.filter((b) => when(b).weekday === i + 1).length,
    })),
  };
}

const QUIET_DAYS = 45;
const SETUP_DAYS = 7;

export type FleetTenant = {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  staff: number;
  services: number;
};

export type FleetBooking = {
  tenantId: string;
  serviceId: string;
  startsAt: Date;
  status: string;
};

export function buildFleet(
  now: DateTime,
  zone: string,
  tenants: FleetTenant[],
  bookings: FleetBooking[],
  priceCents: Map<string, number>,
) {
  const when = (d: Date) => DateTime.fromJSDate(d, { zone });
  const live = bookings.filter((b) => b.status !== "cancelled");
  const prev = now.minus({ months: 1 });
  const sameMonth = (d: DateTime, ref: DateTime) => d.year === ref.year && d.month === ref.month;
  const slotOf = new Map(tenants.map((t) => [t.id, { month: 0, last: null as DateTime | null, ever: 0 }]));
  let appointments = 0;
  let lastAppointments = 0;
  let revenueCents = 0;
  let lastRevenue = 0;
  let today = 0;
  const monthCounts = MONTHS.map(() => 0);

  for (const b of live) {
    const d = when(b.startsAt);
    const slot = slotOf.get(b.tenantId);
    if (slot) {
      slot.ever++;
      if (!slot.last || d > slot.last) slot.last = d;
      if (sameMonth(d, now)) slot.month++;
    }
    if (d.year === now.year && d.month >= 1 && d.month <= 12) monthCounts[d.month - 1]++;
    const cents = b.status === "confirmed" ? (priceCents.get(b.serviceId) ?? 0) : 0;
    if (sameMonth(d, now)) {
      appointments++;
      revenueCents += cents;
      if (d.hasSame(now, "day")) today++;
    } else if (sameMonth(d, prev)) {
      lastAppointments++;
      lastRevenue += cents;
    }
  }

  const attention: { id: string; name: string; reason: string }[] = [];
  for (const t of tenants) {
    const slot = slotOf.get(t.id)!;
    let reason = "";
    if (!t.active) reason = "Gesperrt";
    else if (t.staff === 0) reason = "Keine Mitarbeiter";
    else if (t.services === 0) reason = "Keine Leistungen";
    else if (slot.ever === 0 && now.diff(when(t.createdAt), "days").days >= SETUP_DAYS) reason = "Noch keine Buchung";
    else if (slot.last && now.diff(slot.last, "days").days >= QUIET_DAYS) reason = `Seit ${QUIET_DAYS} Tagen keine Buchung`;
    if (reason) attention.push({ id: t.id, name: t.name, reason });
  }
  const rank = (r: string) => (r === "Gesperrt" ? 0 : r.startsWith("Keine") ? 1 : r.startsWith("Noch") ? 2 : 3);
  attention.sort((a, b) => rank(a.reason) - rank(b.reason) || a.name.localeCompare(b.name, "de"));

  const activity = tenants
    .flatMap((t) => {
      const slot = slotOf.get(t.id)!;
      if (!slot.month) return [];
      return [{ id: t.id, name: t.name, month: slot.month, last: slot.last!.setLocale("de").toFormat("d. LLL yyyy") }];
    })
    .sort((a, b) => b.month - a.month || a.name.localeCompare(b.name, "de"));

  return {
    monthLabel: now.setLocale("de").toFormat("LLLL yyyy"),
    year: now.year,
    tenants: tenants.length,
    active: tenants.filter((t) => t.active).length,
    locked: tenants.filter((t) => !t.active).length,
    newTenants: tenants.filter((t) => sameMonth(when(t.createdAt), now)).length,
    appointments,
    appointmentsDelta: appointments - lastAppointments,
    revenueCents,
    revenueDeltaCents: revenueCents - lastRevenue,
    today,
    months: MONTHS.map((label, i) => ({ label, count: monthCounts[i] })),
    attention,
    activity,
  };
}

function guestKey(b: DashBooking) {
  const email = b.guestEmail.trim().toLowerCase();
  if (email.includes("@")) return `e:${email}`;
  const name = b.guestName.trim().toLowerCase();
  return name ? `n:${name}` : "";
}
