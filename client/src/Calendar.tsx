import { useEffect, useMemo, useRef, useState } from "react";
import { api, useApi, type Booking, type Bootstrap, type WeekPayload } from "./api";
import { BookingModal, coverService, eventTone, firstOpen, PageHead } from "./ui";

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

function ymdTz(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function hourOf(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  return Number(parts.find((p) => p.type === "hour")?.value);
}

function shortName(name: string) {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  return `${p[0]} ${p[1][0]}.`;
}

function warm(mon: string) {
  api.week(mon);
  api.week(shift(mon, -7));
  api.week(shift(mon, 7));
}

export function CalendarPage() {
  const [mon, setMon] = useState(() => mondayOf(ymd(new Date())));
  const dates = useMemo(() => weekDays(mon), [mon]);
  const boot = useApi<Bootstrap>("/api/app/bootstrap");
  const week = useApi<WeekPayload>(`/api/app/week?from=${mon}`);
  const [pick, setPick] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<{ staffId?: string; serviceId?: string; date?: string; time?: string } | null>(null);

  useEffect(() => {
    warm(mon);
  }, [mon, week]);

  const tz = week?.timezone ?? boot?.tenant.timezone ?? "Europe/Berlin";
  const today = ymd(new Date());
  const nowMark = useMemo(() => {
    if (!dates.includes(today)) return null;
    const parts = new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    if (h < START || h >= END) return null;
    return { h, m };
  }, [dates, today, tz]);
  const timeRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cell = timeRef.current;
    const line = lineRef.current;
    if (!cell || !line || !nowMark) return;
    line.style.top = `${cell.offsetTop + (nowMark.m / 60) * cell.offsetHeight}px`;
  }, [nowMark, week, mon]);

  if (!boot) return <div className="page"><p className="lead wait">Laden…</p></div>;

  const last = dates[6];
  const emptyStaff = boot.staff.length === 0;
  const books = week?.bookings ?? [];

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
            <button
              className="btn"
              type="button"
              onClick={() => {
                const time = "09:00";
                const hit = firstOpen(boot.staff, boot.services, today, time, books, week?.timeOff ?? []);
                const svc = coverService(boot.services);
                const who = boot.staff.find((s) => s.active && svc?.staffIds.includes(s.id)) ?? boot.staff.find((s) => s.active);
                setDraft(hit ? { date: today, time, ...hit } : { date: today, time, staffId: who?.id, serviceId: svc?.id });
              }}
            >
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
            {nowMark ? <div className="now-line" ref={lineRef} /> : null}
            <div className="week-grid">
              <div className="week-head" />
              {dates.map((d, i) => (
                <div className="week-head" key={d}>{DAYS[i]} {dm(d)}</div>
              ))}
              {hours.map((h) => (
                <div className="week-row" key={h}>
                  <div className="week-time" ref={nowMark?.h === h ? timeRef : undefined}>{String(h).padStart(2, "0")}:00</div>
                  {dates.map((d) => {
                    const time = `${String(h).padStart(2, "0")}:00`;
                    const cellBooks = books.filter(
                      (b) => b.status !== "cancelled" && ymdTz(b.startsAt, tz) === d && hourOf(b.startsAt, tz) === h,
                    );
                    return (
                      <div
                        className="week-cell"
                        key={d + h}
                        onClick={() => {
                          const hit = firstOpen(boot.staff, boot.services, d, time, books, week?.timeOff ?? []);
                          const svc = coverService(boot.services);
                          const who = boot.staff.find((s) => s.active && svc?.staffIds.includes(s.id)) ?? boot.staff.find((s) => s.active);
                          setDraft(hit ? { date: d, time, ...hit } : { date: d, time, staffId: who?.id, serviceId: svc?.id });
                        }}
                      >
                        {cellBooks.map((b) => {
                          const t = eventTone(b.serviceId);
                          const svc = boot.services.find((s) => s.id === b.serviceId)?.name ?? "Termin";
                          const who = boot.staff.find((s) => s.id === b.staffId)?.name;
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
                              <span style={{ color: t.sub }}>{who ? `${shortName(who)} · ` : ""}{shortName(b.guestName)}</span>
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
            <p>Klick auf einen Termin oder eine freie Stunde. Der Termin geht an die nächste freie Person.</p>
          </aside>
        </div>
      )}
      {pick ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          booking={pick}
          timezone={tz}
          occupied={{ bookings: books, timeOff: week?.timeOff ?? [] }}
          onClose={() => setPick(null)}
          onSaved={() => setPick(null)}
        />
      ) : draft ? (
        <BookingModal
          staff={boot.staff}
          services={boot.services}
          categories={boot.categories}
          timezone={tz}
          initial={draft}
          occupied={{ bookings: books, timeOff: week?.timeOff ?? [] }}
          onClose={() => setDraft(null)}
          onSaved={() => setDraft(null)}
        />
      ) : null}
    </div>
  );
}
