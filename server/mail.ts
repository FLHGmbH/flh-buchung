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

export function mailboxAddr(from: string) {
  return (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
}

export function encodeSubject(s: string) {
  if (!/[^\x00-\x7F]/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

export function dotStuff(s: string) {
  return s.replace(/^\./gm, "..");
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

async function smtpSend(opts: { from: string; to: string; subject: string; text: string; html: string }) {
  const conf = smtpConf();
  if (!conf) throw new Error("Mail ist nicht konfiguriert.");
  const from = mailboxAddr(opts.from);
  const to = mailboxAddr(opts.to);
  const bound = `b${Date.now().toString(16)}`;
  const body = dotStuff(
    [
      `From: ${opts.from}`,
      `To: ${opts.to}`,
      `Subject: ${encodeSubject(opts.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${bound}"`,
      "",
      `--${bound}`,
      'Content-Type: text/plain; charset="utf-8"',
      "",
      opts.text,
      `--${bound}`,
      'Content-Type: text/html; charset="utf-8"',
      "",
      opts.html,
      `--${bound}--`,
      "",
    ].join("\r\n"),
  );
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
    const mf = await s.cmd(`MAIL FROM:<${from}>`);
    if (mf.code !== 250) throw new Error(`SMTP ${mf.code}`);
    const rt = await s.cmd(`RCPT TO:<${to}>`);
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

export async function sendPinMail(opts: { to: string; pin: string; tenantName: string; when: string }) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein.");
  const when = escHtml(opts.when);
  const pin = escHtml(opts.pin);
  const name = escHtml(opts.tenantName);
  try {
    await smtpSend({
      from,
      to: opts.to,
      subject: `Dein Code für ${opts.tenantName}`,
      text: `Dein Bestätigungscode: ${opts.pin}\nTermin: ${opts.when}\nGültig 15 Minuten.`,
      html: `<p>Dein Bestätigungscode für ${name}: <strong>${pin}</strong></p><p>Termin: ${when}</p><p>Gültig 15 Minuten.</p>`,
    });
  } catch (e) {
    console.error("smtp failed", e instanceof Error ? e.message : e);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}
