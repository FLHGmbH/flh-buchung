import { guestMail, guestPhone } from "./guest.ts";
import { confirmIcs, dotStuff, encodeSubject, escHtml, icsEscape, icsFold, icsUtc, mailbox, mailboxAddr, mailEnding, mimeBody, newPin, PIN_MS } from "./mail.ts";

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
console.log("mail.check ok");
