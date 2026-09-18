import { useEffect, useMemo, useState } from "react";
import { api, load, peek, type Booking, type DayPayload } from "./api";
import { BookingModal, eventTone, PageHead } from "./ui";

const START = 8;
const END = 20;
const hours = Array.from({ length: END - START }, (_, i) => START + i);
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function ymd(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function shift(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function mondayOf(date: string) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(d);
}

function weekDays(mon: string) {
  return Array.from({ length: 7 }, (_, i) => shift(mon, i));
}

function isoWeek(mon: string) {
  const d = new Date(mon + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function dm(date: string) {
  const [, m, d] = date.split("-");
  return `${d}.${m}.`;
}

function hourOf(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  return Number(parts.find((p) => p.type === "hour")?.value);
}

function fmt(iso: string, tz: string) {
  return new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function shortName(name: string) {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  return `${p[0]} ${p[1][0]}.`;
}

export function CalendarPage() {
  const [mon, setMon] = useState(() => mondayOf(ymd(new Date())));
  const dates = useMemo(() => weekDays(mon), [mon]);
  const [days, setDays] = useState<(DayPayload | null)[]>(() => dates.map((d) => peek<DayPayload>(`/api/app/day?date=${d}`)));
  const [err, setErr] = useState("");
  const [pick, setPick] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<{ staffId?: string; serviceId?: string; date?: string; time?: string } | null>(null);

  useEffect(() => {
    let on = true;
    Promise.all(
      dates.map((d) =>
        load<DayPayload>(`/api/app/day?date=${d}`, () => {}).catch((e) => {
          throw e;
        }),
      ),
    )
      .then(() => {
        if (on) setDays(dates.map((d) => peek<DayPayload>(`/api/app/day?date=${d}`)));
      })
      .catch((e) => {
        if (on) setErr(e instanceof Error ? e.message : String(e));
      });
    return () => {
      on = false;
    };
  }, [dates]);

  const data = days.find(Boolean);
  const today = ymd(new Date());
  const nowTop = useMemo(() => {
    if (!data || !dates.includes(today)) return null;
    const parts = new Intl.DateTimeFormat("de-DE", { timeZone: data.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    if (h < START || h >= END) return null;
    return 48 + (h - START) * 48 + (m / 60) * 48;
  }, [data, dates, today]);

  function reload() {
    setDraft(null);
    Promise.all(dates.map((d) => api.day(d))).then(() => setDays(dates.map((d) => peek<DayPayload>(`/api/app/day?date=${d}`))));
  }

  if (err) return <div className="page"><p className="err">{err}</p></div>;
  if (!data) return <div className="page" />;

  const last = dates[6];
  const emptyStaff = data.staff.length === 0;

  return (
    <div className="page wide">
      <PageHead
        title="Kalender"
        aside={
          <div className="week-nav">
            <div className="week-switch">
              <button type="button" className="week-arrow" aria-label="Vorherige Woche" onClick={() => setMon(shift(mon, -7))}>
                ←
              </button>
              <span>KW {isoWeek(mon)}: {dm(mon)} – {dm(last)}{last.slice(0, 4)}</span>
              <button type="button" className="week-arrow" aria-label="Nächste Woche" onClick={() => setMon(shift(mon, 7))}>
                →
              </button>
            </div>
            <button className="btn" type="button" onClick={() => setDraft({ date: today, time: "09:00", staffId: data.staff[0]?.id, serviceId: data.services[0]?.id })}>
              + Neuer Termin
            </button>
          </div>
        }
      />
      {emptyStaff ? (
        <div className="empty">Noch keine Mitarbeiter. Lege unter Mitarbeiter Personen an, sonst bleibt das Raster leer.</div>
      ) : (
        <div className="cal-wrap">
          <div className="week-cal">
            {nowTop != null ? <div className="now-line" style={{ top: nowTop }} /> : null}
            <div className="week-grid">
              <div className="week-head" />
              {dates.map((d, i) => (
                <div className="week-head" key={d}>{DAYS[i]} {dm(d)}</div>
              ))}
              {hours.map((h) => (
                <div className="week-row" key={h}>
                  <div className="week-time">{String(h).padStart(2, "0")}:00</div>
                  {dates.map((d, di) => {
                    const day = days[di];
                    const cellBooks = (day?.bookings ?? []).filter(
                      (b) => b.status !== "cancelled" && hourOf(b.startsAt, data.timezone) === h,
                    );
                    return (
                      <div
                        className="week-cell"
                        key={d + h}
                        onClick={() =>
                          setDraft({
                            date: d,
                            time: `${String(h).padStart(2, "0")}:00`,
                            staffId: data.staff[0]?.id,
                            serviceId: data.services[0]?.id,
                          })
                        }
                      >
                        {cellBooks.map((b) => {
                          const t = eventTone(b.serviceId);
                          const svc = data.services.find((s) => s.id === b.serviceId)?.name ?? "Termin";
                          return (
                            <button
                              key={b.id}
                              type="button"
                              className="ev"
                              style={{ background: t.bg, borderLeftColor: t.edge, color: t.title }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPick(b);
                              }}
                            >
                              <strong style={{ color: t.title }}>{svc}</strong>
                              <span style={{ color: t.sub }}>{shortName(b.guestName)}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <aside className="hint">
            {pick ? (
              <>
                <h2>{pick.guestName}</h2>
                <p>{fmt(pick.startsAt, data.timezone)}–{fmt(pick.endsAt, data.timezone)}</p>
                <p>{data.services.find((s) => s.id === pick.serviceId)?.name}</p>
                <p>{pick.guestEmail} {pick.guestPhone}</p>
                {pick.note ? <p>{pick.note}</p> : null}
                {pick.status === "pending" ? <p>Wartet auf PIN</p> : null}
                {pick.status !== "cancelled" ? (
                  <button className="btn danger" type="button" onClick={() => api.cancelBooking(pick.id).then(() => { setPick(null); reload(); })}>
                    Stornieren
                  </button>
                ) : (
                  <p>Storniert</p>
                )}
              </>
            ) : (
              <p>Klick auf einen Termin oder eine leere Stunde.</p>
            )}
          </aside>
        </div>
      )}
      {draft ? (
        <BookingModal
          staff={data.staff}
          services={data.services}
          initial={draft}
          onClose={() => setDraft(null)}
          onSaved={reload}
        />
      ) : null}
    </div>
  );
}
