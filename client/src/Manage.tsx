import { useEffect, useState, type FormEvent } from "react";
import { api, type Bootstrap, type Booking, type TimeOff } from "./api";

export function StaffPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [name, setName] = useState("");
  useEffect(() => { api.bootstrap().then(setBoot); }, []);
  if (!boot) return <div className="page">Laden…</div>;
  return (
    <div className="page">
      <h1>Mitarbeiter</h1>
      <p className="lead">Ressourcen für den Kalender, ohne eigenen Login.</p>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          api.addStaff(name).then(() => { setName(""); api.bootstrap().then(setBoot); });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <button className="btn" type="submit">Anlegen</button>
      </form>
      <table className="table">
        <thead><tr><th>Name</th><th>Status</th></tr></thead>
        <tbody>
          {boot.staff.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <button className="btn quiet" type="button" onClick={() => api.patchStaff(s.id, { active: !s.active }).then(() => api.bootstrap().then(setBoot))}>
                  {s.active ? "Aktiv" : "Inaktiv"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ServicesPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [form, setForm] = useState({ name: "", durationMin: 45, bufferMin: 0, staffIds: [] as string[] });
  useEffect(() => { api.bootstrap().then(setBoot); }, []);
  if (!boot) return <div className="page">Laden…</div>;
  function toggle(id: string) {
    setForm((f) => ({ ...f, staffIds: f.staffIds.includes(id) ? f.staffIds.filter((x) => x !== id) : [...f.staffIds, id] }));
  }
  return (
    <div className="page">
      <h1>Leistungen</h1>
      <p className="lead">Dauer bestimmt das Slot-Raster. Puffer sperrt die Zeit danach.</p>
      <form
        className="panel"
        style={{ marginBottom: 24, maxWidth: 480 }}
        onSubmit={(e) => {
          e.preventDefault();
          api.addService(form).then(() => { setForm({ name: "", durationMin: 45, bufferMin: 0, staffIds: [] }); api.bootstrap().then(setBoot); });
        }}
      >
        <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="field"><span>Dauer (Minuten)</span><input type="number" min={5} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></label>
        <label className="field"><span>Puffer danach (Minuten)</span><input type="number" min={0} value={form.bufferMin} onChange={(e) => setForm({ ...form, bufferMin: Number(e.target.value) })} /></label>
        <div className="field">
          <span>Mitarbeiter</span>
          {boot.staff.map((s) => (
            <label className="check" key={s.id}>
              <input type="checkbox" checked={form.staffIds.includes(s.id)} onChange={() => toggle(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
        <button className="btn" type="submit">Anlegen</button>
      </form>
      <table className="table">
        <thead><tr><th>Leistung</th><th>Dauer</th><th>Puffer</th><th>Wer</th></tr></thead>
        <tbody>
          {boot.services.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.durationMin} min</td>
              <td>{s.bufferMin} min</td>
              <td>{s.staffIds.map((id) => boot.staff.find((x) => x.id === id)?.name).filter(Boolean).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DAYS = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export function HoursPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [rows, setRows] = useState<{ weekday: number; startHm: string; endHm: string; open: boolean }[]>([]);
  useEffect(() => {
    api.bootstrap().then((b) => {
      setBoot(b);
      setRows([1, 2, 3, 4, 5, 6, 7].map((weekday) => {
        const h = b.hours.find((x) => x.weekday === weekday);
        return { weekday, startHm: h?.startHm ?? "09:00", endHm: h?.endHm ?? "18:00", open: Boolean(h) };
      }));
    });
  }, []);
  if (!boot) return <div className="page">Laden…</div>;
  return (
    <div className="page">
      <h1>Öffnungszeiten</h1>
      <p className="lead">Geschlossene Tage erzeugen keine Slots.</p>
      {rows.map((r, i) => (
        <div className="toolbar" key={r.weekday}>
          <label className="check" style={{ minWidth: 140 }}>
            <input type="checkbox" checked={r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, open: e.target.checked } : x))} />
            {DAYS[r.weekday]}
          </label>
          <input type="time" value={r.startHm} disabled={!r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, startHm: e.target.value } : x))} />
          <input type="time" value={r.endHm} disabled={!r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, endHm: e.target.value } : x))} />
        </div>
      ))}
      <button className="btn" type="button" onClick={() => api.putHours(rows.filter((r) => r.open).map(({ weekday, startHm, endHm }) => ({ weekday, startHm, endHm })))}>Speichern</button>
    </div>
  );
}

export function TimeOffPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [rows, setRows] = useState<TimeOff[]>([]);
  const [form, setForm] = useState({ staffId: "", startsAt: "", endsAt: "", reason: "Urlaub" });
  function reload() {
    api.bootstrap().then(setBoot);
    api.timeOff().then((r) => setRows(r.timeOff));
  }
  useEffect(() => { reload(); }, []);
  if (!boot) return <div className="page">Laden…</div>;
  function submit(e: FormEvent) {
    e.preventDefault();
    api.addTimeOff({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    }).then(reload);
  }
  return (
    <div className="page">
      <h1>Sperren</h1>
      <p className="lead">Urlaub, Krankheit, individuelle Blöcke. Diese Zeiten sind nicht buchbar.</p>
      <form className="panel" style={{ maxWidth: 480, marginBottom: 24 }} onSubmit={submit}>
        <label className="field">
          <span>Mitarbeiter</span>
          <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
            <option value="">Bitte wählen</option>
            {boot.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="field"><span>Von</span><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></label>
        <label className="field"><span>Bis</span><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required /></label>
        <label className="field"><span>Grund</span><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
        <button className="btn" type="submit">Sperre anlegen</button>
      </form>
      <table className="table">
        <thead><tr><th>Mitarbeiter</th><th>Zeitraum</th><th>Grund</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{boot.staff.find((s) => s.id === r.staffId)?.name}</td>
              <td>{new Date(r.startsAt).toLocaleString("de-DE")} – {new Date(r.endsAt).toLocaleString("de-DE")}</td>
              <td>{r.reason}</td>
              <td><button className="btn quiet" type="button" onClick={() => api.delTimeOff(r.id).then(reload)}>Löschen</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BookingsPage() {
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  function reload() {
    api.bootstrap().then(setBoot);
    api.bookings().then((r) => setRows(r.bookings));
  }
  useEffect(() => { reload(); }, []);
  if (!boot) return <div className="page">Laden…</div>;
  return (
    <div className="page">
      <h1>Termine</h1>
      <table className="table">
        <thead><tr><th>Wann</th><th>Gast</th><th>Leistung</th><th>Wer</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>{new Date(b.startsAt).toLocaleString("de-DE")}</td>
              <td>{b.guestName}<br />{b.guestEmail} {b.guestPhone}</td>
              <td>{boot.services.find((s) => s.id === b.serviceId)?.name}</td>
              <td>{boot.staff.find((s) => s.id === b.staffId)?.name}</td>
              <td>{b.status === "confirmed" ? "Bestätigt" : b.status === "pending" ? "PIN offen" : "Storniert"}</td>
              <td>
                {b.status !== "cancelled" ? (
                  <button className="btn quiet" type="button" onClick={() => api.cancelBooking(b.id).then(reload)}>Stornieren</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
