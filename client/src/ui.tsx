import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { api, type Booking, type Service, type ServiceCategory, type Staff, type StaffShift } from "./api";
import { gsap, reduced, useGSAP } from "./motion";

const AV = ["#1b5561", "#348a8a", "#8359dd", "#b45309", "#0f766e", "#be185d"];
const EVENT = [
  { bg: "#dcfce7", edge: "#16a34a", title: "#166534", sub: "#15803d" },
  { bg: "#ffedd5", edge: "#ea580c", title: "#c2410c", sub: "#9a3412" },
  { bg: "#f3e8ff", edge: "#9333ea", title: "#7e22ce", sub: "#6b21a8" },
  { bg: "#def7f5", edge: "#128a8a", title: "#0f766e", sub: "#0d9488" },
  { bg: "#e0f2fe", edge: "#0284c7", title: "#075985", sub: "#0369a1" },
];
const SVC = [
  { bg: "#def7f5", fg: "#128a8a", bd: "#b2eee9" },
  { bg: "#eef0f3", fg: "#4b5563", bd: "transparent" },
  { bg: "#f3e8ff", fg: "#7e22ce", bd: "#e9d5ff" },
  { bg: "#ffedd5", fg: "#c2410c", bd: "#fed7aa" },
];

function hash(s: string, n: number) {
  const t = s ?? "";
  let x = 0;
  for (let i = 0; i < t.length; i++) x += t.charCodeAt(i);
  return x % n;
}

export function initial(name: string) {
  return ((name ?? "").trim()[0] || "?").toUpperCase();
}

function imageOk(file: File) {
  const named = /\.(png|jpe?g|webp)$/i.test(file.name);
  return (/^image\/(png|jpeg|webp)$/.test(file.type) || (!file.type && named)) && file.size <= 5_000_000;
}

export function ImageDrop({ label, busy, onFile }: { label: string; busy?: boolean; onFile: (file: File) => void }) {
  const [over, setOver] = useState(false);
  const [note, setNote] = useState("");
  function take(file?: File) {
    if (!file || busy) return;
    if (!imageOk(file)) {
      setNote("PNG, JPG oder WebP, max. 5 MB.");
      return;
    }
    setNote("");
    onFile(file);
  }
  return (
    <label
      className={"drop" + (over ? " over" : "") + (busy ? " busy" : "")}
      onDragOver={(e) => { e.preventDefault(); if (!busy) setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={!!busy}
        onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }}
      />
      <span className="drop-btn">{busy ? "Wird hochgeladen…" : over ? "Loslassen" : label}</span>
      <span className="drop-sub">oder hierher ziehen · PNG, JPG, WebP, max. 5 MB</span>
      {note ? <span className="drop-note" role="alert">{note}</span> : null}
    </label>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: AV[hash(name, AV.length)] }}>
      {initial(name)}
    </span>
  );
}

export const STAFF_COLORS = ["#1b5561", "#348a8a", "#8359dd", "#b45309", "#0f766e", "#be185d"];

export function staffColor(s: { id: string; color?: string | null }) {
  return s.color && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color.toLowerCase() : STAFF_COLORS[hash(s.id, STAFF_COLORS.length)];
}

function lum(hex: string) {
  const n = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return 0.2126 * n(0) + 0.7152 * n(1) + 0.0722 * n(2);
}

export function staffTone(hex?: string | null) {
  const edge = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : "#64748b";
  return { bg: `${edge}22`, edge, title: lum(edge) > 0.62 ? "#0f172a" : edge, sub: "#475569" };
}

export function eventTone(id: string) {
  return EVENT[hash(id, EVENT.length)];
}

export function svcTone(id: string) {
  return SVC[hash(id, SVC.length)];
}

