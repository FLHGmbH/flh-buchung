import { brandHex, brandOf } from "./brand.ts";
import { guestMail, guestPhone, blockedGuest, phoneKey } from "./guest.ts";
import { confirmIcs, confirmMail, dotStuff, encodeSubject, escHtml, guestInfoMail, icsEscape, icsFold, icsUtc, mailbox, mailboxAddr, mailEnding, mimeBody, newCancelToken, newPin, PIN_MS, pinMail } from "./mail.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(PIN_MS === 15 * 60 * 1000, "PIN_MS");
for (let i = 0; i < 40; i++) {
  const p = newPin();
  assert(/^\d{6}$/.test(p), `pin ${p}`);
}
const seen = new Set(Array.from({ length: 80 }, () => newPin()));
assert(seen.size > 1, "pins must vary");
assert(escHtml(`<img src=x onerror=alert(1)>`) === "&lt;img src=x onerror=alert(1)&gt;", "esc tags");
assert(escHtml(`a&b"c'd`) === "a&amp;b&quot;c&#39;d", "esc entities");
assert(mailboxAddr("FLH <kalender@flh-webdesign.de>") === "kalender@flh-webdesign.de", "from angle");
assert(mailboxAddr("kalender@flh-webdesign.de") === "kalender@flh-webdesign.de", "from bare");
assert(mailbox("FLH <kalender@flh-webdesign.de>")?.header === "FLH <kalender@flh-webdesign.de>", "from header");
assert(mailboxAddr("a@b.de\r\nRCPT TO:<c@d.de>") === null, "no crlf");
assert(mailboxAddr("a@b.de\ncc@d.de") === null, "no lf");
assert(guestMail("Max@Mustermann.DE") && guestMail("max.m+tag@example.co.uk"), "guest mail");
assert(!guestMail("a@b") && !guestMail("a@b.c") && !guestMail("max@") && !guestMail("a@@b.de") && !guestMail("a@b.de\ncc@d.de"), "guest mail reject");
assert(guestPhone("") && guestPhone("0151 12345678") && guestPhone("+49 151 12345678") && guestPhone("089/12345678"), "guest phone");
assert(!guestPhone("abc") && !guestPhone("123") && !guestPhone("++49151") && !guestPhone("1234567890123456"), "guest phone reject");
assert(phoneKey("0170 000000") === phoneKey("+49 170 000000") && phoneKey("0170 000000") === "170000000", "phone key");
const missed = [{ guestEmail: "Lea@Example.test", guestPhone: "0170 000000" }];
assert(blockedGuest(missed, "lea@example.test", "0151 111") && blockedGuest(missed, "other@example.test", "+49 170 000000"), "noshow match");
assert(!blockedGuest(missed, "other@example.test", "0151 12345678") && !blockedGuest([], "lea@example.test", "0170 000000"), "noshow miss");
assert(encodeSubject("Code") === "Code", "ascii subject");
assert(encodeSubject("für").startsWith("=?UTF-8?B?"), "utf8 subject");
assert(dotStuff("ok\n.\nhi") === "ok\n..\nhi", "dot stuff");
assert(icsUtc(new Date("2026-10-02T09:00:00.000Z")) === "20261002T090000Z", "ics utc");
assert(icsEscape("a,b;c\nd") === "a\\,b\\;c\\nd", "ics escape");
const long = icsFold(`SUMMARY:${"ä".repeat(40)}`);
assert(long.includes("\r\n "), "ics fold");
assert(!long.split("\r\n").some((l) => Buffer.byteLength(l) > 75), "ics fold width");
const ics = confirmIcs({
  uid: "b1@flh-kalender",
  start: new Date("2026-10-02T09:00:00.000Z"),
  end: new Date("2026-10-02T09:45:00.000Z"),
  summary: "Schnitt, Farbe",
  description: "Salon. 02.10.2026.",
});
assert(ics.includes("BEGIN:VCALENDAR") && ics.includes("DTSTART:20261002T090000Z") && ics.includes("SUMMARY:Schnitt\\, Farbe"), "ics event");
const mime = mimeBody({ from: "a@b.de", to: "c@d.de", subject: "ok", text: "t", html: "<p>t</p>", ics });
assert(mime.includes('filename="termin.ics"') && mime.includes("text/calendar"), "ics attached");
assert(!mimeBody({ from: "a@b.de", to: "c@d.de", subject: "ok", text: "t", html: "<p>t</p>" }).includes("termin.ics"), "pin mail plain");
const end = mailEnding("Bis bald\nSalon", "https://cdn.example/logo.png");
assert(end.text.includes("Bis bald") && end.html.includes("<br>Salon") && end.html.includes("https://cdn.example/logo.png"), "mail ending");
assert(!mailEnding(`<b>`, "").html.includes("<b>"), "mail ending escapes");
const moved = guestInfoMail("move", { guestName: "Lea", tenantName: "Salon", serviceName: "Schnitt", staffName: "Anna", when: "09.10.2026 12:30–13:15", before: "09.10.2026 11:00–11:45", sign: "Bis bald" });
assert(moved.subject.startsWith("Termin verschoben") && moved.text.includes("Bisher: 09.10.2026 11:00–11:45") && moved.text.includes("Bis bald"), "move mail");
const cancelled = guestInfoMail("cancel", { guestName: "Lea", tenantName: "Salon", serviceName: "Schnitt", staffName: "", when: "09.10.2026 11:00–11:45", sign: "Bis bald" });
assert(cancelled.subject.startsWith("Termin storniert") && cancelled.html.includes("Bis bald") && !cancelled.html.includes("<script>"), "cancel mail");
const token = newCancelToken();
assert(/^[A-Za-z0-9_-]{24}$/.test(token) && newCancelToken() !== token, "cancel token");
const stop = "https://flh.example/b/salon/storno/abc?x=1&y=2";
const confirmed = confirmMail({
  guestName: "Lea",
  tenantName: "Salon",
  serviceName: "Schnitt",
  staffName: "Anna",
  when: "20.10.2026 14:00–14:45",
  uid: "b1@flh-kalender",
  start: new Date("2026-10-20T12:00:00.000Z"),
  end: new Date("2026-10-20T12:45:00.000Z"),
  cancelUrl: stop,
});
assert(confirmed.text.includes(`Termin verschieben/stornieren: ${stop}`), "confirm link text");
assert(confirmed.html.includes(`href="${escHtml(stop)}"`) && confirmed.html.includes("Termin verschieben/stornieren"), "confirm link html");
assert(confirmed.html.includes("background:#006478") && confirmed.html.includes(">Salon<"), "confirm card");
assert(confirmed.html.includes("color:#006478") && !confirmed.html.includes("color:#9b2c2c") && confirmed.text.includes("Mit einem Klick auf termin.ics"), "confirm link color");
const withSite = confirmMail({
  guestName: "Lea",
  tenantName: "Salon",
  serviceName: "Schnitt",
  staffName: "",
  when: "20.10.2026 14:00–14:45",
  uid: "b1@flh-kalender",
  start: new Date("2026-10-20T12:00:00.000Z"),
  end: new Date("2026-10-20T12:45:00.000Z"),
  site: "https://www.salon.example/team",
});
assert(withSite.html.includes("Unsere Homepage") && withSite.html.includes(">salon.example/team<") && withSite.text.includes("https://www.salon.example/team"), "homepage link");
assert(brandHex("") === "" && brandHex("#Be185D") === "#be185d" && brandHex("red") === null && brandHex("#fff") === null, "brand hex");
assert(brandOf("").base === "#006478" && brandOf("#006478").base === "#006478", "petrol stays");
assert(brandOf("#ffffff").base !== "#ffffff" && brandOf("#ffff00").base !== "#ffff00", "light brand darkens");
const dyed = confirmMail({
  guestName: "Lea",
  tenantName: "Salon",
  serviceName: "Schnitt",
  staffName: "",
  when: "20.10.2026 14:00–14:45",
  uid: "b1@flh-kalender",
  start: new Date("2026-10-20T12:00:00.000Z"),
  end: new Date("2026-10-20T12:45:00.000Z"),
  brand: "#be185d",
  site: "https://salon.example",
  cancelUrl: stop,
});
const dyedBase = brandOf("#be185d").base;
assert(dyed.html.includes(`background:${dyedBase}`) && !dyed.html.includes("background:#006478") && dyed.html.includes(`color:${dyedBase}`) && !dyed.html.includes("color:#9b2c2c"), "branded mail");
const coded = pinMail({ pin: "123456", tenantName: "Salon", when: "20.10.2026 14:00", logoUrl: "https://cdn.example/logo.png", sign: "Bis bald" });
assert(coded.html.includes("123456") && coded.html.includes("https://cdn.example/logo.png") && coded.html.includes("Bis bald") && coded.text.includes("123456"), "pin card");
const prevOrigin = process.env.PUBLIC_ORIGIN;
process.env.PUBLIC_ORIGIN = "https://book.example";
const branded = pinMail({ pin: "123456", tenantName: "Salon", when: "20.10.2026 14:00" });
assert(branded.html.includes("https://book.example/kalendaa.png") && branded.html.includes('href="https://www.flh-digital.de/"') && branded.text.includes("Powered by FLH - Kalender"), "flh credit");
assert(cancelled.text.includes("Powered by FLH - Kalender") && confirmed.text.includes("https://www.flh-digital.de/") && moved.html.includes("Powered by FLH - Kalender"), "flh credit on every mail");
if (prevOrigin) process.env.PUBLIC_ORIGIN = prevOrigin;
else delete process.env.PUBLIC_ORIGIN;
console.log("mail.check ok");
