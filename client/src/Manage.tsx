import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, useApi, type Bootstrap, type Booking, type TimeOff } from "./api";
import { Avatar, BookingModal, centsFromEuro, euro, euroInput, Modal, PageHead, svcTone } from "./ui";

function useBoot() {
  return useApi<Bootstrap>("/api/app/bootstrap");
}

const DAYS = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const REASONS = ["Urlaub", "Krankheit", "Fortbildung", "Privat"];

function when(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(d);
  return { day, time };
}

function span(a: string, b: string) {
  return `${new Date(a).toLocaleString("de-DE")} – ${new Date(b).toLocaleString("de-DE")}`;
}

function nextOff(staffId: string, rows: TimeOff[]) {
  const now = Date.now();
  return rows
    .filter((o) => o.staffId === staffId && new Date(o.endsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

function dm(iso: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));
}

export function BookingsPage() {
  const boot = useBoot();
  const list = useApi<{ bookings: Booking[] }>("/api/app/bookings");
  const rows = list?.bookings ?? [];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<Booking | null>(null);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((b) => `${b.guestName} ${b.guestEmail} ${b.guestPhone}`.toLowerCase().includes(s));
  }, [rows, q]);
  if (!boot) return <div className="page" />;
  return (
    <div className="page">
      <header className="page-head">
        <div className="head-tools">
          <h1>Termine</h1>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name oder E-Mail suchen" />
          </label>
        </div>
        <button className="btn" type="button" onClick={() => setOpen(true)}>+ Neuer Termin</button>
      </header>
      <div className="card-table">
        <table className="table quiet click">
          <thead>
            <tr>
              <th>Wann</th>
              <th>Gast</th>
              <th>Leistung</th>
              <th>Wer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((b) => {
              const w = when(b.startsAt);
              const svc = boot.services.find((s) => s.id === b.serviceId);
              const who = boot.staff.find((s) => s.id === b.staffId);
              const chip = svcTone(b.serviceId);
              const ok = b.status === "confirmed";
              const gone = b.status === "cancelled";
              return (
                <tr key={b.id} onClick={() => setPick(b)}>
                  <td>
                    <div className="when-day">{w.day}</div>
                    <div className="when-time">{w.time}</div>
                  </td>
                  <td>
                    <div className="who-cell">
                      <Avatar name={b.guestName} size={32} />
                      <div>
                        <strong>{b.guestName}</strong>
                        {b.guestEmail ? <small>{b.guestEmail}</small> : null}
                        {b.guestPhone ? <small>{b.guestPhone}</small> : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill" style={{ background: chip.bg, color: chip.fg, borderColor: chip.bd }}>{svc?.name ?? "—"}</span>
                  </td>
                  <td>
                    {who ? (
                      <div className="who-cell tight">
                        <Avatar name={who.name} size={24} />
                        <span>{who.name}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td>
                    <span className={"status" + (ok ? " is-ok" : gone ? " is-off" : "")}>
                      <i />
                      {ok ? "Bestätigt" : gone ? "Storniert" : "PIN offen"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pick ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          booking={pick}
          timezone={boot.tenant.timezone}
          onClose={() => setPick(null)}
          onSaved={() => setPick(null)}
        />
      ) : open ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          timezone={boot.tenant.timezone}
          initial={{ date: new Date().toISOString().slice(0, 10), time: "09:00", staffId: boot.staff[0]?.id, serviceId: boot.services[0]?.id }}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function StaffPage() {
  const boot = useBoot();
  const off = useApi<{ timeOff: TimeOff[] }>("/api/app/time-off");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<{ id: string; name: string; active: boolean } | null>(null);
  if (!boot) return <div className="page" />;
  return (
    <div className="page">
      <PageHead
        title="Mitarbeiter"
        aside={<button className="btn" type="button" onClick={() => setOpen(true)}>+ Mitarbeiter</button>}
      />
      <div className="staff-grid">
        {boot.staff.map((s) => {
          const abs = nextOff(s.id, off?.timeOff ?? []);
          const sick = /krank/i.test(abs?.reason ?? "");
          return (
            <article className="staff-card" key={s.id}>
              <button className="gear" type="button" aria-label="Einstellungen" onClick={() => setEdit({ id: s.id, name: s.name, active: s.active })}>
                ⚙
              </button>
              <Avatar name={s.name} size={96} />
              <h2>{s.name}</h2>
              <span className={"tag" + (s.active ? "" : " mute")}>{s.active ? "Aktiv" : "Inaktiv"}</span>
              <div className={"abs" + (sick ? " sick" : "")}>
                {abs ? (
                  <>
                    <small>{abs.reason || "Abwesenheit"}</small>
                    <strong>{dm(abs.startsAt)} – {dm(abs.endsAt)}</strong>
                  </>
                ) : (
                  <span>Keine Abwesenheit</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {open ? (
        <Modal title="Neuer Mitarbeiter" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              api.addStaff(name).then(() => { setName(""); setOpen(false); });
            }}
          >
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jonas S." />
            </label>
            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setOpen(false)}>Abbrechen</button>
              <button className="btn" type="submit">Mitarbeiter hinzufügen</button>
            </div>
          </form>
        </Modal>
      ) : null}
      {edit ? (
        <Modal title="Mitarbeiter-Einstellungen" onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              api.patchStaff(edit.id, { name: edit.name, active: edit.active }).then(() => setEdit(null));
            }}
          >
            <label className="field">
              <span>Name</span>
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
            </label>
            <label className="check">
              <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
              Aktiv
            </label>
            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="btn" type="submit">Speichern</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export function ServicesPage() {
  const boot = useBoot();
  const blank = { name: "", durationMin: 45, bufferMin: 0, staffIds: [] as string[], active: true, categoryId: "", price: "" };
  const [form, setForm] = useState<(typeof blank & { id?: string }) | null>(null);
  const [catForm, setCatForm] = useState<{ id?: string; name: string } | null>(null);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  if (!boot) return <div className="page"><p className="lead">Laden…</p></div>;
  const cats = boot.categories ?? [];
  function toggle(id: string) {
    setForm((f) => f && ({ ...f, staffIds: f.staffIds.includes(id) ? f.staffIds.filter((x) => x !== id) : [...f.staffIds, id] }));
  }
  function catName(id: string | null | undefined) {
    return cats.find((c) => c.id === id)?.name ?? "—";
  }
  return (
    <div className="page">
      <PageHead
        title="Leistungen"
        aside={
          <div className="head-tools">
            <button className="btn outline" type="button" onClick={() => { setErr(""); setCatForm({ name: "" }); }}>+ Kategorie</button>
            <button className="btn" type="button" onClick={() => { setErr(""); setForm({ ...blank }); }}>+ Leistung</button>
          </div>
        }
      />
      <article className="hours-card cat-block">
        <div className="card-head">Kategorien</div>
        <div className="card-body">
          {cats.length ? (
            <ul className="cat-list">
              {cats.map((c) => (
                <li key={c.id}>
                  <button className="cat-chip" type="button" onClick={() => { setErr(""); setCatForm({ id: c.id, name: c.name }); }}>{c.name}</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint-line">Noch keine Kategorie. z. B. Frauenhaarschnitt oder Männerhaarschnitt — dann an die Leistung hängen.</p>
          )}
        </div>
      </article>
      <div className="card-table">
        <table className="table quiet click">
          <thead>
            <tr>
              <th>Leistung</th>
              <th>Kategorie</th>
              <th>Dauer</th>
              <th>Preis</th>
              <th>Puffer</th>
              <th>Wer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {boot.services.map((s) => (
              <tr
                key={s.id}
                onClick={() => {
                  setErr("");
                  setForm({ id: s.id, name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, staffIds: [...s.staffIds], active: s.active, categoryId: s.categoryId ?? "", price: euroInput(s.priceCents) });
                }}
              >
                <td>{s.name}</td>
                <td>{catName(s.categoryId)}</td>
                <td>{s.durationMin} min</td>
                <td>{s.priceCents != null ? euro(s.priceCents) : "—"}</td>
                <td>{s.bufferMin} min</td>
                <td>{s.staffIds.map((id) => boot.staff.find((x) => x.id === id)?.name).filter(Boolean).join(", ") || "—"}</td>
                <td>
                  <span className={"status" + (s.active ? " is-ok" : " is-off")}>
                    <i />
                    {s.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {catForm ? (
        <Modal title={catForm.id ? "Kategorie" : "Neue Kategorie"} onClose={() => setCatForm(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              setPending(true);
              const done = catForm.id ? api.patchCategory(catForm.id, { name: catForm.name }) : api.addCategory(catForm.name);
              done
                .then(() => setCatForm(null))
                .catch((ex) => setErr(ex instanceof Error ? ex.message : "Speichern fehlgeschlagen."))
                .finally(() => setPending(false));
            }}
          >
            {err ? <p className="err" role="alert">{err}</p> : null}
            <label className="field">
              <span>Name</span>
              <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required placeholder="z. B. Frauenhaarschnitt" />
            </label>
            <div className="modal-foot">
              {catForm.id ? (
                <button
                  type="button"
                  className="btn danger"
                  disabled={pending}
                  onClick={() => {
                    setPending(true);
                    api.delCategory(catForm.id as string)
                      .then(() => setCatForm(null))
                      .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                      .finally(() => setPending(false));
                  }}
                >
                  Löschen
                </button>
              ) : (
                <button type="button" className="btn outline" onClick={() => setCatForm(null)}>Abbrechen</button>
              )}
              <button className="btn" type="submit" disabled={pending}>{pending ? "Speichern…" : "Speichern"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
      {form ? (
        <Modal title={form.id ? "Leistung" : "Neue Leistung"} onClose={() => setForm(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              const priceCents = centsFromEuro(form.price);
              if (priceCents === false) {
                setErr("Preis ungültig.");
                return;
              }
              setPending(true);
              const body = { name: form.name, durationMin: form.durationMin, bufferMin: form.bufferMin, staffIds: form.staffIds, active: form.active, categoryId: form.categoryId || null, priceCents };
              const done = form.id ? api.patchService(form.id, body) : api.addService(body);
              done
                .then(() => setForm(null))
                .catch((ex) => setErr(ex instanceof Error ? ex.message : "Speichern fehlgeschlagen."))
                .finally(() => setPending(false));
            }}
          >
            {err ? <p className="err" role="alert">{err}</p> : null}
            <label className="field">
              <span>Name der Leistung</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="z.B. Bartpflege / Herrenhaarschnitt" />
            </label>
            <label className="field">
              <span>Kategorie</span>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Keine</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <p className="hint-line">Kategorie oben anlegen, dann hier zuordnen. Im Buchungs-iframe erscheint sie als Dropdown.</p>
            <div className="fields-2">
              <label className="field">
                <span>Dauer</span>
                <input type="number" min={5} max={480} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
              </label>
              <label className="field">
                <span>Pufferzeit</span>
                <input type="number" min={0} max={120} value={form.bufferMin} onChange={(e) => setForm({ ...form, bufferMin: Number(e.target.value) })} />
              </label>
            </div>
            <label className="field">
              <span>Preis (optional)</span>
              <input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="z. B. 29,50" />
            </label>
            <p className="hint-line">Leer lassen, wenn kein Preis auf der Buchungsseite stehen soll. Euro, mit Komma oder Punkt.</p>
            <div className="field">
              <span>Zuständige Mitarbeiter</span>
              {boot.staff.map((s) => (
                <label className="check" key={s.id}>
                  <input type="checkbox" checked={form.staffIds.includes(s.id)} onChange={() => toggle(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
            {form.id ? (
              <label className="check">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Aktiv
              </label>
            ) : null}
            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setForm(null)}>Abbrechen</button>
              <button className="btn" type="submit" disabled={pending}>{pending ? "Speichern…" : form.id ? "Speichern" : "Leistung erstellen"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export function HoursPage() {
  const boot = useBoot();
  const [rows, setRows] = useState<{ weekday: number; startHm: string; endHm: string; open: boolean }[]>([]);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!boot || rows.length) return;
    setRows([1, 2, 3, 4, 5, 6, 7].map((weekday) => {
      const h = boot.hours.find((x) => x.weekday === weekday);
      return { weekday, startHm: h?.startHm ?? "09:00", endHm: h?.endHm ?? (weekday === 6 ? "14:00" : "18:00"), open: Boolean(h) };
    }));
  }, [boot, rows.length]);
  if (!boot) return <div className="page" />;
  return (
    <div className="page slim">
      <PageHead title="Unternehmen" lead="Logo auf der Buchungsseite. Geschlossene Tage erzeugen keine Slots." />
      {err ? <p className="err" role="alert">{err}</p> : null}
      <article className="hours-card">
        <div className="card-head">Logo</div>
        <div className="card-body">
          {boot.tenant.logoUrl ? <img className="logo-preview" src={boot.tenant.logoUrl} alt="" /> : <p className="hint-line">Noch kein Logo. Erscheint oben im Buchungs-iframe.</p>}
          <label className="field">
            <span>{boot.tenant.logoUrl ? "Ersetzen" : "Hochladen"} (PNG, JPG oder WebP, max. 5 MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={pending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setErr("");
                setPending(true);
                const body = new FormData();
                body.append("file", file);
                api.putLogo(body)
                  .catch((ex) => setErr(ex instanceof Error ? ex.message : "Upload fehlgeschlagen."))
                  .finally(() => setPending(false));
              }}
            />
          </label>
          {boot.tenant.logoUrl ? (
            <button
              className="linkish"
              type="button"
              disabled={pending}
              onClick={() => {
                setErr("");
                setPending(true);
                api.delLogo()
                  .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                  .finally(() => setPending(false));
              }}
            >
              Logo löschen
            </button>
          ) : null}
        </div>
      </article>
      <div className="hours-card">
        <div className="card-head">Öffnungszeiten</div>
        {rows.map((r, i) => (
          <div className="hours-row" key={r.weekday}>
            <label className="check">
              <input type="checkbox" checked={r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, open: e.target.checked } : x))} />
              {DAYS[r.weekday]}
            </label>
            <input type="time" value={r.startHm} disabled={!r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, startHm: e.target.value } : x))} />
            <input type="time" value={r.endHm} disabled={!r.open} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, endHm: e.target.value } : x))} />
          </div>
        ))}
        <div className="hours-foot">
          <button className="btn" type="button" onClick={() => api.putHours(rows.filter((r) => r.open).map(({ weekday, startHm, endHm }) => ({ weekday, startHm, endHm })))}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export function TimeOffPage() {
  const boot = useBoot();
  const off = useApi<{ timeOff: TimeOff[] }>("/api/app/time-off");
  const rows = off?.timeOff ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staffId: "", startsAt: "", endsAt: "", reason: "Urlaub" });
  if (!boot) return <div className="page" />;
  function submit(e: FormEvent) {
    e.preventDefault();
    api.addTimeOff({
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    }).then(() => { setOpen(false); setForm({ staffId: "", startsAt: "", endsAt: "", reason: "Urlaub" }); });
  }
  return (
    <div className="page">
      <PageHead
        title="Sperren"
        aside={<button className="btn" type="button" onClick={() => setOpen(true)}>+ Sperre</button>}
      />
      <div className="card-table">
        <table className="table quiet">
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>Zeitraum</th>
              <th>Grund</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{boot.staff.find((s) => s.id === r.staffId)?.name}</td>
                <td>{span(r.startsAt, r.endsAt)}</td>
                <td>{r.reason}</td>
                <td><button className="linkish" type="button" onClick={() => api.delTimeOff(r.id)}>Löschen</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <Modal title="Neue Sperre" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <label className="field">
              <span>Mitarbeiter</span>
              <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required>
                <option value="">Bitte wählen</option>
                {boot.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <div className="fields-2">
              <label className="field">
                <span>Von</span>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
              </label>
              <label className="field">
                <span>Bis</span>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
              </label>
            </div>
            <label className="field">
              <span>Grund</span>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setOpen(false)}>Abbrechen</button>
              <button className="btn" type="submit">Sperre erstellen</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
