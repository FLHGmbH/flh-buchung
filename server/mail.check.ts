import { escHtml, newPin, PIN_MS } from "./mail.ts";

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
console.log("mail.check ok");
