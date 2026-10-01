import { useEffect, useMemo, useRef, useState } from "react";
import { api, useApi, type Booking, type Bootstrap, type WeekPayload } from "./api";
import { BookingModal, coverService, firstOpen, PageHead, staffColor, staffTone } from "./ui";

const START = 8;
const END = 20;
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

function addMonth(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dim = new Date(y, m - 1 + n + 1, 0).getDate();
  return ymd(new Date(y, m - 1 + n, Math.min(d, dim)));
}

function monthGrid(anchor: string) {
  const first = anchor.slice(0, 8) + "01";
  const start = mondayOf(first);
  const dim = new Date(Number(first.slice(0, 4)), Number(first.slice(5, 7)), 0).getDate();
  const end = shift(mondayOf(shift(first, dim - 1)), 6);
  const days: string[] = [];
  for (let d = start; d <= end; d = shift(d, 1)) days.push(d);
  return days;
}

function weekdayIndex(date: string) {
  return (new Date(date + "T12:00:00").getDay() + 6) % 7;
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
  const n = Number(parts.find((p) => p.type === "hour")?.value);
  return n === 24 ? 0 : n;
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

type CalView = "day" | "week" | "month";

export function CalendarPage() {
  const [view, setView] = useState<CalView>("week");
  const [anchor, setAnchor] = useState(() => ymd(new Date()));
  const mon = mondayOf(anchor);
  const monthDays = useMemo(() => monthGrid(anchor), [anchor]);
  const dates = view === "day" ? [anchor] : view === "month" ? monthDays : weekDays(mon);
  const from = view === "month" ? monthDays[0] : mon;
  const span = view === "month" ? monthDays.length : 7;
  const boot = useApi<Bootstrap>("/api/app/bootstrap");
  const week = useApi<WeekPayload>(span === 7 ? `/api/app/week?from=${from}` : `/api/app/week?from=${from}&days=${span}`);
  const [pick, setPick] = useState<Booking | null>(null);
  const [draft, setDraft] = useState<{ staffId?: string; serviceId?: string; date?: string; time?: string } | null>(null);
  const [focus, setFocus] = useState<{ day: string; hour: number } | null>(null);

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
  }, [nowMark, week, anchor, view]);
  useEffect(() => {
    if (!focus) return;
    const cell = document.querySelector(`[data-slot="${focus.day}-${focus.hour}"]`);
    if (!cell) return;
    cell.scrollIntoView({ block: "center", inline: "nearest" });
    setFocus(null);
  }, [focus, anchor, week, view]);

  function showSaved(startsAt?: string) {
    setPick(null);
    setDraft(null);
    if (!startsAt) return;
    const day = ymdTz(startsAt, tz);
    setAnchor(day);
    if (view === "month") return;
    const hour = hourOf(startsAt, tz);
    if (Number.isFinite(hour)) setFocus({ day, hour });
  }

  function step(dir: number) {
    if (view === "day") setAnchor(shift(anchor, dir));
    else if (view === "week") setAnchor(shift(anchor, dir * 7));
    else setAnchor(addMonth(anchor, dir));
  }

  if (!boot) return <div className="page"><p className="lead wait">Laden…</p></div>;

  const emptyStaff = boot.staff.length === 0;
  const monthKey = anchor.slice(0, 7);
  const period = view === "day"
    ? new Date(anchor + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : view === "month"
      ? new Date(monthKey + "-01T12:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })
      : `KW ${isoWeek(mon)}: ${dm(mon)} – ${dm(dates[6])}${dates[6].slice(0, 4)}`;
  const prevLabel = view === "day" ? "Vorheriger Tag" : view === "month" ? "Vorheriger Monat" : "Vorherige Woche";
  const nextLabel = view === "day" ? "Nächster Tag" : view === "month" ? "Nächster Monat" : "Nächste Woche";
  const books = week?.bookings ?? [];
  const used = books
    .filter((b) => b.status !== "cancelled" && dates.includes(ymdTz(b.startsAt, tz)))
    .map((b) => hourOf(b.startsAt, tz))
    .filter((h) => Number.isFinite(h));
  const first = Math.min(START, ...used);
  const lastH = Math.max(END - 1, ...used);
  const rows = Array.from({ length: lastH - first + 1 }, (_, i) => first + i);

  return (
    <div className="page wide">
      <PageHead
        title="Kalender"
        aside={
          <div className="week-nav">
            <div className="view-switch" role="group" aria-label="Ansicht">
              {([["day", "Tag"], ["week", "Woche"], ["month", "Monat"]] as const).map(([id, label]) => (
                <button key={id} type="button" className={view === id ? "on" : ""} aria-pressed={view === id} onClick={() => setView(id)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="week-switch">
              <button type="button" className="week-arrow" aria-label={prevLabel} onClick={() => step(-1)}>
                ←
              </button>
              <span>{period}</span>
              <button type="button" className="week-arrow" aria-label={nextLabel} onClick={() => step(1)}>
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
            {view === "month" ? (
              <div className="month-grid">
                {DAYS.map((name) => <div className="week-head" key={name}>{name}</div>)}
                {dates.map((d) => {
                  const cellBooks = books.filter((b) => b.status !== "cancelled" && ymdTz(b.startsAt, tz) === d);
                  return (
                    <div
                      key={d}
                      className={"month-cell" + (d.slice(0, 7) === monthKey ? "" : " off") + (d === today ? " today" : "")}
                      onClick={() => {
                        const time = "09:00";
                        const hit = firstOpen(boot.staff, boot.services, d, time, books, week?.timeOff ?? []);
                        const svc = coverService(boot.services);
                        const who = boot.staff.find((s) => s.active && svc?.staffIds.includes(s.id)) ?? boot.staff.find((s) => s.active);
                        setDraft(hit ? { date: d, time, ...hit } : { date: d, time, staffId: who?.id, serviceId: svc?.id });
                      }}
                    >
                      <span className="month-num">{Number(d.slice(8))}</span>
                      {cellBooks.map((b) => {
                        const member = boot.staff.find((s) => s.id === b.staffId);
                        const t = staffTone(member ? staffColor(member) : null);
                        const svc = boot.services.find((s) => s.id === b.serviceId)?.name ?? "Termin";
                        const who = member?.name;
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
            ) : null}
            {view !== "month" ? nowMark ? <div className="now-line" ref={lineRef} /> : null : null}
            {view !== "month" ? (
            <div className={"week-grid" + (view === "day" ? " is-day" : "")}>
              <div className="week-head" />
              {dates.map((d) => (
                <div className="week-head" key={d}>{DAYS[weekdayIndex(d)]} {dm(d)}</div>
              ))}
              {rows.map((h) => (
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
                        data-slot={`${d}-${h}`}
                        key={d + h}
                        onClick={() => {
                          const hit = firstOpen(boot.staff, boot.services, d, time, books, week?.timeOff ?? []);
                          const svc = coverService(boot.services);
                          const who = boot.staff.find((s) => s.active && svc?.staffIds.includes(s.id)) ?? boot.staff.find((s) => s.active);
                          setDraft(hit ? { date: d, time, ...hit } : { date: d, time, staffId: who?.id, serviceId: svc?.id });
                        }}
                      >
                        {cellBooks.map((b) => {
                          const member = boot.staff.find((s) => s.id === b.staffId);
                          const t = staffTone(member ? staffColor(member) : null);
                          const svc = boot.services.find((s) => s.id === b.serviceId)?.name ?? "Termin";
                          const who = member?.name;
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
            ) : null}
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
          onSaved={showSaved}
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
          onSaved={showSaved}
        />
      ) : null}
    </div>
  );
}
