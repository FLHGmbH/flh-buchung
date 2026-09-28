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

function guestKey(b: DashBooking) {
  const email = b.guestEmail.trim().toLowerCase();
  if (email.includes("@")) return `e:${email}`;
  const name = b.guestName.trim().toLowerCase();
  return name ? `n:${name}` : "";
}
