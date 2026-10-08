import { randomInt } from "node:crypto";
import { connect } from "node:tls";
import { mailFromAddr } from "./guard.ts";

export const PIN_MS = 15 * 60 * 1000;

export function newPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
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

export function mailEnding(sign: string, imageUrl: string) {
  const text = sign.trim() ? `\n\n${sign.trim()}` : "";
  const safe = escHtml(sign.trim()).replace(/\n/g, "<br>");
  const html = `${safe ? `<p style="margin:1.25rem 0 0">${safe}</p>` : ""}${imageUrl ? `<p style="margin:0.75rem 0 0"><img src="${escHtml(imageUrl)}" alt="" width="180" style="max-width:180px;height:auto"></p>` : ""}`;
  return { text, html };
}

export function guestInfoMail(kind: "move" | "cancel", opts: {
  guestName: string;
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  before?: string;
  sign?: string;
  imageUrl?: string;
}) {
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  const summary = opts.staffName ? `${opts.serviceName} bei ${opts.staffName}` : opts.serviceName;
  const name = escHtml(opts.guestName);
  const tenant = escHtml(opts.tenantName);
  const what = escHtml(summary);
  const when = escHtml(opts.when);
  if (kind === "cancel") {
    return {
      subject: `Termin storniert – ${opts.tenantName}`,
      text: `Hallo ${opts.guestName},\n\ndein Termin wurde storniert.\n\n${summary}\n${opts.when}\n\n${opts.tenantName}${end.text}`,
      html: `<p>Hallo ${name},</p><p>dein Termin wurde storniert.</p><p><strong>${what}</strong><br>${when}</p><p>${tenant}</p>${end.html}`,
    };
  }
  const before = escHtml(opts.before ?? "");
  return {
    subject: `Termin verschoben – ${opts.tenantName}`,
    text: `Hallo ${opts.guestName},\n\ndein Termin wurde verschoben.\n\nBisher: ${opts.before ?? ""}\nNeu: ${summary}\n${opts.when}\n\n${opts.tenantName}${end.text}`,
    html: `<p>Hallo ${name},</p><p>dein Termin wurde verschoben.</p><p>Bisher: ${before}<br>Neu: <strong>${what}</strong><br>${when}</p><p>${tenant}</p>${end.html}`,
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

export async function sendPinMail(opts: { to: string; pin: string; tenantName: string; when: string; sign?: string; imageUrl?: string }) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  const when = escHtml(opts.when);
  const pin = escHtml(opts.pin);
  const name = escHtml(opts.tenantName);
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  try {
    await smtpSend({
      from,
      to: opts.to,
      subject: `Dein Code für ${opts.tenantName}`,
      text: `Dein Bestätigungscode: ${opts.pin}\nTermin: ${opts.when}\nGültig 15 Minuten.${end.text}`,
      html: `<p>Dein Bestätigungscode für ${name}: <strong>${pin}</strong></p><p>Termin: ${when}</p><p>Gültig 15 Minuten.</p>${end.html}`,
    });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}

export async function sendConfirmMail(opts: {
  to: string;
  guestName: string;
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  uid: string;
  start: Date;
  end: Date;
  also?: { uid: string; serviceName: string; staffName: string; when: string; start: Date; end: Date }[];
  sign?: string;
  imageUrl?: string;
}) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  const name = escHtml(opts.guestName);
  const tenant = escHtml(opts.tenantName);
  const summary = opts.staffName ? `${opts.serviceName} bei ${opts.staffName}` : opts.serviceName;
  const lines = [
    { serviceName: opts.serviceName, staffName: opts.staffName, when: opts.when, summary },
    ...(opts.also ?? []).map((ev) => ({
      serviceName: ev.serviceName,
      staffName: ev.staffName,
      when: ev.when,
      summary: ev.staffName ? `${ev.serviceName} bei ${ev.staffName}` : ev.serviceName,
    })),
  ];
  const block = lines.map((l) => `${l.summary}\n${l.when}`).join("\n\n");
  const htmlBlock = lines
    .map((l) => `<p><strong>${escHtml(l.summary)}</strong><br>${escHtml(l.when)}</p>`)
    .join("");
  const end = mailEnding(opts.sign ?? "", opts.imageUrl ?? "");
  const text = `Hallo ${opts.guestName},\n\ndein Termin ist bestätigt.\n\n${block}\n${opts.tenantName}\n\nIm Anhang liegt termin.ics zum Speichern in deinem Kalender.${end.text}`;
  try {
    await smtpSend({
      from,
      to: opts.to,
      subject: `Termin bestätigt – ${opts.tenantName}`,
      text,
      html: `<p>Hallo ${name},</p><p>dein Termin ist bestätigt.</p>${htmlBlock}<p>${tenant}</p><p>Im Anhang liegt <strong>termin.ics</strong> zum Speichern in deinem Kalender.</p>${end.html}`,
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
    });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}
