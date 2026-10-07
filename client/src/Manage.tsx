import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, useApi, type Bootstrap, type Booking, type StaffShift, type TimeOff } from "./api";
import { Avatar, BookingModal, centsFromEuro, euro, euroInput, firstOpen, ImageDrop, Modal, PageHead, STAFF_COLORS, staffColor, svcTone } from "./ui";

function useBoot() {
  return useApi<Bootstrap>("/api/app/bootstrap");
}

function ColorPick({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <label className="field">
      <span>Farbe</span>
      <div className="swatches">
        {STAFF_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={value === c ? "on" : ""}
            style={{ background: c }}
            aria-label={`Farbe ${c}`}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
          />
        ))}
        <input type="color" value={value} aria-label="Eigene Farbe" onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

const DAYS = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const WD = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function shiftLine(rows: { weekday: number; startHm: string; endHm: string }[]) {
  if (!rows.length) return "Wie der Betrieb";
  return [...rows].sort((a, b) => a.weekday - b.weekday).map((r) => `${WD[r.weekday]} ${r.startHm}–${r.endHm}`).join(" · ");
}

const TRACK_FROM = 0;
const TRACK_TO = 24 * 60;

function hmMins(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normHm(raw: string) {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function shiftBlock(startHm: string, endHm: string) {
  const a = hmMins(startHm);
  const b = hmMins(endHm);
  if (b <= a) return null;
  const span = TRACK_TO - TRACK_FROM;
  const top = Math.max(0, Math.min(span, a - TRACK_FROM));
  const bot = Math.max(0, Math.min(span, b - TRACK_FROM));
  if (bot <= top) return null;
  return { top: `${(top / span) * 100}%`, height: `${((bot - top) / span) * 100}%` };
}

function hm(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function otherBlocks(
  staffId: string,
  staff: { id: string; active: boolean }[],
  shop: { weekday: number; startHm: string; endHm: string }[],
  shifts: StaffShift[],
) {
  const out: Record<number, { top: string; height: string }[]> = {};
  for (const weekday of [1, 2, 3, 4, 5, 6, 7]) {
    const windows: { start: number; end: number }[] = [];
    for (const s of staff) {
      if (s.id === staffId || !s.active) continue;
      const own = shifts.filter((h) => h.staffId === s.id);
      const rows = own.length ? own.filter((h) => h.weekday === weekday) : shop.filter((h) => h.weekday === weekday);
      for (const r of rows) {
        const start = hmMins(r.startHm);
        const end = hmMins(r.endHm);
        if (end > start) windows.push({ start, end });
      }
    }
    windows.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const w of windows) {
      const last = merged.at(-1);
      if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
      else merged.push({ ...w });
    }
    out[weekday] = merged.flatMap((w) => {
      const block = shiftBlock(hm(w.start), hm(w.end));
      return block ? [block] : [];
    });
  }
  return out;
}

function shiftRows(saved: StaffShift[], shop: { weekday: number; startHm: string; endHm: string }[]) {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
    const h = saved.find((x) => x.weekday === weekday);
    const shopDay = shop.find((x) => x.weekday === weekday);
    return { weekday, open: Boolean(h), startHm: h?.startHm ?? shopDay?.startHm ?? "09:00", endHm: h?.endHm ?? shopDay?.endHm ?? "18:00" };
  });
}
const REASONS = ["Urlaub", "Krankheit", "Fortbildung", "Privat"];

function when(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(d);
  return { day, time };
}

function offLast(iso: string) {
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) d.setDate(d.getDate() - 1);
  return d;
}

