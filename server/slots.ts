import { DateTime } from "luxon";

export type Hours = { weekday: number; startHm: string; endHm: string };
export type StaffHours = { staffId: string; weekday: number; startHm: string; endHm: string };
export type Busy = { staffId: string; start: Date; end: Date };
export type Slot = { start: Date; end: Date; staffId: string };

function atHm(day: DateTime, hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return day.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

function overlaps(a0: DateTime, a1: DateTime, b0: DateTime, b1: DateTime) {
  return a0 < b1 && a1 > b0;
}

function hmMin(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function clipHm(a0: string, a1: string, b0: string, b1: string) {
  const start = Math.max(hmMin(a0), hmMin(b0));
  const end = Math.min(hmMin(a1), hmMin(b1));
  if (end <= start) return null;
  const pad = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
  return { startHm: pad(start), endHm: pad(end) };
}

export function staffTaken(start: Date, end: Date, ownBufferMin: number, busy: { start: Date; end: Date }[]) {
  const until = end.getTime() + ownBufferMin * 60_000;
  const from = start.getTime();
  return busy.some((b) => from < b.end.getTime() && until > b.start.getTime());
}

export function freeSlots(opts: {
  zone: string;
  hours: Hours[];
  busy?: Busy[];
  staffHours?: StaffHours[];
  staffIds: string[];
  durationMin: number;
  from: Date;
  to: Date;
  now: Date;
  minNoticeMin: number;
}): Slot[] {
  if (!Number.isFinite(opts.durationMin) || opts.durationMin <= 0) return [];
  const zone = opts.zone;
  const duration = { minutes: opts.durationMin };
  const earliest = DateTime.fromJSDate(opts.now, { zone }).plus({ minutes: opts.minNoticeMin });
  const from = DateTime.fromJSDate(opts.from, { zone });
  const to = DateTime.fromJSDate(opts.to, { zone });
  const startDay = from.startOf("day");
  const endDay = to.startOf("day");
  const out: Slot[] = [];

  for (let day = startDay; day <= endDay; day = day.plus({ days: 1 })) {
    const shop = opts.hours.filter((h) => h.weekday === day.weekday);
    for (const staffId of opts.staffIds) {
      const marked = (opts.staffHours ?? []).some((h) => h.staffId === staffId);
      const own = (opts.staffHours ?? []).filter((h) => h.staffId === staffId && h.weekday === day.weekday);
      const windows = marked
        ? shop.flatMap((w) => own.flatMap((o) => {
            const hit = clipHm(w.startHm, w.endHm, o.startHm, o.endHm);
            return hit ? [hit] : [];
          }))
        : shop;
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
