import { mailFromAddr } from "./guard.ts";
import { randomInt } from "node:crypto";

export const PIN_MS = 15 * 60 * 1000;

export function newPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendPinMail(opts: { to: string; pin: string; tenantName: string; when: string }) {
  const from = mailFromAddr(process.env.MAIL_FROM);
  if (!from) throw new Error("MAIL_FROM muss eine eigene Domain sein (nicht resend.dev).");
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Mail ist nicht konfiguriert.");
  const when = escHtml(opts.when);
  const pin = escHtml(opts.pin);
  const name = escHtml(opts.tenantName);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: `Dein Code für ${opts.tenantName}`,
      text: `Dein Bestätigungscode: ${opts.pin}\nTermin: ${opts.when}\nGültig 15 Minuten.`,
      html: `<p>Dein Bestätigungscode für ${name}: <strong>${pin}</strong></p><p>Termin: ${when}</p><p>Gültig 15 Minuten.</p>`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("resend failed", res.status, body);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}
