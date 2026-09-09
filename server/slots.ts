import { DateTime } from "luxon";

export type Hours = { weekday: number; startHm: string; endHm: string };
export type Busy = { staffId: string; start: Date; end: Date };
export type Slot = { start: Date; end: Date; staffId: string };

function atHm(day: DateTime, hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return day.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

function overlaps(a0: DateTime, a1: DateTime, b0: DateTime, b1: DateTime) {
  return a0 < b1 && a1 > b0;
}

export function freeSlots(opts: {
  zone: string;
  hours: Hours[];
  busy?: Busy[];
  staffIds: string[];
  durationMin: number;
  from: Date;
  to: Date;
  now: Date;
  minNoticeMin: number;
}): Slot[] {
  const zone = opts.zone;
  const duration = { minutes: opts.durationMin };
  const earliest = DateTime.fromJSDate(opts.now, { zone }).plus({ minutes: opts.minNoticeMin });
  const from = DateTime.fromJSDate(opts.from, { zone });
  const to = DateTime.fromJSDate(opts.to, { zone });
  const startDay = from.startOf("day");
  const endDay = to.startOf("day");
  const out: Slot[] = [];

  for (let day = startDay; day <= endDay; day = day.plus({ days: 1 })) {
    const windows = opts.hours.filter((h) => h.weekday === day.weekday);
    for (const staffId of opts.staffIds) {
      const occupied = (opts.busy ?? [])
        .filter((b) => b.staffId === staffId)
        .map((b) => ({
          start: DateTime.fromJSDate(b.start, { zone }),
          end: DateTime.fromJSDate(b.end, { zone }),
        }));
      for (const w of windows) {
        let t = atHm(day, w.startHm);
        const close = atHm(day, w.endHm);
        while (t.plus(duration) <= close) {
          const slotEnd = t.plus(duration);
          if (t >= earliest && t >= from && slotEnd <= to) {
            const hit = occupied.some((b) => overlaps(t, slotEnd, b.start, b.end));
            if (!hit) out.push({ start: t.toJSDate(), end: slotEnd.toJSDate(), staffId });
          }
          t = t.plus(duration);
        }
      }
    }
  }
  return out;
}
