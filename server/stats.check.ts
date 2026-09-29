import { DateTime } from "luxon";
import { buildDashboard, buildFleet, type DashBooking } from "./stats.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const zone = "Europe/Berlin";
const now = DateTime.fromISO("2026-09-28T10:00", { zone });
const at = (iso: string) => DateTime.fromISO(iso, { zone }).toJSDate();
const cut = "cut";
const rows: DashBooking[] = [
  { serviceId: cut, startsAt: at("2026-09-02T10:00"), guestName: "Lea", guestEmail: "lea@example.test", status: "confirmed", fromPage: false },
  { serviceId: cut, startsAt: at("2026-09-02T11:00"), guestName: "Mia", guestEmail: "", status: "confirmed", fromPage: true },
  { serviceId: cut, startsAt: at("2026-08-02T10:00"), guestName: "Lea", guestEmail: "lea@example.test", status: "confirmed", fromPage: false },
  { serviceId: cut, startsAt: at("2026-09-03T10:00"), guestName: "Weg", guestEmail: "", status: "cancelled", fromPage: false },
];
const stats = buildDashboard(now, zone, rows, [{ id: cut, name: "Haarschnitt", priceCents: 3500 }]);

assert(stats.appointments === 2, "september appointments");
assert(stats.appointmentsDelta === 1, "one more than august");
assert(stats.revenueCents === 7000, "two priced september bookings");
assert(stats.revenueDeltaCents === 3500, "september minus august");
assert(stats.bookings === 3, "cancelled stays out");
assert(stats.customers === 2, "lea once, mia once");
assert(stats.customersDelta === 1, "only mia is new in september");
assert(stats.months[8].revenueCents === 7000, "september bar");
assert(stats.services[0]?.count === 3, "service count ignores cancelled");
assert(stats.origins[8].calendar === 1 && stats.origins[8].page === 1, "origin split");
assert(stats.weekdays[DateTime.fromISO("2026-09-02", { zone }).weekday - 1].count === 2, "weekday bucket");

const day = (iso: string) => DateTime.fromISO(iso, { zone }).toJSDate();
const fleet = buildFleet(
  now,
  zone,
  [
    { id: "a", name: "Aktiv", active: true, createdAt: day("2026-01-01"), staff: 1, services: 1 },
    { id: "b", name: "Leer", active: true, createdAt: day("2026-01-01"), staff: 0, services: 1 },
    { id: "c", name: "Neu", active: true, createdAt: day("2026-09-27"), staff: 1, services: 1 },
    { id: "d", name: "Ruhig", active: true, createdAt: day("2026-01-01"), staff: 1, services: 1 },
    { id: "e", name: "Zu", active: false, createdAt: day("2026-01-01"), staff: 1, services: 1 },
  ],
  [
    { tenantId: "a", serviceId: cut, startsAt: at("2026-09-28T09:00"), status: "confirmed" },
    { tenantId: "a", serviceId: cut, startsAt: at("2026-08-02T09:00"), status: "confirmed" },
    { tenantId: "a", serviceId: cut, startsAt: at("2026-09-01T09:00"), status: "cancelled" },
    { tenantId: "d", serviceId: cut, startsAt: at("2026-07-01T09:00"), status: "confirmed" },
  ],
  new Map([[cut, 3500]]),
);
assert(fleet.appointments === 1 && fleet.today === 1, "one live booking today");
assert(fleet.appointmentsDelta === 0, "august had one too");
assert(fleet.revenueCents === 3500, "cancelled booking has no revenue");
assert(fleet.newTenants === 1, "neu was created in september");
assert(fleet.attention.map((t) => t.id).join() === "e,b,d", "locked, empty, then quiet");
assert(!fleet.attention.some((t) => t.id === "c"), "new tenant still in setup");
assert(fleet.activity[0]?.id === "a" && fleet.activity[0].month === 1, "only aktiv booked this month");
assert(fleet.months[8].count === 1, "september bar ignores cancelled");

console.log("stats.check ok");
