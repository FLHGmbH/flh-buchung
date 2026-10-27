import { REMIND_MS, remindSms, shouldRemind, smsUnits } from "./sms.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const start = new Date("2026-10-28T12:00:00.000Z");
const now = new Date(start.getTime() - 23 * 60 * 60 * 1000);
const booked = new Date(start.getTime() - 48 * 60 * 60 * 1000);
const row = { status: "confirmed", remindedAt: null as Date | null, startsAt: start, createdAt: booked };
assert(shouldRemind(row, now), "inside 24h");
assert(!shouldRemind(row, new Date(start.getTime() - 25 * 60 * 60 * 1000)), "too early");
assert(!shouldRemind(row, start), "started");
assert(!shouldRemind({ ...row, remindedAt: now }, now), "already");
assert(!shouldRemind({ ...row, status: "cancelled" }, now), "cancelled");
assert(!shouldRemind({ ...row, createdAt: new Date(start.getTime() - REMIND_MS + 60_000) }, now), "booked inside the window");
const text = remindSms({
  tenantName: "Salon",
  serviceName: "Schnitt",
  staffName: "Anna",
  when: "28.10.2026 14:00–14:45",
  cancelUrl: "https://buchungs-tool.flh-digital.de/b/salon/storno/abc",
});
assert(text.startsWith("Erinnerung in 24h: Schnitt bei Anna, 28.10.2026 14:00-14:45."), "remind text");
assert(text.endsWith("https://buchungs-tool.flh-digital.de/b/salon/storno/abc") && smsUnits(text) === 1, "remind link");
console.log("remind.check ok");