export function euro(cents?: number | null) {
  if (cents == null) return "";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function euroInput(cents?: number | null) {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function centsFromEuro(raw: string): number | null | false {
  const t = raw.trim().replace(/\s/g, "").replace("€", "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 99_999) return false;
  return Math.round(n * 100);
}

export function serviceLine(s: { name: string; durationMin: number; priceCents?: number | null }) {
  return s.priceCents != null ? `${s.name} · ${s.durationMin} Min. · ${euro(s.priceCents)}` : `${s.name} · ${s.durationMin} Min.`;
}

export function Modal({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP(() => {
    const back = root.current;
    const box = back?.querySelector(".modal");
    if (!back || !box || reduced()) return;
    gsap.fromTo(back, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out" });
    gsap.fromTo(box, { y: 18, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.34, ease: "back.out(0.7)", clearProps: "transform" });
  }, { scope: root });
  const close = contextSafe(() => {
    const back = root.current;
    const box = back?.querySelector(".modal");
    if (!back || !box || reduced()) {
      onClose();
      return;
    }
    gsap.timeline({ onComplete: onClose })
      .to(box, { y: 10, opacity: 0, scale: 0.98, duration: 0.18, ease: "power2.in" })
      .to(back, { opacity: 0, duration: 0.16, ease: "power2.in" }, "<");
  });
  return createPortal(
    <div className="modal-back" ref={root} onClick={close} role="presentation">
      <div className={"modal" + (wide ? " is-wide" : "")} role="dialog" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal-x" onClick={close} aria-label="Schließen">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function PageHead({ title, aside, lead }: { title: string; aside?: ReactNode; lead?: string }) {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      {aside}
    </header>
  );
}

type Off = { staffId: string; startsAt: string; endsAt: string };

export function staffBusy(
  staffId: string,
  start: Date,
  durationMin: number,
  ownBufferMin: number,
  bookings: Booking[],
  services: { id: string; bufferMin: number }[],
  timeOff: Off[],
  exceptId?: string,
) {
  if (Number.isNaN(start.getTime())) return false;
  const from = start.getTime();
  const until = from + (durationMin + ownBufferMin) * 60_000;
  for (const b of bookings) {
    if (b.staffId !== staffId || b.id === exceptId) continue;
    if (b.status !== "confirmed" && b.status !== "pending") continue;
    const buf = services.find((s) => s.id === b.serviceId)?.bufferMin ?? 0;
    const b0 = new Date(b.startsAt).getTime();
    const b1 = new Date(b.endsAt).getTime() + buf * 60_000;
    if (from < b1 && until > b0) return true;
  }
  for (const o of timeOff) {
    if (o.staffId !== staffId) continue;
    if (from < new Date(o.endsAt).getTime() && until > new Date(o.startsAt).getTime()) return true;
  }
  return false;
}

export function onShift(shifts: StaffShift[] | undefined, staffId: string, date: string, time: string, durationMin: number) {
  const own = (shifts ?? []).filter((h) => h.staffId === staffId);
  if (!own.length || !date || !time) return true;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return true;
  const js = new Date(y, m - 1, d).getDay();
  const weekday = js === 0 ? 7 : js;
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return true;
  const start = hh * 60 + mm;
  const end = start + durationMin;
  const mins = (hm: string) => {
    const [h, min] = hm.split(":").map(Number);
    return h * 60 + min;
  };
  return own.some((h) => h.weekday === weekday && mins(h.startHm) <= start && end <= mins(h.endHm));
}

export function firstOpen(
  staff: Staff[],
  services: Service[],
  date: string,
  time: string,
  bookings: Booking[],
  timeOff: Off[],
  shifts: StaffShift[] = [],
) {
  const start = new Date(`${date}T${time}`);
  const raw = services.filter((s) => s.active);
  const list = (raw.length ? raw : services)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.staffIds.length - a.s.staffIds.length || a.i - b.i)
    .map((x) => x.s);
  for (const svc of list) {
    const who = staff.find(
      (s) =>
        s.active &&
        svc.staffIds.includes(s.id) &&
        onShift(shifts, s.id, date, time, svc.durationMin) &&
        !staffBusy(s.id, start, svc.durationMin, svc.bufferMin, bookings, services, timeOff),
    );
    if (who) return { staffId: who.id, serviceId: svc.id };
  }
  return null;
}

export function coverService(services: Service[]) {
  const list = services.filter((s) => s.active);
  return [...(list.length ? list : services)].sort((a, b) => b.staffIds.length - a.staffIds.length)[0];
}

function clock(iso: string, tz: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const hh = (parts.find((p) => p.type === "hour")?.value ?? "00").padStart(2, "0");
  const mm = (parts.find((p) => p.type === "minute")?.value ?? "00").padStart(2, "0");
  return { date, time: `${hh}:${mm}` };
}

export function BookingModal({
  staff,
  services,
  categories = [],
  booking,
  timezone = "Europe/Berlin",
  initial,
  occupied,
  shifts = [],
  onClose,
  onSaved,
}: {
  staff: Staff[];
  services: Service[];
  categories?: ServiceCategory[];
  booking?: Booking;
  timezone?: string;
  initial?: { staffId?: string; serviceId?: string; date?: string; time?: string };
  occupied?: { bookings: Booking[]; timeOff: Off[] };
  shifts?: StaffShift[];
  onClose: () => void;
  onSaved: (startsAt?: string) => void;
}) {
  const start = booking ? clock(booking.startsAt, timezone) : null;
  const gone = booking?.status === "cancelled";
  const [form, setForm] = useState({
    date: start?.date ?? initial?.date ?? "",
    time: start?.time ?? initial?.time ?? "09:00",
    staffId: booking?.staffId ?? initial?.staffId ?? staff[0]?.id ?? "",
    serviceId: booking?.serviceId ?? initial?.serviceId ?? services[0]?.id ?? "",
    guestName: booking?.guestName ?? "",
    guestEmail: booking?.guestEmail ?? "",
    guestPhone: booking?.guestPhone ?? "",
    note: booking?.note ?? "",
  });
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  const svc = services.find((s) => s.id === form.serviceId);
  const linked = staff.filter((s) => s.active && svc?.staffIds.includes(s.id));
  const fits = (id: string, date = form.date, time = form.time, dur = svc?.durationMin ?? 0) => onShift(shifts, id, date, time, dur);
  const choices = staff.filter((s) => s.id === booking?.staffId || (linked.some((x) => x.id === s.id) && fits(s.id)));
  const startAt = new Date(`${form.date}T${form.time}`);
  const busyId = (id: string) =>
    Boolean(
      svc &&
        occupied &&
        staffBusy(id, startAt, svc.durationMin, svc.bufferMin, occupied.bookings, services, occupied.timeOff, booking?.id),
    );
  const mineBusy = busyId(form.staffId);
  const mineOff = Boolean(svc && !fits(form.staffId));
  const who = staff.find((s) => s.id === form.staffId);
  function pickWho(date: string, time: string, serviceId: string) {
    const next = services.find((s) => s.id === serviceId);
    if (!next) return form.staffId;
    const pool = staff.filter((s) => s.active && next.staffIds.includes(s.id));
    const ok = (s: Staff) =>
      onShift(shifts, s.id, date, time, next.durationMin) &&
      !staffBusy(s.id, new Date(`${date}T${time}`), next.durationMin, next.bufferMin, occupied?.bookings ?? [], services, occupied?.timeOff ?? [], booking?.id);
    return (pool.find((s) => s.id === form.staffId && ok(s)) ?? pool.find(ok) ?? pool[0])?.id ?? form.staffId;
  }
  const payload = () => ({
    staffId: form.staffId,
    serviceId: form.serviceId,
    startsAt: new Date(`${form.date}T${form.time}`).toISOString(),
    guestName: form.guestName,
    guestEmail: form.guestEmail,
    guestPhone: form.guestPhone,
    note: form.note,
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (gone) return;
    if (!booking && mineOff) {
      setErr(`${who?.name ?? "Mitarbeiter"} arbeitet zu der Zeit nicht.`);
      return;
    }
    setErr("");
    setPending(true);
    try {
      const saved = booking ? await api.patchBooking(booking.id, payload()) : await api.addBooking(payload());
      onSaved(saved.booking.startsAt);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Termin konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  async function drop() {
    if (!booking || gone) return;
    setErr("");
    setPending(true);
    try {
      await api.cancelBooking(booking.id);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Termin konnte nicht storniert werden.");
      setPending(false);
    }
  }

  return (
    <Modal title={booking ? "Termin" : "Neuer Termin"} onClose={onClose}>
      <form onSubmit={submit}>
        {err ? <p className="err">{err}</p> : null}
        {!err && mineOff && who ? <p className="err">{who.name} arbeitet zu der Zeit nicht.</p> : null}
        {!err && !mineOff && mineBusy && who ? <p className="err">{who.name} ist zu der Zeit nicht frei.</p> : null}
        {!choices.length ? <p className="err">{linked.length ? "Zu der Zeit arbeitet niemand." : "Kein Mitarbeiter für diese Leistung."}</p> : null}
        {gone ? <p className="err">Dieser Termin ist storniert.</p> : null}
        <fieldset disabled={gone || pending}>
          <div className="fields-2">
            <label className="field">
              <span>Datum</span>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, staffId: pickWho(e.target.value, form.time, form.serviceId) })} />
            </label>
            <label className="field">
              <span>Uhrzeit</span>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value, staffId: pickWho(form.date, e.target.value, form.serviceId) })} />
            </label>
          </div>
          <div className="fields-2">
            <label className="field">
              <span>Mitarbeiter</span>
              <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
                {choices.map((s) => (
                  <option key={s.id} value={s.id} disabled={busyId(s.id) || !fits(s.id)}>
                    {s.name}{!fits(s.id) ? " · arbeitet nicht" : busyId(s.id) ? " · belegt" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Leistung</span>
              <select
                value={form.serviceId}
                onChange={(e) => {
                  const serviceId = e.target.value;
                  setForm({ ...form, serviceId, staffId: pickWho(form.date, form.time, serviceId) });
                }}
                required
              >
                {categories.length ? (
                  <>
                    {categories.map((c) => {
                      const rows = services.filter((s) => s.categoryId === c.id);
                      if (!rows.length) return null;
                      return (
                        <optgroup key={c.id} label={c.name}>
                          {rows.map((s) => (
                            <option key={s.id} value={s.id}>{serviceLine(s)}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {services.some((s) => !s.categoryId) ? (
                      <optgroup label="Weitere">
                        {services.filter((s) => !s.categoryId).map((s) => (
                          <option key={s.id} value={s.id}>{serviceLine(s)}</option>
                        ))}
                      </optgroup>
                    ) : null}
                  </>
                ) : services.map((s) => (
                  <option key={s.id} value={s.id}>{serviceLine(s)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Gast</span>
            <input required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="Name" />
          </label>
          <div className="fields-2">
            <label className="field">
              <span>E-Mail</span>
              <input type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input type="tel" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span>Notizen</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optionale Notizen…" />
          </label>
        </fieldset>
        <div className="modal-foot">
          {booking && !gone ? (
            <button type="button" className="btn danger" disabled={pending} onClick={drop}>Stornieren</button>
          ) : (
            <button type="button" className="btn outline" onClick={onClose}>Schließen</button>
          )}
          {gone ? null : (
            <button className="btn" disabled={pending || mineBusy || !choices.length}>{pending ? "Speichern…" : booking ? "Speichern" : "Termin erstellen"}</button>
          )}
        </div>
      </form>
    </Modal>
  );
}
