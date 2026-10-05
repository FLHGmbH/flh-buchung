import { DateTime } from "luxon";
import { freeSlots, planChain, shiftCovers, staffTaken } from "./slots.ts";

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

assert(freeSlots({ ...window, durationMin: 0 }).length === 0, "zero duration must not loop");
assert(freeSlots({ ...window, durationMin: -45 }).length === 0, "neg duration must not loop");

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

const clipped = freeSlots({
  ...window,
  staffHours: [{ staffId: "anna", weekday: 1, startHm: "10:00", endHm: "11:00" }],
});
assert(
  clipped.map((s) => DateTime.fromJSDate(s.start, { zone }).toFormat("HH:mm")).join(",") === "10:00",
  "staff hours clip the shop window",
);
assert(
  freeSlots({ ...window, staffHours: [{ staffId: "anna", weekday: 2, startHm: "10:00", endHm: "18:00" }] }).length === 0,
  "staff off that weekday has no slots",
);
assert(
  freeSlots({ ...window, staffHours: [{ staffId: "anna", weekday: 1, startHm: "08:00", endHm: "20:00" }] }).length === open.length,
  "staff hours cannot extend past the shop",
);

const nine = monday.set({ hour: 9 }).toJSDate();
const nine45 = monday.set({ hour: 9, minute: 45 }).toJSDate();
const ten = monday.set({ hour: 10 }).toJSDate();
const ten15 = monday.set({ hour: 10, minute: 15 }).toJSDate();
const ten45 = monday.set({ hour: 10, minute: 45 }).toJSDate();
assert(staffTaken(nine, nine45, 0, [{ start: nine, end: nine45 }]), "same window is taken");
assert(!staffTaken(nine45, ten, 0, [{ start: nine, end: nine45 }]), "abutting the end is free");
assert(staffTaken(nine45, ten, 0, [{ start: nine, end: ten15 }]), "their buffer blocks the next start");
assert(staffTaken(nine, nine45, 30, [{ start: ten, end: ten45 }]), "own buffer reaches the next booking");

const cover = { zone, hours, staffId: "anna", start: nine, end: nine45 };
assert(shiftCovers(cover), "09:00–09:45 is inside 09–12");
assert(!shiftCovers({ ...cover, end: monday.set({ hour: 12, minute: 1 }).toJSDate() }), "past closing is outside");

const chain = planChain({
  zone,
  hours,
  busy: [],
  start: nine,
  primaryStaffId: "anna",
  chain: [
    { id: "cut", durationMin: 45, bufferMin: 0, staffIds: ["anna", "ben"] },
    { id: "color", durationMin: 45, bufferMin: 0, staffIds: ["ben"] },
  ],
});
assert(chain?.length === 2 && chain[0].staffId === "anna" && chain[1].staffId === "ben", "extra goes to someone who does it");
assert(
  planChain({
    zone,
    hours,
    busy: [],
    start: monday.set({ hour: 11, minute: 15 }).toJSDate(),
    primaryStaffId: "anna",
    chain: [
      { id: "cut", durationMin: 45, bufferMin: 0, staffIds: ["anna"] },
      { id: "color", durationMin: 45, bufferMin: 0, staffIds: ["anna"] },
    ],
  }) === null,
  "chain that runs past closing is refused",
);

console.log("slots.check ok");
