import { eventBody, openToken, readGoogleEvent, readState, sealToken, signState } from "./google.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const secret = "test-secret";
const sealed = sealToken("refresh-1", secret);
assert(openToken(sealed, secret) === "refresh-1", "roundtrip");
assert(sealed !== "refresh-1", "not plaintext");
let broke = false;
try {
  openToken(sealed, "other");
} catch {
  broke = true;
}
assert(broke, "wrong key fails");

const state = signState("tid-1", secret, 1_000);
assert(readState(state, secret, 1_000) === "tid-1", "state");
assert(readState(state, secret, 1_000 + 11 * 60 * 1000) === null, "state expired");
assert(readState(state, "other", 1_000) === null, "state key");
assert(readState(`${state}x`, secret, 1_000) === null, "state tamper");

const ev = eventBody({
  guestName: "Ada",
  guestEmail: "ada@example.de",
  guestPhone: "030",
  note: "kurz",
  startsAt: new Date("2026-10-19T07:00:00Z"),
  endsAt: new Date("2026-10-19T07:45:00Z"),
  serviceName: "Schnitt",
  staffName: "Anna",
});
assert(ev.summary === "Ada · Schnitt", "summary");
assert(ev.description.includes("Anna") && ev.description.includes("kurz"), "description");
assert(ev.start.dateTime === "2026-10-19T07:00:00.000Z", "start");

const moved = readGoogleEvent({
  id: "e1",
  summary: "Ada · Schnitt",
  description: "Mitarbeiter: Anna",
  start: { dateTime: "2026-10-20T08:00:00Z" },
  end: { dateTime: "2026-10-20T08:45:00Z" },
});
assert(moved && !moved.gone && moved.guestName === "Ada" && moved.serviceName === "Schnitt" && moved.staffName === "Anna", "moved");
assert(readGoogleEvent({ id: "e2", status: "cancelled" })?.gone === true, "gone");
assert(readGoogleEvent({ id: "e3", start: { date: "2026-10-20" }, end: { date: "2026-10-21" } }) === null, "all day");
assert(readGoogleEvent({ id: "e4", recurringEventId: "r", start: { dateTime: "2026-10-20T08:00:00Z" }, end: { dateTime: "2026-10-20T09:00:00Z" } }) === null, "series");

console.log("google ok");
