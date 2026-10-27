// Seven.io SMS. POST /api/sms, key in X-Api-Key. https://docs.seven.io/de/rest-api/endpunkte/sms

const SMS_MS = 8000;

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

export function confirmSms(opts: {
  tenantName: string;
  serviceName: string;
  staffName: string;
  when: string;
  cancelUrl?: string;
  also?: { serviceName: string; staffName: string; when: string; cancelUrl?: string }[];
}) {
  const bit = (s: { serviceName: string; staffName: string; when: string; cancelUrl?: string }) => {
    const what = s.staffName ? `${s.serviceName} bei ${s.staffName}` : s.serviceName;
    return `${what}, ${s.when}${s.cancelUrl ? `. ${s.cancelUrl}` : ""}`;
  };
  return `Termin bestätigt bei ${opts.tenantName}: ${[opts, ...(opts.also ?? [])].map(bit).join(" ")}`;
}

export async function sendConfirmSms(opts: { to: string; fromName: string; text: string }) {
  const key = process.env.SEVEN_API_KEY?.trim();
  const to = smsTo(opts.to);
  if (!key || !to || !opts.text.trim()) return;
  const body = new URLSearchParams({ to, text: opts.text });
  const from = smsFrom(opts.fromName);
  if (from) body.set("from", from);
  try {
    let code = await postSms(key, body);
    if (code === "201" && from) {
      body.delete("from");
      code = await postSms(key, body);
    }
    if (code !== "100") console.error("sms failed", code);
  } catch (e) {
    console.error("sms failed", e instanceof Error ? e.message : e);
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
