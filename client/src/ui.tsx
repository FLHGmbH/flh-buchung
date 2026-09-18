import { useState, type FormEvent, type ReactNode } from "react";
import { api, type Service, type Staff } from "./api";

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
  let x = 0;
  for (let i = 0; i < s.length; i++) x += s.charCodeAt(i);
  return x % n;
}

export function initial(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: AV[hash(name, AV.length)] }}>
      {initial(name)}
    </span>
  );
}

export function eventTone(id: string) {
  return EVENT[hash(id, EVENT.length)];
}

export function svcTone(id: string) {
  return SVC[hash(id, SVC.length)];
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHead({ title, aside, lead }: { title: string; aside?: ReactNode; lead?: string }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      {aside}
    </header>
  );
}

export function BookingModal({
  staff,
  services,
  initial,
  onClose,
  onSaved,
}: {
  staff: Staff[];
  services: Service[];
  initial?: { staffId?: string; serviceId?: string; date?: string; time?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    date: initial?.date ?? "",
    time: initial?.time ?? "09:00",
    staffId: initial?.staffId ?? staff[0]?.id ?? "",
    serviceId: initial?.serviceId ?? services[0]?.id ?? "",
    guestName: "",
    note: "",
  });
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    try {
      await api.addBooking({
        staffId: form.staffId,
        serviceId: form.serviceId,
        startsAt: new Date(`${form.date}T${form.time}`).toISOString(),
        guestName: form.guestName,
        note: form.note,
      });
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Termin konnte nicht angelegt werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="Neuer Termin" onClose={onClose}>
      <form onSubmit={submit}>
        {err ? <p className="err">{err}</p> : null}
        <label className="field">
          <span>Datum</span>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="field">
          <span>Uhrzeit</span>
          <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </label>
        <label className="field">
          <span>Mitarbeiter</span>
          <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Leistung</span>
          <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} required>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Gast</span>
          <input required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="Name" />
        </label>
        <label className="field">
          <span>Notizen</span>
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optionale Notizen…" />
        </label>
        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={onClose}>Abbrechen</button>
          <button className="btn" disabled={pending}>{pending ? "Speichern…" : "Termin erstellen"}</button>
        </div>
      </form>
    </Modal>
  );
}
