import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { api, type Pub } from "./api";
import { Fold, gsap, reduced, StepPane, useGSAP } from "./motion";
import { serviceLine } from "./ui";

function berlinDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

const STEPS = ["Leistung", "Person", "Tag", "Uhrzeit", "Angaben", "Code", "Fertig"];

export function BookPage() {
  const { slug = "" } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!slug) return;
    let on = true;
    api.pub(slug).then(
      (d) => { if (on) setPub(d); },
      (e) => { if (on) setErr(e instanceof Error ? e.message : "Buchung nicht geladen."); },
    );
    return () => { on = false; };
  }, [slug]);
  const [catId, setCatId] = useState("");
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string; staffId: string }[]>([]);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState<{ start: string; end: string; staffId: string } | null>(null);
  const [guest, setGuest] = useState({ guestName: "", guestEmail: "", guestPhone: "", note: "" });
  const [done, setDone] = useState<{ id: string; startsAt: string } | null>(null);
  const [hold, setHold] = useState<{ id: string; startsAt: string } | null>(null);
  const [pin, setPin] = useState("");
  const [agree, setAgree] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!serviceId || !pub) return;
    let on = true;
    setPending(true);
    api.slots(slug, serviceId, staffId || undefined)
      .then((r) => { if (on) setSlots(r.slots); })
      .catch((e) => { if (on) setErr(e.message); })
      .finally(() => { if (on) setPending(false); });
    return () => { on = false; };
  }, [slug, serviceId, staffId, pub]);

  const days = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const s of slots) {
      const key = berlinDay(s.start);
      map.set(key, true);
    }
    const out = [];
    const start = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = berlinDay(d.toISOString());
      out.push({
        key,
        wd: d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", ""),
        num: d.toLocaleDateString("de-DE", { day: "numeric" }),
        mon: d.toLocaleDateString("de-DE", { month: "short" }).replace(".", ""),
        open: map.has(key),
      });
    }
    return out;
  }, [slots]);

  const daySlots = slots.filter((s) => berlinDay(s.start) === day).sort((a, b) => a.start.localeCompare(b.start));

  if (!pub) {
    return (
      <BookShell>
        {err ? <p className="err" role="alert">{err}</p> : <p className="lead wait">Laden…</p>}
      </BookShell>
    );
  }

  const service = pub.services.find((s) => s.id === serviceId);
  const staffForService = pub.staff.filter((s) => !service || service.staffIds.includes(s.id));
  const cats = (pub.categories ?? []).filter((c) => pub.services.some((s) => s.categoryId === c.id));
  const loose = pub.services.filter((s) => !s.categoryId);
  const blocks = [
    ...cats.map((c) => ({ id: c.id, name: c.name, rows: pub.services.filter((s) => s.categoryId === c.id) })),
    ...(loose.length ? [{ id: "_", name: "Weitere Leistungen", rows: loose }] : []),
  ];
  function pickService(id: string) {
    setServiceId(id);
    setStaffId("");
    setSlot(null);
    setStep(1);
  }
  const who = staffId ? pub.staff.find((s) => s.id === staffId)?.name ?? "Egal" : "Egal";
  const pickedDay = days.find((d) => d.key === day);
  const recap = [
    service?.name,
    step > 1 ? who : "",
    step > 2 && pickedDay ? `${pickedDay.wd} ${pickedDay.num}. ${pickedDay.mon}` : "",
    step > 3 && slot ? new Date(slot.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "",
  ].filter(Boolean).join(" · ");

  return (
    <BookShell>
      {pub.tenant.logoUrl ? <img className="book-logo" src={pub.tenant.logoUrl} alt="" /> : null}
      <h1>{pub.tenant.name}</h1>
      <p className="lead">Leistung, Zeit, dann der Code aus der Mail.</p>
      {err ? <p className="err" role="alert">{err}</p> : null}
      <div className="book-progress">
        <div className="book-progress-top">
          <span>Schritt {step + 1} von {STEPS.length}</span>
          <strong>{STEPS[step]}</strong>
        </div>
        <div
          className="book-bar"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={STEPS[step]}
        >
          <i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} />
        </div>
      </div>
      {step > 0 && step < 6 && recap ? <p className="book-recap">{recap}</p> : null}

      <StepPane id={step}>
      {step === 0 && (
        pub.services.length ? (
          cats.length ? (
            blocks.map((b) => {
              const on = catId === b.id;
              return (
                <div key={b.id} className={"cat-fold" + (on ? " open" : "")}>
                  <button type="button" className="cat-fold-h" aria-expanded={on} onClick={() => setCatId(on ? "" : b.id)}>
                    <span>{b.name}</span>
                    <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <Fold open={on}>
                    {b.rows.map((s) => (
                      <button key={s.id} className={"choice" + (serviceId === s.id ? " on" : "")} type="button" onClick={() => pickService(s.id)}>
                        {serviceLine(s)}
                      </button>
                    ))}
                  </Fold>
                </div>
              );
            })
          ) : pub.services.map((s) => (
            <button key={s.id} className={"choice" + (serviceId === s.id ? " on" : "")} type="button" onClick={() => pickService(s.id)}>
              {serviceLine(s)}
            </button>
          ))
        ) : (
          <p className="err">Noch keine Leistung angelegt. Im Mandanten-Konto unter Leistungen eine anlegen.</p>
        )
      )}

      {step === 1 && (
        <>
          <button className="choice person" type="button" onClick={() => { setStaffId(""); setStep(2); }}>
            <span className="ph" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
            Egal
          </button>
          {staffForService.map((s) => (
            <button key={s.id} className={"choice person" + (staffId === s.id ? " on" : "")} type="button" onClick={() => { setStaffId(s.id); setStep(2); }}>
              {s.photoUrl ? <img src={s.photoUrl} alt="" /> : <span className="ph">{s.name.slice(0, 1)}</span>}
              {s.name}
            </button>
          ))}
          <button className="btn quiet book-back" type="button" onClick={() => setStep(0)}>Zurück</button>
        </>
      )}

      {step === 2 && (
        <>
          {pending && !slots.length ? <p className="lead wait">Termine werden geladen…</p> : null}
          <div className="days">
            {days.map((d) => (
              <button key={d.key} type="button" disabled={!d.open} className={day === d.key ? "on" : ""} onClick={() => { setDay(d.key); setStep(3); }}>
                <small>{d.wd}</small>
                <strong>{d.num}</strong>
                <small>{d.mon}</small>
              </button>
            ))}
          </div>
          {!pending && !slots.length && days.every((d) => !d.open) ? <p>In den nächsten 14 Tagen kein freier Slot.</p> : null}
          <button className="btn quiet book-back" type="button" onClick={() => setStep(1)}>Zurück</button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="slots">
            {uniqueStarts(daySlots).map((s) => (
              <button
                key={s.start}
                className={"choice" + (slot?.start === s.start ? " amber" : "")}
                type="button"
                onClick={() => { setSlot(s); setStep(4); }}
              >
                {new Date(s.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </button>
            ))}
          </div>
          <button className="btn quiet book-back" type="button" onClick={() => setStep(2)}>Zurück</button>
        </>
      )}

      {step === 4 && slot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!agree) return;
            setPending(true);
            api.book(slug, {
              serviceId,
              staffId: slot.staffId,
              start: slot.start,
              ...guest,
            })
              .then((r) => {
                setErr("");
                setHold((r as { booking: { id: string; startsAt: string } }).booking);
                setStep(5);
              })
              .catch((ex) => setErr(ex.message))
              .finally(() => setPending(false));
          }}
        >
          <p className="book-when">{new Date(slot.start).toLocaleString("de-DE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {service?.name}</p>
          <label className="field"><span>Name</span><input required value={guest.guestName} onChange={(e) => setGuest({ ...guest, guestName: e.target.value })} /></label>
          <label className="field"><span>E-Mail</span><input type="email" required value={guest.guestEmail} onChange={(e) => setGuest({ ...guest, guestEmail: e.target.value })} /></label>
          <label className="field"><span>Telefon</span><input value={guest.guestPhone} onChange={(e) => setGuest({ ...guest, guestPhone: e.target.value })} /></label>
          <label className="field"><span>Notiz</span><textarea value={guest.note} onChange={(e) => setGuest({ ...guest, note: e.target.value })} /></label>
          <label className="check agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
            <span>
              Ich habe die <a href="/agb" target="_blank" rel="noreferrer">AGB</a> und die <a href="/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> gelesen und bin einverstanden.
            </span>
          </label>
          <button className={agree ? "btn" : "btn is-hold"} disabled={pending || !agree} type="submit">{pending ? "Sendet Code…" : "Code per Mail"}</button>
          <button className="btn quiet book-back" type="button" onClick={() => setStep(3)}>Zurück</button>
        </form>
      )}

      {step === 5 && hold && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
            setErr("");
            api.confirm(slug, hold.id, pin)
              .then((r) => {
                setDone(r.booking);
                setStep(6);
              })
              .catch((ex) => setErr(ex.message))
              .finally(() => setPending(false));
          }}
        >
          <p>Code aus der Mail, 15 Minuten gültig.</p>
          <label className="field">
            <span>6-stelliger Code</span>
            <input
              className="pin"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <button className="btn" disabled={pending || pin.length !== 6} type="submit">{pending ? "Prüft…" : "Bestätigen"}</button>
        </form>
      )}

      {step === 6 && done && (
        <div className="book-done">
          <span className="book-check" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <h2>Gebucht</h2>
          <p>{new Date(done.startsAt).toLocaleString("de-DE", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
          <p>Die Bestätigung mit der Kalenderdatei termin.ics ist unterwegs an deine E-Mail.</p>
          <p className="book-code">{done.id.slice(0, 8).toUpperCase()}</p>
        </div>
      )}
      </StepPane>

      <footer className="book-foot">Buchung von FLH DIGITAL</footer>
    </BookShell>
  );
}

const COOKIE_KEY = "flh-book-ok";

function CookieBar({ onOk }: { onOk: () => void }) {
  return (
    <div className="cookie-bar" role="dialog" aria-label="Cookies">
      <p>Nur technisch nötige Daten für die Buchung. Keine Werbe-Cookies.</p>
      <button
        className="btn"
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(COOKIE_KEY, "1");
          } catch {
            /* storage blocked in the iframe */
          }
          onOk();
        }}
      >
        Verstanden
      </button>
    </div>
  );
}

function BookShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cookies, setCookies] = useState(() => {
    try {
      return localStorage.getItem(COOKIE_KEY) !== "1";
    } catch {
      return true;
    }
  });
  useGSAP(() => {
    if (reduced() || !ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
  }, { scope: ref });
  return (
    <div className={"book-page" + (cookies ? " has-cookie" : "")}>
      <div className="book" ref={ref}>{children}</div>
      {cookies ? <CookieBar onOk={() => setCookies(false)} /> : null}
    </div>
  );
}

function uniqueStarts(slots: { start: string; end: string; staffId: string }[]) {
  const seen = new Set<string>();
  return slots.filter((s) => {
    if (seen.has(s.start)) return false;
    seen.add(s.start);
    return true;
  });
}
