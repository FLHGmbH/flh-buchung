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

export function shiftCovers(opts: {
  zone: string;
  hours: Hours[];
  staffHours?: StaffHours[];
  staffId: string;
  start: Date;
  end: Date;
}) {
  const start = DateTime.fromJSDate(opts.start, { zone: opts.zone });
  const end = DateTime.fromJSDate(opts.end, { zone: opts.zone });
  const last = end.minus({ milliseconds: 1 });
  if (!start.isValid || !end.isValid || end <= start || start.toISODate() !== last.toISODate()) return false;
  const day = start.startOf("day");
  const shop = opts.hours.filter((h) => h.weekday === day.weekday);
  const marked = (opts.staffHours ?? []).some((h) => h.staffId === opts.staffId);
  const own = (opts.staffHours ?? []).filter((h) => h.staffId === opts.staffId && h.weekday === day.weekday);
  const windows = marked
    ? shop.flatMap((w) => own.flatMap((o) => {
        const hit = clipHm(w.startHm, w.endHm, o.startHm, o.endHm);
        return hit ? [hit] : [];
      }))
    : shop;
  return windows.some((w) => start >= atHm(day, w.startHm) && end <= atHm(day, w.endHm));
}

export function planChain(opts: {
  zone: string;
  hours: Hours[];
  staffHours?: StaffHours[];
  busy?: Busy[];
  start: Date;
  primaryStaffId: string;
  chain: { id: string; durationMin: number; bufferMin: number; staffIds: string[] }[];
}) {
  const steps: { serviceId: string; staffId: string; start: Date; end: Date }[] = [];
  const phantom: Busy[] = [];
  let cursor = opts.start;
  let prefer = opts.primaryStaffId;
  for (let i = 0; i < opts.chain.length; i++) {
    const svc = opts.chain[i];
    if (!svc || svc.durationMin <= 0) return null;
    const end = new Date(cursor.getTime() + svc.durationMin * 60_000);
    const pool = i === 0 ? [opts.primaryStaffId] : [...new Set([prefer, ...svc.staffIds])];
    const who = pool.find((id) => {
      if (!svc.staffIds.includes(id)) return false;
      if (!shiftCovers({ zone: opts.zone, hours: opts.hours, staffHours: opts.staffHours, staffId: id, start: cursor, end })) return false;
      const mine = [...(opts.busy ?? []), ...phantom].filter((b) => b.staffId === id);
      return !staffTaken(cursor, end, svc.bufferMin, mine);
    });
    if (!who) return null;
    steps.push({ serviceId: svc.id, staffId: who, start: cursor, end });
    phantom.push({ staffId: who, start: cursor, end: new Date(end.getTime() + svc.bufferMin * 60_000) });
    prefer = who;
    cursor = new Date(end.getTime() + svc.bufferMin * 60_000);
  }
  return steps;
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
