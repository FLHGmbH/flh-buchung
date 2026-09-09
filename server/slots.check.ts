import { DateTime } from "luxon";
import { freeSlots } from "./slots.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const zone = "Europe/Berlin";
const monday = DateTime.fromISO("2026-09-14T00:00:00", { zone });
const now = monday.set({ hour: 7 }).toJSDate();
const hours = [{ weekday: 1, startHm: "09:00", endHm: "12:00" }];
const staffIds = ["anna"];
const window = {
  zone,
  hours,
  staffIds,
  durationMin: 45,
  from: monday.toJSDate(),
  to: monday.endOf("day").toJSDate(),
  now,
  minNoticeMin: 0,
};

const open = freeSlots({ ...window, busy: [] });
assert(
  open.map((s) => DateTime.fromJSDate(s.start, { zone }).toFormat("HH:mm")).join(",") === "09:00,09:45,10:30,11:15",
  `raster ${open.map((s) => DateTime.fromJSDate(s.start, { zone }).toFormat("HH:mm"))}`,
);

const closed = freeSlots({ ...window, hours: [] });
assert(closed.length === 0, "closed day must have 0 slots");

const vacation = freeSlots({
  ...window,
  busy: [{ staffId: "anna", start: monday.toJSDate(), end: monday.endOf("day").toJSDate() }],
});
assert(vacation.length === 0, "vacation day must have 0 slots");

const booked = freeSlots({
  ...window,
  busy: [
    {
      staffId: "anna",
      start: monday.set({ hour: 9, minute: 45 }).toJSDate(),
      end: monday.set({ hour: 10, minute: 30 }).toJSDate(),
    },
  ],
});
assert(
  booked.map((s) => DateTime.fromJSDate(s.start, { zone }).toFormat("HH:mm")).join(",") === "09:00,10:30,11:15",
  `booking hole ${booked.map((s) => DateTime.fromJSDate(s.start, { zone }).toFormat("HH:mm"))}`,
);

const otherStaff = freeSlots({
  ...window,
  busy: [
    {
      staffId: "ben",
      start: monday.set({ hour: 9 }).toJSDate(),
      end: monday.set({ hour: 12 }).toJSDate(),
    },
  ],
});
assert(otherStaff.length === open.length, "other staff busy must not block anna");

console.log("slots.check ok");
