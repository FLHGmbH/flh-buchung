import { useEffect, useMemo, useState } from "react";
import { api, type Booking, type DayPayload } from "./api";

const START = 8;
const END = 20;
const ROW = 48;
const hours = Array.from({ length: END - START }, (_, i) => START + i);

function topOf(iso: string, tz: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  return ((h - START) * 60 + m) / 60 * ROW;
}

function heightOf(a: string, b: string) {
  return Math.max(ROW / 2, (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000 * ROW);
}

function fmt(iso: string, tz: string) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function ymd(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const [date, setDate] = useState(() => ymd(new Date()));
  const [data, setData] = useState<DayPayload | null>(null);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState<Booking | "new" | null>(null);
  const [draft, setDraft] = useState({ staffId: "", serviceId: "", startsAt: "", guestName: "" });

  function load(d = date) {
    api.day(d).then(setData).catch((e) => setErr(e.message));
  }
  useEffect(() => { load(); }, [date]);

  const cols = data?.staff.length ?? 0;
  const nowTop = useMemo(() => {
    if (!data || data.date !== ymd(new Date())) return null;
    return topOf(new Date().toISOString(), data.timezone);
  }, [data]);

  if (err) return <div className="page"><p className="err">{err}</p></div>;
  if (!data) return <div className="page">Laden…</div>;

  const emptyStaff = data.staff.length === 0;

  return (
    <div className="page">
      <div className="toolbar">
        <h1>Kalender</h1>
        <button className="btn quiet" type="button" onClick={() => setDate(shift(date, -1))}>Vorheriger Tag</button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn quiet" type="button" onClick={() => setDate(shift(date, 1))}>Nächster Tag</button>
      </div>
      {emptyStaff ? (
        <div className="empty">
          Noch keine Mitarbeiter. Lege unter Mitarbeiter Personen an, sonst bleibt das Raster leer.
        </div>
      ) : (
        <div className="cal-wrap">
          <div className="cal">
            <div className="cal-grid" style={{ gridTemplateColumns: `72px repeat(${cols}, minmax(140px, 1fr))` }}>
              <div className="cal-label" />
              {data.staff.map((s) => (
                <div className="cal-label" key={s.id}>{s.name}{s.active ? "" : " (inaktiv)"}</div>
              ))}
              {hours.map((h) => (
                <div className="cal-row" key={h}>
                  <div className="cal-cell time">{String(h).padStart(2, "0")}:00</div>
                  {data.staff.map((s) => (
                    <div
                      className="cal-cell"
                      key={s.id + h}
                      onClick={() => {
                        setPick("new");
                        setDraft({
                          staffId: s.id,
                          serviceId: data.services[0]?.id ?? "",
                          startsAt: `${date}T${String(h).padStart(2, "0")}:00`,
                          guestName: "",
                        });
                      }}
                    >
                      {h === START && nowTop != null ? <div className="now-line" style={{ top: nowTop }} /> : null}
                      {data.bookings
                        .filter((b) => b.staffId === s.id && b.status !== "cancelled" && hourOf(b.startsAt, data.timezone) === h)
                        .map((b) => (
                          <button
                            key={b.id}
                            className={"block" + (b.status === "pending" ? " hold" : "")}
                            style={{ top: topOf(b.startsAt, data.timezone) % ROW, height: heightOf(b.startsAt, b.endsAt) }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPick(b); }}
                          >
                            {b.guestName}{b.status === "pending" ? " (PIN)" : ""}
                            <br />
                            {fmt(b.startsAt, data.timezone)}–{fmt(b.endsAt, data.timezone)}
                          </button>
                        ))}
                      {data.timeOff
                        .filter((o) => o.staffId === s.id)
                        .map((o) => {
                          const top = topOf(o.startsAt, data.timezone);
                          if (Math.floor(top / ROW) + START !== h) return null;
                          return (
                            <div key={o.id} className="block off" style={{ top: top % ROW, height: heightOf(o.startsAt, o.endsAt) }}>
                              {o.reason || "Sperre"}
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <aside className="panel">
            {pick && pick !== "new" ? (
              <>
                <h1 style={{ fontSize: "1.15rem" }}>{pick.guestName}</h1>
                <p>{fmt(pick.startsAt, data.timezone)}–{fmt(pick.endsAt, data.timezone)}</p>
                <p>{data.services.find((s) => s.id === pick.serviceId)?.name}</p>
                <p>{pick.guestEmail} {pick.guestPhone}</p>
                {pick.note ? <p>{pick.note}</p> : null}
                {pick.status === "pending" ? <p>Wartet auf PIN</p> : null}
                {pick.status === "cancelled" ? (
                  <p>Storniert</p>
                ) : (
                  <button className="btn danger" type="button" onClick={() => api.cancelBooking(pick.id).then(() => { setPick(null); load(); })}>
                    Stornieren
                  </button>
                )}
              </>
            ) : pick === "new" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  api.addBooking({ ...draft, startsAt: new Date(draft.startsAt).toISOString() }).then(() => { setPick(null); load(); }).catch((ex) => setErr(ex.message));
                }}
              >
                <h1 style={{ fontSize: "1.15rem" }}>Termin anlegen</h1>
                <label className="field">
                  <span>Mitarbeiter</span>
                  <select value={draft.staffId} onChange={(e) => setDraft({ ...draft, staffId: e.target.value })}>
                    {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Leistung</span>
                  <select value={draft.serviceId} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })}>
                    {data.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Start</span>
                  <input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
                </label>
                <label className="field">
                  <span>Name</span>
                  <input value={draft.guestName} onChange={(e) => setDraft({ ...draft, guestName: e.target.value })} required />
                </label>
                <button className="btn" type="submit">Speichern</button>
              </form>
            ) : (
              <p className="lead">Klick auf einen Termin oder eine leere Stunde.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function shift(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function hourOf(iso: string, tz: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  return Number(parts.find((p) => p.type === "hour")?.value);
}