function offLabel(a: string, b: string) {
  const fmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${fmt.format(new Date(a))} – ${fmt.format(offLast(b))}`;
}

function nextOff(staffId: string, rows: TimeOff[]) {
  const now = Date.now();
  return rows
    .filter((o) => o.staffId === staffId && new Date(o.endsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

export function BookingsPage() {
  const boot = useBoot();
  const list = useApi<{ bookings: Booking[] }>("/api/app/bookings");
  const off = useApi<{ timeOff: TimeOff[] }>("/api/app/time-off");
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
          occupied={{ bookings: rows, timeOff: off?.timeOff ?? [] }}
          shifts={boot.staffHours ?? []}
          onClose={() => setPick(null)}
          onSaved={() => setPick(null)}
        />
      ) : open ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          timezone={boot.tenant.timezone}
          occupied={{ bookings: rows, timeOff: off?.timeOff ?? [] }}
          shifts={boot.staffHours ?? []}
          initial={(() => {
            const date = new Date().toISOString().slice(0, 10);
            const time = "09:00";
            const hit = firstOpen(boot.staff, boot.services, date, time, rows, off?.timeOff ?? [], boot.staffHours ?? []);
            return hit ? { date, time, ...hit } : { date, time, staffId: boot.staff[0]?.id, serviceId: boot.services[0]?.id };
          })()}
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
  const list = useApi<{ bookings: Booking[] }>("/api/app/bookings");
  const [name, setName] = useState("");
  const [color, setColor] = useState(STAFF_COLORS[0]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [pick, setPick] = useState<Booking | null>(null);
  const [edit, setEdit] = useState<{ id: string; name: string; active: boolean; photoUrl?: string | null; color: string; custom: boolean; rows: { weekday: number; open: boolean; startHm: string; endHm: string }[] } | null>(null);
  const [hmDay, setHmDay] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  const who = boot?.staff.find((s) => s.id === sel) ?? null;
  const upcoming = useMemo(() => {
    if (!who || !list) return [];
    const now = Date.now();
    return list.bookings
      .filter((b) => b.staffId === who.id && b.status !== "cancelled" && new Date(b.endsAt).getTime() > now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [who, list]);
  if (!boot) return <div className="page" />;
  const cover = edit ? otherBlocks(edit.id, boot.staff, boot.hours, boot.staffHours ?? []) : null;
  return (
    <div className="page">
      <PageHead
        title="Mitarbeiter"
        aside={<button className="btn" type="button" onClick={() => { setColor(STAFF_COLORS[boot.staff.length % STAFF_COLORS.length]); setOpen(true); }}>+ Mitarbeiter</button>}
      />
      <div className="staff-grid">
        {boot.staff.map((s) => {
          const abs = nextOff(s.id, off?.timeOff ?? []);
          const sick = /krank/i.test(abs?.reason ?? "");
          return (
            <article className={"staff-card" + (sel === s.id ? " on" : "")} key={s.id}>
              <button className="gear" type="button" aria-label="Einstellungen" onClick={() => { setErr(""); setHmDay(null); const saved = (boot.staffHours ?? []).filter((h) => h.staffId === s.id); setEdit({ id: s.id, name: s.name, active: s.active, photoUrl: s.photoUrl, color: staffColor(s), custom: saved.length > 0, rows: shiftRows(saved, boot.hours) }); }}>
                ⚙
              </button>
              <button
                type="button"
                className="staff-open"
                aria-pressed={sel === s.id}
                onClick={() => setSel(sel === s.id ? null : s.id)}
              >
                {s.photoUrl ? <img className="staff-photo" src={s.photoUrl} alt="" /> : <Avatar name={s.name} size={96} />}
                <strong className="staff-name"><i className="staff-dot" style={{ background: staffColor(s) }} />{s.name}</strong>
                <span className={"tag" + (s.active ? "" : " mute")}>{s.active ? "Aktiv" : "Inaktiv"}</span>
                <span className="shift-line">{shiftLine((boot.staffHours ?? []).filter((h) => h.staffId === s.id))}</span>
                <div className={"abs" + (sick ? " sick" : "")}>
                  {abs ? (
                    <>
                      <small>{abs.reason || "Abwesenheit"}</small>
                      <strong>{offLabel(abs.startsAt, abs.endsAt)}</strong>
                    </>
                  ) : (
                    <span>Keine Abwesenheit</span>
                  )}
                </div>
              </button>
            </article>
          );
        })}
      </div>
      {who ? (
        <section className="hours-card staff-appts">
          <div className="card-head">Termine von {who.name}</div>
          {!list ? (
            <p className="hint-line card-body">Laden…</p>
          ) : upcoming.length ? (
            <div className="card-table flat">
              <table className="table quiet click">
                <thead>
                  <tr>
                    <th>Wann</th>
                    <th>Gast</th>
                    <th>Leistung</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((b) => {
                    const w = when(b.startsAt);
                    const svc = boot.services.find((s) => s.id === b.serviceId);
                    const chip = svcTone(b.serviceId);
                    const live = new Date(b.startsAt).getTime() <= Date.now();
                    const ok = b.status === "confirmed";
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
                          <span className={"status" + (live ? " is-look" : ok ? " is-ok" : "")}>
                            <i />
                            {live ? "Jetzt" : ok ? "Bestätigt" : "PIN offen"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="hint-line card-body">Keine kommenden Termine.</p>
          )}
        </section>
      ) : null}
      {pick && who ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          booking={pick}
          timezone={boot.tenant.timezone}
          occupied={{ bookings: list?.bookings ?? [], timeOff: off?.timeOff ?? [] }}
          shifts={boot.staffHours ?? []}
          onClose={() => setPick(null)}
          onSaved={() => setPick(null)}
        />
      ) : null}
      {open ? (
        <Modal title="Neuer Mitarbeiter" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              api.addStaff(name, color).then(() => { setName(""); setOpen(false); });
            }}
          >
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Max Mustermann" />
            </label>
            <ColorPick value={color} onChange={setColor} />
            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setOpen(false)}>Abbrechen</button>
              <button className="btn" type="submit">Mitarbeiter hinzufügen</button>
            </div>
          </form>
        </Modal>
      ) : null}
      {edit ? (
        <Modal title="Mitarbeiter-Einstellungen" wide onClose={() => setEdit(null)}>
          <form
            className="staff-set"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              const hours = edit.custom ? edit.rows.filter((r) => r.open).map(({ weekday, startHm, endHm }) => ({ weekday, startHm, endHm })) : [];
              if (edit.custom && !hours.length) {
                setErr("Mindestens ein Tag, oder die eigenen Zeiten aus.");
                return;
              }
              setPending(true);
              Promise.all([
                api.patchStaff(edit.id, { name: edit.name, active: edit.active, color: edit.color }),
                api.putStaffHours(edit.id, hours),
              ]).then(() => setEdit(null)).catch((ex) => setErr(ex instanceof Error ? ex.message : "Speichern fehlgeschlagen.")).finally(() => setPending(false));
            }}
          >
            {err ? <p className="err" role="alert">{err}</p> : null}

            <div className="staff-head-bar">
              <div className="staff-avatar-box">
                {edit.photoUrl ? (
                  <img className="staff-photo" src={edit.photoUrl} alt="" />
                ) : (
                  <Avatar name={edit.name} size={76} />
                )}
                <label className="staff-photo-gear" title="Profilbild ändern" aria-label="Profilbild ändern">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || pending) return;
                      const named = /\.(png|jpe?g|webp)$/i.test(file.name);
                      if (!((/^image\/(png|jpeg|webp)$/.test(file.type) || (!file.type && named)) && file.size <= 5_000_000)) {
                        setErr("PNG, JPG oder WebP, max. 5 MB.");
                        return;
                      }
                      setErr("");
                      setPending(true);
                      const body = new FormData();
                      body.append("file", file);
                      api.putStaffPhoto(edit.id, body)
                        .then((r) => setEdit((cur) => cur ? { ...cur, photoUrl: r.photoUrl } : cur))
                        .catch((ex) => setErr(ex instanceof Error ? ex.message : "Upload fehlgeschlagen."))
                        .finally(() => setPending(false));
                      e.target.value = "";
                    }}
                  />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </label>
              </div>
              <div className="staff-head-fields">
                <label className="field" style={{ margin: 0 }}>
                  <span>Name</span>
                  <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required />
                </label>
                {edit.photoUrl ? (
                  <button
                    className="linkish staff-photo-del"
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setErr("");
                      setPending(true);
                      api.delStaffPhoto(edit.id)
                        .then(() => setEdit((cur) => cur ? { ...cur, photoUrl: null } : cur))
                        .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                        .finally(() => setPending(false));
                    }}
                  >
                    Profilbild entfernen
                  </button>
                ) : null}
              </div>
            </div>

            <details className="set-fold">
              <summary>Farbe & Status</summary>
              <div className="card-body">
                <ColorPick value={edit.color} onChange={(c) => setEdit({ ...edit, color: c })} />
                <label className="check">
                  <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
                  Aktiv (im Kalender und bei Online-Buchungen verfügbar)
                </label>
              </div>
            </details>

            <details className="set-fold" open>
              <summary>Arbeitszeiten</summary>
              <div className="card-body">
                <label className="check">
                  <input type="checkbox" checked={edit.custom} onChange={(e) => setEdit({ ...edit, custom: e.target.checked })} />
                  Eigene Arbeitszeiten. Ohne Haken gelten die Öffnungszeiten.
                </label>
                {edit.custom ? (
                  <>
                    <p className="shift-hint">Tag oben anhaken. Zeiten im Balken per Doppelklick ändern. Grau: andere sind da.</p>
                    <div className="shift-week" role="group" aria-label="Arbeitszeiten">
                      <div className="shift-scale" aria-hidden="true">
                        <ol>
                          {["0", "6", "12", "18", "24"].map((h) => <li key={h}>{h}</li>)}
                        </ol>
                      </div>
                      {edit.rows.map((r, i) => {
                        const pos = r.open ? shiftBlock(r.startHm, r.endHm) : null;
                        const set = (patch: { open?: boolean; startHm?: string; endHm?: string }) => setEdit({ ...edit, rows: edit.rows.map((x, j) => j === i ? { ...x, ...patch } : x) });
                        const label = `${r.startHm.slice(0, 5)}–${r.endHm.slice(0, 5)}`;
                        return (
                          <div className={"shift-day" + (r.open ? " on" : "")} key={r.weekday}>
                            <label className="shift-wd">
                              <input type="checkbox" checked={r.open} aria-label={`${DAYS[r.weekday]} aktiv`} onChange={(e) => set({ open: e.target.checked })} />
                              {WD[r.weekday]}
                            </label>
                            <div className="shift-track">
                              {(cover?.[r.weekday] ?? []).map((g, n) => (
                                <span className="shift-others" key={n} style={{ top: g.top, height: g.height }} title="Andere sind da" />
                              ))}
                              {pos ? (
                                <i style={{ top: pos.top, height: pos.height, background: edit.color }} title="Doppelklick zum Ändern" onDoubleClick={() => setHmDay(r.weekday)}>
                                  {hmDay === r.weekday ? (
                                    <input
                                      className="shift-hm"
                                      autoFocus
                                      defaultValue={label}
                                      aria-label={`${DAYS[r.weekday]} von bis`}
                                      onFocus={(e) => e.target.select()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                                        if (e.key === "Escape") { e.currentTarget.dataset.skip = "1"; e.currentTarget.blur(); }
                                      }}
                                      onBlur={(e) => {
                                        if (!e.currentTarget.dataset.skip) {
                                          const m = e.target.value.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
                                          const startHm = m ? normHm(m[1]) : null;
                                          const endHm = m ? normHm(m[2]) : null;
                                          if (startHm && endHm && endHm > startHm) set({ startHm, endHm });
                                        }
                                        setHmDay(null);
                                      }}
                                    />
                                  ) : <span>{label}</span>}
                                </i>
                              ) : <span className="shift-free">frei</span>}
                            </div>
                            {r.open ? (
                              <>
                                <input aria-label={`${DAYS[r.weekday]} von`} type="time" value={r.startHm} onChange={(e) => set({ startHm: e.target.value })} />
                                <input aria-label={`${DAYS[r.weekday]} bis`} type="time" value={r.endHm} onChange={(e) => set({ endHm: e.target.value })} />
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="shift-hint" style={{ margin: "0.25rem 0 0" }}>Für diesen Mitarbeiter gelten die allgemeinen Öffnungszeiten des Betriebs.</p>
                )}
              </div>
            </details>

            <details className="set-fold">
              <summary>Mitarbeiter löschen</summary>
              <div className="card-body">
                <p className="shift-hint" style={{ margin: "0 0 0.85rem" }}>
                  Entfernt diesen Mitarbeiter dauerhaft. Bereits bestehende Termine bleiben im Kalender erhalten.
                </p>
                <button
                  type="button"
                  className="btn danger"
                  style={{ width: "auto" }}
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`${edit.name} wirklich löschen?`)) return;
                    setErr("");
                    setPending(true);
                    api.delStaff(edit.id)
                      .then(() => setEdit(null))
                      .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                      .finally(() => setPending(false));
                  }}
                >
                  Mitarbeiter löschen
                </button>
              </div>
            </details>

            <div className="modal-foot">
              <button type="button" className="btn outline" onClick={() => setEdit(null)}>Abbrechen</button>
              <button className="btn" type="submit" disabled={pending}>Speichern</button>
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
  if (!boot) return <div className="page"><p className="lead wait">Laden…</p></div>;
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
            {form.id ? (
              <button
                type="button"
                className="btn danger staff-del"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`${form.name} wirklich löschen?`)) return;
                  setErr("");
                  setPending(true);
                  api.delService(form.id as string)
                    .then(() => setForm(null))
                    .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                    .finally(() => setPending(false));
                }}
              >
                Löschen
              </button>
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
  const [sign, setSign] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!boot || rows.length) return;
    setSign(boot.tenant.mailSign ?? "");
    setRows([1, 2, 3, 4, 5, 6, 7].map((weekday) => {
      const h = boot.hours.find((x) => x.weekday === weekday);
      return { weekday, startHm: h?.startHm ?? "09:00", endHm: h?.endHm ?? (weekday === 6 ? "14:00" : "18:00"), open: Boolean(h) };
    }));
  }, [boot, rows.length]);
  if (!boot) return <div className="page" />;
  return (
    <div className="page slim">
      <PageHead title="Unternehmen" lead="Aufklappen, ändern, speichern." />
      {err ? <p className="err" role="alert">{err}</p> : null}
      <details className="set-fold" open>
        <summary>Öffnungszeiten</summary>
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
      </details>
      <details className="set-fold">
        <summary>Logo</summary>
        <div className="card-body">
          {boot.tenant.logoUrl ? <img className="logo-preview" src={boot.tenant.logoUrl} alt="" /> : <p className="hint-line">Noch kein Logo. Erscheint oben im Buchungs-iframe und unten in Mails, wenn dort kein eigenes Bild liegt.</p>}
          <ImageDrop
            label={boot.tenant.logoUrl ? "Logo ersetzen" : "Logo hochladen"}
            busy={pending}
            onFile={(file) => {
              setErr("");
              setPending(true);
              const body = new FormData();
              body.append("file", file);
              api.putLogo(body)
                .catch((ex) => setErr(ex instanceof Error ? ex.message : "Upload fehlgeschlagen."))
                .finally(() => setPending(false));
            }}
          />
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
      </details>
      <details className="set-fold">
        <summary>E-Mail</summary>
        <div className="card-body">
          <label className="field">
            <span>Text am Ende jeder Mail</span>
            <textarea value={sign} onChange={(e) => setSign(e.target.value)} placeholder={"Viele Grüße\nSalon Demo"} />
          </label>
          <p className="hint-line">Ohne eigenes Bild steht das Logo unten in der Mail.</p>
          {boot.tenant.mailImageUrl ? <img className="logo-preview" src={boot.tenant.mailImageUrl} alt="" /> : null}
          <ImageDrop
            label={boot.tenant.mailImageUrl ? "Bild ersetzen" : "Bild hochladen"}
            busy={pending}
            onFile={(file) => {
              setErr("");
              setPending(true);
              const body = new FormData();
              body.append("file", file);
              api.putMailImage(body)
                .catch((ex) => setErr(ex instanceof Error ? ex.message : "Upload fehlgeschlagen."))
                .finally(() => setPending(false));
            }}
          />
          {boot.tenant.mailImageUrl ? (
            <button
              className="linkish"
              type="button"
              disabled={pending}
              onClick={() => {
                setErr("");
                setPending(true);
                api.delMailImage()
                  .catch((ex) => setErr(ex instanceof Error ? ex.message : "Löschen fehlgeschlagen."))
                  .finally(() => setPending(false));
              }}
            >
              Bild löschen
            </button>
          ) : null}
          <div className="hours-foot">
            <button
              className="btn"
              type="button"
              disabled={pending}
              onClick={() => {
                setErr("");
                setPending(true);
                api.putMailSign(sign)
                  .catch((ex) => setErr(ex instanceof Error ? ex.message : "Speichern fehlgeschlagen."))
                  .finally(() => setPending(false));
              }}
            >
              Speichern
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

type Hit = { id: string; serviceId: string | null; startsAt: string; endsAt: string; guestName: string };

export function TimeOffPage() {
  const boot = useBoot();
  const off = useApi<{ timeOff: TimeOff[] }>("/api/app/time-off");
  const rows = off?.timeOff ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staffId: "", from: "", to: "", reason: "Urlaub" });
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [moves, setMoves] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);
  if (!boot) return <div className="page" />;
  const blank = { staffId: "", from: "", to: "", reason: "Urlaub" };
  function close() {
    setOpen(false);
    setHits(null);
    setMoves({});
    setErr("");
    setForm(blank);
  }
  function candidates(serviceId: string | null) {
    const svc = boot!.services.find((s) => s.id === serviceId);
    return boot!.staff.filter((s) => s.active && s.id !== form.staffId && svc?.staffIds.includes(s.id));
  }
  function look(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    api.previewTimeOff(form)
      .then((r) => {
        const next: Record<string, string> = {};
        for (const hit of r.bookings) {
          const who = candidates(hit.serviceId);
          next[hit.id] = who.length === 1 ? who[0].id : "";
        }
        setMoves(next);
        setHits(r.bookings);
      })
      .catch((ex) => setErr(ex instanceof Error ? ex.message : "Termine nicht geladen."))
      .finally(() => setPending(false));
  }
  function save(e: FormEvent) {
    e.preventDefault();
    if (hits?.some((h) => !moves[h.id])) {
      setErr("Für jeden Termin eine Vertretung wählen.");
      return;
    }
    setErr("");
    setPending(true);
    api.addTimeOff({
      ...form,
      moves: (hits ?? []).map((h) => ({ bookingId: h.id, staffId: moves[h.id] })),
    })
      .then(() => close())
      .catch((ex) => setErr(ex instanceof Error ? ex.message : "Speichern fehlgeschlagen."))
      .finally(() => setPending(false));
  }
  const ready = !hits?.some((h) => !moves[h.id]);
  return (
    <div className="page">
      <PageHead
        title="Sperren"
        aside={<button className="btn" type="button" onClick={() => { setErr(""); setHits(null); setOpen(true); }}>+ Sperre</button>}
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
                <td>{offLabel(r.startsAt, r.endsAt)}</td>
                <td>{r.reason}</td>
                <td><button className="linkish" type="button" onClick={() => api.delTimeOff(r.id)}>Löschen</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <Modal title={hits ? "Termine übernehmen" : "Neue Sperre"} wide={Boolean(hits?.length)} onClose={close}>
          {hits ? (
            <form onSubmit={save}>
              <p className="lead">{form.from.split("-").reverse().join(".")} – {form.to.split("-").reverse().join(".")}. {hits.length ? "Wähle, wer die Termine übernimmt." : "Keine Termine in diesem Zeitraum."}</p>
              {hits.length ? (
                <table className="table quiet">
                  <thead>
                    <tr>
                      <th>Termin</th>
                      <th>Übernimmt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hits.map((h) => {
                      const w = when(h.startsAt);
                      const who = candidates(h.serviceId);
                      return (
                        <tr key={h.id}>
                          <td>
                            <strong>{w.day} · {w.time}</strong>
                            <div>{h.guestName} · {boot.services.find((s) => s.id === h.serviceId)?.name ?? "Termin"}</div>
                          </td>
                          <td>
                            <select aria-label={`Vertretung für ${h.guestName}`} value={moves[h.id] ?? ""} onChange={(e) => setMoves({ ...moves, [h.id]: e.target.value })} required>
                              <option value="">{who.length ? "Bitte wählen" : "Keine Vertretung"}</option>
                              {who.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
              {err ? <p className="err" role="alert">{err}</p> : null}
              <div className="modal-foot">
                <button type="button" className="btn outline" onClick={() => { setHits(null); setErr(""); }}>Zurück</button>
                <button className={ready ? "btn" : "btn is-hold"} type="submit" disabled={pending || !ready}>Speichern</button>
              </div>
            </form>
          ) : (
            <form onSubmit={look}>
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
                  <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
                </label>
                <label className="field">
                  <span>Bis</span>
                  <input type="date" value={form.to} min={form.from || undefined} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
                </label>
              </div>
              <label className="field">
                <span>Grund</span>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              {err ? <p className="err" role="alert">{err}</p> : null}
              <div className="modal-foot">
                <button type="button" className="btn outline" onClick={close}>Abbrechen</button>
                <button className="btn" type="submit" disabled={pending}>{pending ? "Lädt…" : "Speichern"}</button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
