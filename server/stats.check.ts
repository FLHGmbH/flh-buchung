import { DateTime } from "luxon";
import { buildDashboard, type DashBooking } from "./stats.ts";

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

console.log("stats.check ok");
