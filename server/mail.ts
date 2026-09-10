import { randomInt } from "node:crypto";

export const PIN_MS = 15 * 60 * 1000;

export function newPin() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function sendPinMail(opts: { to: string; pin: string; tenantName: string; when: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Mail ist nicht konfiguriert.");
  const from = process.env.MAIL_FROM?.trim() || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: `Dein Code für ${opts.tenantName}`,
      html: `<p>Dein Bestätigungscode: <strong>${opts.pin}</strong></p><p>Termin: ${opts.when}</p><p>Gültig 15 Minuten.</p>`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("resend failed", res.status, body);
    throw new Error("Mailversand fehlgeschlagen.");
  }
}
