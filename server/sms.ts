// Seven.io SMS. POST /api/sms, key in X-Api-Key. https://docs.seven.io/de/rest-api/endpunkte/sms

const SMS_MS = 8000;
// GSM-7: 160 Zeichen = 1 SMS. Ein Zeichen ausserhalb (der Gedankenstrich in der Uhrzeit) schaltet auf Unicode, dann sind es 67 pro Teil.
const GSM1 = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM2 = "^{}\\[~]|€\f";

function septets(s: string) {
  let n = 0;
  for (const ch of s) n += GSM2.includes(ch) ? 2 : 1;
  return n;
}

function toGsm(raw: string) {
  const swapped = raw
    .replace(/[–—−‐]/g, "-")
    .replace(/[‘’‚`´]/g, "'")
    .replace(/[“”„]/g, "\"")
    .replace(/\u00a0/g, " ")
    .replace(/…/g, "...")
    .replace(/[áâãåā]/g, (c) => (c === "å" ? "å" : "a"))
    .replace(/[êëē]/g, "e")
    .replace(/[íîïī]/g, "i")
    .replace(/[óôõō]/g, "o")
    .replace(/[úûū]/g, "u")
    .replace(/ç/g, "c")
    .replace(/ñ/g, "n");
  let out = "";
  for (const ch of swapped) {
    if (GSM1.includes(ch) || GSM2.includes(ch)) out += ch;
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

function clipGsm(s: string, max: number) {
  let out = "";
  let n = 0;
  for (const ch of s) {
    const w = GSM2.includes(ch) ? 2 : 1;
    if (n + w > max) break;
    out += ch;
    n += w;
  }
  return out.trim();
}

// Link bleibt ganz. Was nicht mehr passt, wird vor der Uhrzeit abgeschnitten.
function fitSms(extra: string, must: string, url: string) {
  const link = toGsm(url);
  const tail = toGsm(must);
  const mid = toGsm(extra);
  const linkCost = link ? septets(link) + 1 : 0;
  const room = 160 - linkCost - septets(tail);
  const piece = room > 0 ? clipGsm(mid, room) : "";
  const body = `${piece}${tail}`.replace(/ +/g, " ").trim();
  if (!link) return clipGsm(body, 160);
  if (septets(body) + 1 + septets(link) <= 160) return `${body} ${link}`;
  return clipGsm(link, 160);
}

export function smsUnits(text: string) {
  const n = septets(toGsm(text));
  if (n <= 160) return 1;
  return Math.ceil(n / 153);
}
export const REMIND_MS = 24 * 60 * 60 * 1000;

export function shouldRemind(row: { status: string; remindedAt: Date | null; startsAt: Date; createdAt: Date }, now: Date) {
  if (row.status !== "confirmed" || row.remindedAt) return false;
  const start = row.startsAt.getTime();
  const t = now.getTime();
  if (!(start > t && start - t <= REMIND_MS)) return false;
  return row.createdAt.getTime() < start - REMIND_MS;
}

export function smsTo(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `49${d.slice(1)}`;
  if (d.length < 8 || d.length > 15) return "";
  return d;
}

// 11 letters or 16 digits. Seven rejects anything longer (code 201).
export function smsFrom(name: string) {
  const s = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "");
  if (!s) return "";
  return s.slice(0, /^\d+$/.test(s) ? 16 : 11);
}

export function remindSms(opts: {
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  cancelUrl?: string;
}) {
  const what = opts.staffName ? `${opts.serviceName} bei ${opts.staffName}` : opts.serviceName;
  return fitSms(`Erinnerung in 24h: ${what}`, `, ${opts.when}.`, opts.cancelUrl ?? "");
}

export function confirmSms(opts: {
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  cancelUrl?: string;
  also?: { serviceName: string; staffName: string; when: string; cancelUrl?: string }[];
}) {
  const what = (s: { serviceName: string; staffName: string }) => s.staffName ? `${s.serviceName} bei ${s.staffName}` : s.serviceName;
  const more = (opts.also ?? []).map(what).filter(Boolean).join(", ");
  const extra = `Termin bestätigt: ${what(opts)}${more ? `, ${more}` : ""}`;
  return fitSms(extra, `, ${opts.when}.`, opts.cancelUrl ?? "");
}

export async function sendConfirmSms(opts: { to: string; fromName: string; text: string }): Promise<boolean> {
  const key = process.env.SEVEN_API_KEY?.trim();
  const to = smsTo(opts.to);
  if (!key || !to || !opts.text.trim()) return false;
  const body = new URLSearchParams({ to, text: opts.text });
  const from = smsFrom(opts.fromName);
  if (from) body.set("from", from);
  try {
    let code = await postSms(key, body);
    if (code === "201" && from) {
      body.delete("from");
      code = await postSms(key, body);
    }
    if (code !== "100") {
      console.error("sms failed", code);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sms failed", e instanceof Error ? e.message : e);
    return false;
  }
}

async function postSms(key: string, body: URLSearchParams) {
  const res = await fetch("https://gateway.seven.io/api/sms", {
    method: "POST",
    headers: {
      "X-Api-Key": key,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(SMS_MS),
  });
  const data = await res.json().catch(() => null) as { success?: string } | null;
  return data?.success ?? String(res.status);
}
