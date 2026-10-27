import { confirmSms, smsFrom, smsTo } from "./sms.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(smsTo("0151 12345678") === "4915112345678", "de national");
assert(smsTo("+49 151 12345678") === "4915112345678", "de plus");
assert(smsTo("004915112345678") === "4915112345678", "de 00");
assert(smsTo("+33 612345678") === "33612345678", "foreign");
assert(smsTo("") === "" && smsTo("abc") === "" && smsTo("123") === "", "reject");
assert(smsFrom("Müller & Co") === "MullerCo", "from name");
assert(smsFrom("123456789012345678") === "1234567890123456", "from digits");
assert(smsFrom("!!!") === "", "from empty");
const text = confirmSms({
  tenantName: "Salon",
  serviceName: "Schnitt",
  staffName: "Anna",
  when: "20.10.2026 14:00–14:45",
  cancelUrl: "https://buchungs-tool.flh-digital.de/b/salon/storno/abc",
  also: [{ serviceName: "Farbe", staffName: "", when: "20.10.2026 15:00–16:00", cancelUrl: "https://buchungs-tool.flh-digital.de/b/salon/storno/def" }],
});
assert(text.startsWith("Termin bestätigt bei Salon: Schnitt bei Anna, 20.10.2026 14:00–14:45. https://buchungs-tool.flh-digital.de/b/salon/storno/abc"), "sms text");
assert(text.includes("Farbe, 20.10.2026 15:00–16:00. https://buchungs-tool.flh-digital.de/b/salon/storno/def"), "sms also");
console.log("sms.check ok");
