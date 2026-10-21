import { randomBytes, randomInt } from "node:crypto";
import { connect } from "node:tls";
import { mailFromAddr } from "./guard.ts";

export const PIN_MS = 15 * 60 * 1000;

export function newPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function newCancelToken() {
  return randomBytes(18).toString("base64url");
}

export function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function mailbox(from: string): { addr: string; header: string } | null {
  const raw = from.trim();
  if (!raw || /[\0\r\n]/.test(raw)) return null;
  const angled = raw.match(/^(.*)<([^<>]+)>$/);
  const addr = (angled ? angled[2] : raw).trim();
  if (!/^[^\s<>@]+@[^\s<>@]+$/.test(addr)) return null;
  if (!angled) return { addr, header: addr };
  const name = angled[1].trim();
  if (/[<>"]/.test(name)) return null;
  return { addr, header: name ? `${name} <${addr}>` : addr };
}

export function mailboxAddr(from: string) {
  return mailbox(from)?.addr ?? null;
}

export function encodeSubject(s: string) {
  if (!/[^\x00-\x7F]/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

export function dotStuff(s: string) {
  return s.replace(/^\./gm, "..");
}

export function icsUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
}

export function icsFold(s: string) {
  return s.split("\r\n").map((line) => {
    const bytes = Buffer.from(line, "utf8");
    if (bytes.length <= 75) return line;
    const parts: string[] = [];
    let i = 0;
    let limit = 75;
    while (i < bytes.length) {
      let end = Math.min(i + limit, bytes.length);
      while (end > i && (bytes[end]! & 0xc0) === 0x80) end--;
      if (end === i) end = Math.min(i + limit, bytes.length);
      parts.push(bytes.subarray(i, end).toString("utf8"));
      i = end;
      limit = 74;
    }
    return parts.join("\r\n ");
  }).join("\r\n");
}

export function confirmIcs(opts: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  also?: { uid: string; start: Date; end: Date; summary: string; description: string }[];
}) {
  const events = [opts, ...(opts.also ?? [])];
  return icsFold([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FLH DIGITAL//Buchung//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flatMap((ev) => [
      "BEGIN:VEVENT",
      `UID:${icsEscape(ev.uid)}`,
      `DTSTAMP:${icsUtc(new Date())}`,
      `DTSTART:${icsUtc(ev.start)}`,
      `DTEND:${icsUtc(ev.end)}`,
      `SUMMARY:${icsEscape(ev.summary)}`,
      `DESCRIPTION:${icsEscape(ev.description)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ].join("\r\n"));
}

function b64Lines(s: string) {
  return Buffer.from(s, "utf8").toString("base64").match(/.{1,76}/g)!.join("\r\n");
}

export function mimeBody(opts: { from: string; to: string; subject: string; text: string; html: string; ics?: string }) {
  const alt = `a${Date.now().toString(16)}`;
  const inner = [
    `--${alt}`,
    'Content-Type: text/plain; charset="utf-8"',
    "",
    opts.text,
    `--${alt}`,
    'Content-Type: text/html; charset="utf-8"',
    "",
    opts.html,
    `--${alt}--`,
    "",
  ].join("\r\n");
  const head = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeSubject(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
  ];
  if (!opts.ics) {
    return dotStuff([...head, `Content-Type: multipart/alternative; boundary="${alt}"`, "", inner].join("\r\n"));
  }
  const mixed = `m${Date.now().toString(16)}`;
  return dotStuff([
    ...head,
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    inner,
    `--${mixed}`,
    'Content-Type: text/calendar; charset="utf-8"; method=PUBLISH; name="termin.ics"',
    'Content-Disposition: attachment; filename="termin.ics"',
    "Content-Transfer-Encoding: base64",
    "",
    b64Lines(opts.ics),
    `--${mixed}--`,
    "",
  ].join("\r\n"));
}

function smtpConf() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1) return null;
  return { host, port, user, pass };
}

function tlsSmtp(host: string, port: number) {
  const sock = connect({ host, port, servername: host, timeout: 20_000 });
  let buf = "";
  let wait: ((s: string) => void) | null = null;
  let fail: ((e: Error) => void) | null = null;
  sock.on("data", (d) => {
    const s = d.toString("utf8");
    if (wait) {
      const w = wait;
      wait = null;
      fail = null;
      w(s);
    } else buf += s;
  });
  sock.on("error", (e) => {
    fail?.(e instanceof Error ? e : new Error(String(e)));
    wait = null;
    fail = null;
  });
  const readChunk = () =>
    new Promise<string>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("SMTP timeout.")), 20_000);
      wait = (s) => {
        clearTimeout(t);
        resolve(s);
      };
      fail = (e) => {
        clearTimeout(t);
        reject(e);
      };
    });
  const reply = async () => {
    const start = Date.now();
    while (Date.now() - start < 20_000) {
      if (buf.endsWith("\r\n")) {
        const body = buf.split("\r\n").filter((l) => l.length);
        const last = body.at(-1);
        if (last && /^\d{3}(?: |$)/.test(last) && body.every((l) => /^\d{3}[ -]/.test(l) || /^\d{3}$/.test(l))) {
          buf = "";
          return { code: Number(last.slice(0, 3)), text: body.join("\n") };
        }
      }
      buf += await readChunk();
    }
    throw new Error("SMTP timeout.");
  };
  const cmd = async (line?: string) => {
    if (line != null) sock.write(line.endsWith("\r\n") ? line : `${line}\r\n`);
    return reply();
  };
  return {
    cmd,
    end: () =>
      new Promise<void>((resolve) => {
        sock.end();
        sock.once("close", () => resolve());
        setTimeout(resolve, 500);
      }),
  };
}

async function smtpSend(opts: { from: string; to: string; subject: string; text: string; html: string; ics?: string }) {
  const conf = smtpConf();
  if (!conf) throw new Error("Mail ist nicht konfiguriert.");
  const fromBox = mailbox(opts.from);
  const toBox = mailbox(opts.to);
  if (!fromBox || !toBox) throw new Error("Empfänger ungültig.");
  const body = mimeBody({ ...opts, from: fromBox.header, to: toBox.header });
  const s = tlsSmtp(conf.host, conf.port);
  try {
    const banner = await s.cmd();
    if (banner.code !== 220) throw new Error(`SMTP ${banner.code}`);
    const ehlo = await s.cmd("EHLO flh-kalender");
    if (ehlo.code !== 250) throw new Error(`SMTP ${ehlo.code}`);
    const auth = await s.cmd("AUTH LOGIN");
    if (auth.code !== 334) throw new Error(`SMTP AUTH ${auth.code}`);
    const u = await s.cmd(Buffer.from(conf.user).toString("base64"));
    if (u.code !== 334) throw new Error(`SMTP AUTH ${u.code}`);
    const p = await s.cmd(Buffer.from(conf.pass).toString("base64"));
    if (p.code !== 235) throw new Error(`SMTP AUTH ${p.code}`);
    const mf = await s.cmd(`MAIL FROM:<${fromBox.addr}>`);
    if (mf.code !== 250) throw new Error(`SMTP ${mf.code}`);
    const rt = await s.cmd(`RCPT TO:<${toBox.addr}>`);
    if (rt.code !== 250) throw new Error(`SMTP ${rt.code}`);
    const data = await s.cmd("DATA");
    if (data.code !== 354) throw new Error(`SMTP ${data.code}`);
    const done = await s.cmd(`${body}.`);
    if (done.code !== 250) throw new Error(`SMTP ${done.code}`);
    await s.cmd("QUIT").catch(() => {});
  } finally {
    await s.end();
  }
}

const FLH_URL = "https://www.flh-digital.de/";

function flhMark() {
  const o = process.env.PUBLIC_ORIGIN?.trim().replace(/\/$/, "");
  if (o) return `${o}/kalendaa.png`;
  const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return vercel ? `https://${vercel}/kalendaa.png` : "";
}

export function flhCredit() {
  const mark = flhMark();
  const img = mark
    ? `<img src="${escHtml(mark)}" alt="" width="40" height="45" style="display:block;border:0;height:auto;">`
    : "";
  return {
    text: `\n\nPowered by FLH - Kalender: ${FLH_URL}`,
    html: `<tr><td align="center" style="padding:16px 12px 8px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${img ? `<td style="padding:0 10px 0 0;vertical-align:middle;"><a href="${FLH_URL}">${img}</a></td>` : ""}<td style="vertical-align:middle;font-family:Segoe UI,system-ui,sans-serif;font-size:13px;line-height:1.3;font-weight:700;"><a href="${FLH_URL}" style="color:#ffffff;text-decoration:none;">Powered by FLH - Kalender</a></td></tr></table></td></tr>`,
  };
}

export function mailEnding(sign: string, imageUrl: string) {
  const text = sign.trim() ? `\n\n${sign.trim()}` : "";
  const safe = escHtml(sign.trim()).replace(/\n/g, "<br>");
  const html = `${safe ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #e4e7e9;font-size:13px;line-height:1.5;color:#5c656b;">${safe}</p>` : ""}${imageUrl ? `<img src="${escHtml(imageUrl)}" alt="" width="160" style="display:block;margin:12px 0 0;border:0;max-width:160px;height:auto;">` : ""}`;
  return { text, html };
}

export function siteLine(url?: string) {
  const v = url?.trim() ?? "";
  if (!v) return { text: "", html: "" };
  let label = v.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  try {
    const u = new URL(v);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    label = `${u.host.replace(/^www\./, "")}${path}`;
  } catch {
    /* keep the trimmed address */
  }
  return {
    text: `\nUnsere Homepage: ${v}`,
    html: `<p style="margin:16px 0 0;font-size:14px;line-height:1.45;color:#253239;">Unsere Homepage<br><a href="${escHtml(v)}" style="color:#006478;font-weight:700;">${escHtml(label)}</a></p>`,
  };
}

export function mailCard(opts: {
  salon: string;
  lead: string;
  rows: { label: string; value: string }[];
  code?: string;
  links?: { href: string; label: string; tone?: "stop" }[];
  note?: string;
  site?: string;
  logoUrl?: string;
  sign?: string;
  imageUrl?: string;
}) {
  const logo = opts.logoUrl
    ? `<img src="${escHtml(opts.logoUrl)}" alt="${escHtml(opts.salon)}" width="160" style="display:block;margin:0 auto 16px;border:0;max-width:160px;height:auto;">`
    : "";
  const code = opts.code
    ? `<p style="margin:18px 0 0;font-size:32px;line-height:1.2;letter-spacing:6px;font-weight:700;text-align:center;">${escHtml(opts.code)}</p>`
    : "";
  const rows = opts.rows
    .map((r) => `<tr><td style="padding:10px 12px;font-size:12px;line-height:1.3;color:#5c656b;">${escHtml(r.label)}</td><td style="padding:10px 12px;font-size:14px;line-height:1.35;font-weight:700;color:#253239;">${escHtml(r.value)}</td></tr>`)
    .join("");
  const table = rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f7f8" style="margin:16px 0 0;background:#f4f7f8;border-radius:8px;">${rows}</table>`
    : "";
  const links = (opts.links ?? [])
    .map((l) => {
      const color = l.tone === "stop" ? "#9b2c2c" : "#006478";
      return `<p style="margin:16px 0 0;text-align:center;"><a href="${escHtml(l.href)}" style="color:${color};font-weight:700;">${escHtml(l.label)}</a></p>`;
    })
    .join("");
  const note = opts.note ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.45;color:#5c656b;">${escHtml(opts.note)}</p>` : "";
  const site = siteLine(opts.site).html;
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  return `<!DOCTYPE html><html lang="de"><body style="margin:0;padding:0;background:#006478;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#006478" style="background:#006478;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="420" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:420px;background:#ffffff;border-radius:16px;">
<tr><td style="padding:28px 24px;font-family:Segoe UI,system-ui,sans-serif;color:#253239;">
${logo}
<p style="margin:0;font-size:22px;line-height:1.25;font-weight:700;">${escHtml(opts.salon)}</p>
<p style="margin:8px 0 0;font-size:15px;line-height:1.45;color:#5c656b;">${escHtml(opts.lead)}</p>
${code}${table}${note}${site}${links}${end.html}
</td></tr></table>
</td></tr>
${flhCredit().html}
</table>
</body></html>`;
}

export function guestInfoMail(kind: "move" | "cancel", opts: {
  guestName: string;
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  before?: string;
  logoUrl?: string;
  sign?: string;
  imageUrl?: string;
  site?: string;
}) {
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  const home = siteLine(opts.site);
  const summary = opts.staffName ? `${opts.serviceName} bei ${opts.staffName}` : opts.serviceName;
  const foot = { logoUrl: opts.logoUrl, sign: opts.sign, imageUrl: opts.imageUrl, site: opts.site };
  if (kind === "cancel") {
    return {
      subject: `Termin storniert – ${opts.tenantName}`,
      text: `Hallo ${opts.guestName},\n\ndein Termin wurde storniert.\n\n${summary}\n${opts.when}\n\n${opts.tenantName}${home.text}${end.text}${flhCredit().text}`,
      html: mailCard({
        salon: opts.tenantName,
        lead: `Hallo ${opts.guestName}, dein Termin wurde storniert.`,
        rows: [{ label: "Leistung", value: summary }, { label: "Zeit", value: opts.when }],
        ...foot,
      }),
    };
  }
  return {
    subject: `Termin verschoben – ${opts.tenantName}`,
    text: `Hallo ${opts.guestName},\n\ndein Termin wurde verschoben.\n\nBisher: ${opts.before ?? ""}\nNeu: ${summary}\n${opts.when}\n\n${opts.tenantName}${home.text}${end.text}${flhCredit().text}`,
    html: mailCard({
      salon: opts.tenantName,
      lead: `Hallo ${opts.guestName}, dein Termin wurde verschoben.`,
      rows: [
        { label: "Bisher", value: opts.before ?? "" },
        { label: "Neu", value: summary },
        { label: "Zeit", value: opts.when },
      ],
      ...foot,
    }),
  };
}

export async function sendGuestInfo(kind: "move" | "cancel", opts: { to: string } & Parameters<typeof guestInfoMail>[1]) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  const body = guestInfoMail(kind, opts);
  try {
    await smtpSend({ from, to: opts.to, ...body });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}

export function pinMail(opts: { pin: string; tenantName: string; when: string; logoUrl?: string; sign?: string; imageUrl?: string; site?: string }) {
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  const home = siteLine(opts.site);
  return {
    subject: `Dein Code für ${opts.tenantName}`,
    text: `Dein Bestätigungscode: ${opts.pin}\nTermin: ${opts.when}\nGültig 15 Minuten.${home.text}${end.text}${flhCredit().text}`,
    html: mailCard({
      salon: opts.tenantName,
      lead: "Dein Bestätigungscode. Er gilt 15 Minuten.",
      code: opts.pin,
      rows: [{ label: "Termin", value: opts.when }],
      logoUrl: opts.logoUrl,
      sign: opts.sign,
      imageUrl: opts.imageUrl,
      site: opts.site,
    }),
  };
}

export async function sendPinMail(opts: { to: string } & Parameters<typeof pinMail>[0]) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  try {
    await smtpSend({ from, to: opts.to, ...pinMail(opts) });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}

type ConfirmStop = {
  serviceName: string;
  staffName: string;
  when: string;
  uid: string;
  start: Date;
  end: Date;
  cancelUrl?: string;
};

export function confirmMail(opts: {
  guestName: string;
  tenantName: string;
  logoUrl?: string;
  sign?: string;
  imageUrl?: string;
  site?: string;
} & ConfirmStop & { also?: ConfirmStop[] }) {
  const summary = opts.staffName ? `${opts.serviceName} bei ${opts.staffName}` : opts.serviceName;
  const lines = [opts, ...(opts.also ?? [])].map((ev) => ({
    summary: ev.staffName ? `${ev.serviceName} bei ${ev.staffName}` : ev.serviceName,
    when: ev.when,
    cancelUrl: ev.cancelUrl ?? "",
    uid: ev.uid,
    start: ev.start,
    end: ev.end,
  }));
  const block = lines
    .map((l) => `${l.summary}\n${l.when}${l.cancelUrl ? `\nTermin verschieben/stornieren: ${l.cancelUrl}` : ""}`)
    .join("\n\n");
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  const home = siteLine(opts.site);
  const rows = lines.flatMap((l) => [
    { label: "Leistung", value: l.summary },
    { label: "Zeit", value: l.when },
  ]);
  const links = lines.filter((l) => l.cancelUrl).map((l) => ({
    href: l.cancelUrl,
    label: lines.length > 1 ? `${l.summary} verschieben/stornieren` : "Termin verschieben/stornieren",
    tone: "stop" as const,
  }));
  const calNote = "Mit einem Klick auf termin.ics im Anhang trägst du den Termin in deinen Kalender ein.";
  return {
    subject: `Termin bestätigt – ${opts.tenantName}`,
    text: `Hallo ${opts.guestName},\n\ndein Termin ist bestätigt.\n\n${block}\n${opts.tenantName}\n\n${calNote}${home.text}${end.text}${flhCredit().text}`,
    html: mailCard({
      salon: opts.tenantName,
      lead: `Hallo ${opts.guestName}, dein Termin ist bestätigt.`,
      rows,
      links,
      note: calNote,
      site: opts.site,
      logoUrl: opts.logoUrl,
      sign: opts.sign,
      imageUrl: opts.imageUrl,
    }),
    ics: confirmIcs({
      uid: opts.uid,
      start: opts.start,
      end: opts.end,
      summary,
      description: `${opts.tenantName}. ${opts.when}.`,
      also: (opts.also ?? []).map((ev) => ({
        uid: ev.uid,
        start: ev.start,
        end: ev.end,
        summary: ev.staffName ? `${ev.serviceName} bei ${ev.staffName}` : ev.serviceName,
        description: `${opts.tenantName}. ${ev.when}.`,
      })),
    }),
  };
}

export async function sendConfirmMail(opts: { to: string } & Parameters<typeof confirmMail>[0]) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  try {
    await smtpSend({ from, to: opts.to, ...confirmMail(opts) });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}
