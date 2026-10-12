export function guestMail(raw: string) {
  const s = raw.trim().toLowerCase();
  if (!s || s.length > 254 || /[\s<>]/.test(s)) return false;
  const at = s.indexOf("@");
  if (at < 1 || s.indexOf("@", at + 1) !== -1) return false;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  const tld = labels.at(-1) ?? "";
  if (tld.length < 2 || !/^[a-z]+$/.test(tld)) return false;
  return labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l));
}

export function phoneKey(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  else if (d.startsWith("49")) d = d.slice(2);
  return d;
}

export function blockedGuest(rows: { guestEmail: string; guestPhone: string }[], email: string, phone: string) {
  const mail = email.trim().toLowerCase();
  const tel = phoneKey(phone);
  const mailOk = guestMail(mail);
  const telOk = tel.length >= 8;
  if (!mailOk && !telOk) return false;
  return rows.some((r) => (mailOk && r.guestEmail.trim().toLowerCase() === mail) || (telOk && phoneKey(r.guestPhone) === tel));
}

export function guestPhone(raw: string) {
  const s = raw.trim();
  if (!s) return true;
  if (!/^\+?[0-9][0-9\s/().-]*$/.test(s)) return false;
  const n = s.replace(/\D/g, "").length;
  return n >= 8 && n <= 15;
}
