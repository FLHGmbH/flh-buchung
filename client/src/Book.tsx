import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { api, type Pub } from "./api";
import { guestMail, guestPhone } from "../../server/guest.ts";
import { Fold, gsap, reduced, StepPane, useGSAP } from "./motion";
import { euro, serviceLine } from "./ui";

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
  const [ids, setIds] = useState<string[]>([]);
  const serviceId = ids[0] ?? "";
  const extraKey = ids.slice(1).join(",");
  const [staffId, setStaffId] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string; staffId: string }[]>([]);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState<{ start: string; end: string; staffId: string } | null>(null);
  const [guest, setGuest] = useState({ guestName: "", guestEmail: "", guestPhone: "", note: "" });
  const [done, setDone] = useState<{ id: string; startsAt: string } | null>(null);
  const [hold, setHold] = useState<{ id: string; startsAt: string } | null>(null);
  const [pin, setPin] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!serviceId || !pub) return;
    let on = true;
    setPending(true);
    setSlots([]);
    api.slots(slug, serviceId, undefined, extraKey ? extraKey.split(",") : undefined)
      .then((r) => { if (on) setSlots(r.slots); })
      .catch((e) => { if (on) setErr(e.message); })
      .finally(() => { if (on) setPending(false); });
    return () => { on = false; };
  }, [slug, serviceId, extraKey, pub]);

  const days = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const s of (staffId ? slots.filter((x) => x.staffId === staffId) : slots)) {
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
  }, [slots, staffId]);

  const mine = staffId ? slots.filter((s) => s.staffId === staffId) : slots;
  const daySlots = mine.filter((s) => berlinDay(s.start) === day).sort((a, b) => a.start.localeCompare(b.start));

  if (!pub) {
    return (
      <BookShell slug={slug}>
        {err ? <p className="err" role="alert">{err}</p> : <BookBones />}
      </BookShell>
    );
  }

  const service = pub.services.find((s) => s.id === serviceId);
  const staffForService = pub.staff.filter((s) => !service || service.staffIds.includes(s.id));
  const openIds = new Set(slots.map((s) => s.staffId));
  const offered = pending && !slots.length ? staffForService : staffForService.filter((s) => openIds.has(s.id));
  const cats = (pub.categories ?? []).filter((c) => pub.services.some((s) => s.categoryId === c.id));
  const loose = pub.services.filter((s) => !s.categoryId);
  const blocks = [
    ...cats.map((c) => ({ id: c.id, name: c.name, rows: pub.services.filter((s) => s.categoryId === c.id) })),
    ...(loose.length ? [{ id: "_", name: "Weitere Leistungen", rows: loose }] : []),
  ];
  function toggleService(id: string, keepStaff = false) {
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    if (!keepStaff) setStaffId("");
    setSlot(null);
  }
  function svcRow(s: (typeof pub.services)[number], keepStaff = false) {
    const on = ids.includes(s.id);
    return (
      <div key={s.id} className={"choice svc-pick" + (on ? " on" : "")}>
        <button className="choice-hit" type="button" onClick={() => toggleService(s.id, keepStaff)}>{serviceLine(s)}</button>
        <button className={"choice-mark" + (on ? " is-minus" : "")} type="button" aria-label={on ? `${s.name} entfernen` : `${s.name} hinzufügen`} onClick={() => toggleService(s.id, keepStaff)}>
          <Mark minus={on} />
        </button>
      </div>
    );
  }
  const picked = ids.flatMap((id) => {
    const s = pub.services.find((x) => x.id === id);
    return s ? [s] : [];
  });
  const mins = picked.reduce((n, s) => n + s.durationMin, 0);
  const cents = picked.length && picked.every((s) => s.priceCents != null)
    ? picked.reduce((n, s) => n + (s.priceCents ?? 0), 0)
    : null;
  const who = staffId ? pub.staff.find((s) => s.id === staffId)?.name ?? "Egal" : "Egal";
  const pickedDay = days.find((d) => d.key === day);
  const offer = service ? pub.services.find((s) => s.id !== service.id && (service.crossIds ?? []).includes(s.id)) : undefined;
  const withUpsell = Boolean(offer) && ids.length <= 2 && ids.every((id, i) => i === 0 || id === offer?.id);
  const labels = withUpsell
    ? ["Leistung", "Person", "Tag", "Dazu", "Uhrzeit", "Angaben", "Code", "Fertig"]
    : STEPS;
  const at = withUpsell || step < 3 ? step : step - 1;
  const pickedNames = ids.map((id) => pub.services.find((s) => s.id === id)?.name).filter(Boolean).join(" + ");
  const recap = [
    pickedNames,
    step > 1 ? who : "",
    step > 2 && pickedDay ? `${pickedDay.wd} ${pickedDay.num}. ${pickedDay.mon}` : "",
    step > 4 && slot ? new Date(slot.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "",
  ].filter(Boolean).join(" · ");
  function cart(next: { go: () => void; on: boolean; label?: string }, lockMain = false) {
    return (
      <aside className="book-cart" aria-label="Auswahl">
        <div className="book-cart-h">
          <strong>Auswahl</strong>
          {picked.length ? <span>{picked.length}</span> : null}
        </div>
        {picked.length ? (
          <ol>
            {picked.map((s, i) => (
              <li key={s.id}>
                <span className="book-cart-n">{i + 1}</span>
                <span className="book-cart-name">
                  <strong>{s.name}</strong>
                  <small>{s.durationMin} Min.{s.priceCents != null ? ` · ${euro(s.priceCents)}` : ""}</small>
                </span>
                {lockMain && s.id === serviceId ? null : (
                  <button className="choice-mark is-minus" type="button" aria-label={`${s.name} entfernen`} onClick={() => toggleService(s.id, lockMain)}>
                    <Mark minus />
                  </button>
                )}
              </li>
            ))}
          </ol>
        ) : <p>Noch keine Leistung.</p>}
        {picked.length ? <p className="book-cart-sum">{mins} Min.{cents != null ? ` · ${euro(cents)}` : ""}</p> : null}
        {next.on ? <button className="btn" type="button" onClick={next.go}>{next.label ?? "Weiter"}</button> : null}
      </aside>
    );
  }

  return (
    <BookShell slug={slug}>
      {pub.tenant.logoUrl ? <img className="book-logo" src={pub.tenant.logoUrl} alt="" /> : null}
      <h1>{pub.tenant.name}</h1>
      <p className="lead">Leistung, Zeit, dann der Code aus der Mail.</p>
      {err ? <p className="err" role="alert">{err}</p> : null}
      <div className="book-progress">
        <div className="book-progress-top">
          <span>Schritt {at + 1} von {labels.length}</span>
          <strong>{labels[at]}</strong>
        </div>
        <div
          className="book-bar"
          role="progressbar"
          aria-valuenow={at + 1}
          aria-valuemin={1}
          aria-valuemax={labels.length}
          aria-label={labels[at]}
        >
          <i style={{ transform: `scaleX(${(at + 1) / labels.length})` }} />
        </div>
      </div>
      {step > 0 && step < 7 && recap ? <p className="book-recap">{recap}</p> : null}

      <StepPane id={step}>
      {step === 0 && (
        pub.services.length ? (
          <div className="book-pick">
            <div className="book-list">
              {cats.length ? blocks.map((b) => {
                const on = catId === b.id || b.rows.some((s) => ids.includes(s.id));
                return (
                  <div key={b.id} className={"cat-fold" + (on ? " open" : "")}>
                    <button type="button" className="cat-fold-h" aria-expanded={on} onClick={() => setCatId(on ? "" : b.id)}>
                      <span>{b.name}</span>
                      <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <Fold open={on}>
                      {b.rows.map(svcRow)}
                    </Fold>
                  </div>
                );
              }) : pub.services.map(svcRow)}
            </div>
            {cart({ go: () => setStep(1), on: Boolean(serviceId) })}
          </div>
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
          {offered.map((s) => (
            <button key={s.id} className={"choice person" + (staffId === s.id ? " on" : "")} type="button" onClick={() => { setStaffId(s.id); setStep(2); }}>
              {s.photoUrl ? <img src={s.photoUrl} alt="" /> : <span className="ph">{s.name.slice(0, 1)}</span>}
              {s.name}
            </button>
          ))}
          {!pending && !offered.length ? <p>In den nächsten 14 Tagen ist niemand frei.</p> : null}
          <button className="btn quiet book-back" type="button" onClick={() => setStep(0)}>Zurück</button>
        </>
      )}

      {step === 2 && (
        <>
          {pending && !slots.length ? <DayBones /> : null}
          <div className="days">
            {days.map((d) => (
              <button key={d.key} type="button" disabled={!d.open} className={day === d.key ? "on" : ""} onClick={() => { setDay(d.key); setStep(ids.length === 1 && offer ? 3 : 4); }}>
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

      {step === 3 && offer && (
        <>
          <div className="book-pick upsell">
            <UpsellOffer
              name={offer.name}
              detail={offer.durationMin + " Min." + (offer.priceCents != null ? ` · ${euro(offer.priceCents)}` : "")}
              line={service && service.name.length <= 32 ? `Direkt nach ${service.name}, im selben Termin.` : "Im selben Termin, direkt im Anschluss."}
              on={ids.includes(offer.id)}
              onToggle={() => toggleService(offer.id, true)}
            />
            {cart({ go: () => setStep(4), on: true, label: ids.includes(offer.id) ? "Weiter" : "Ohne weiter" }, true)}
          </div>
          <button className="btn quiet book-back" type="button" onClick={() => setStep(2)}>Zurück</button>
        </>
      )}

      {step === 4 && (
        <>
          {pending ? <SlotBones /> : null}
          <div className="slots">
            {uniqueStarts(daySlots).map((s) => (
              <button
                key={s.start}
                className={"choice" + (slot?.start === s.start ? " amber" : "")}
                type="button"
                onClick={() => { setSlot(s); setStep(5); }}
              >
                {new Date(s.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </button>
            ))}
          </div>
          {!pending && !daySlots.length ? <p>An dem Tag ist dafür nichts frei.</p> : null}
          <button className="btn quiet book-back" type="button" onClick={() => setStep(withUpsell ? 3 : 2)}>Zurück</button>
        </>
      )}

      {step === 5 && slot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!privacy) return;
            if (!guestMail(guest.guestEmail)) {
              setErr("Bitte eine gültige E-Mail angeben.");
              return;
            }
            if (!guestPhone(guest.guestPhone)) {
              setErr("Bitte eine gültige Telefonnummer angeben.");
              return;
            }
            setErr("");
            setPending(true);
            api.book(slug, {
              serviceId,
              extraIds: ids.slice(1),
              staffId: slot.staffId,
              start: slot.start,
              ...guest,
            })
              .then((r) => {
                setErr("");
                setHold((r as { booking: { id: string; startsAt: string } }).booking);
                setStep(6);
              })
              .catch((ex) => setErr(ex.message))
              .finally(() => setPending(false));
          }}
        >
          <p className="book-when">{new Date(slot.start).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })} · {chainClock(slot.start, ids, pub.services)}</p>
          <label className="field"><span>Name</span><input required value={guest.guestName} onChange={(e) => setGuest({ ...guest, guestName: e.target.value })} placeholder="Max Mustermann" /></label>
          <label className="field">
            <span>E-Mail</span>
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              aria-invalid={guest.guestEmail.trim() !== "" && !guestMail(guest.guestEmail)}
              value={guest.guestEmail}
              onChange={(e) => setGuest({ ...guest, guestEmail: e.target.value })}
              placeholder="max@mustermann.de"
            />
            {guest.guestEmail.trim() && !guestMail(guest.guestEmail) ? <small className="err">Bitte eine gültige E-Mail, zum Beispiel max@mustermann.de.</small> : null}
          </label>
          <label className="field">
            <span>Telefon</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={guest.guestPhone.trim() !== "" && !guestPhone(guest.guestPhone)}
              value={guest.guestPhone}
              onChange={(e) => setGuest({ ...guest, guestPhone: e.target.value })}
              placeholder="0151 12345678"
            />
            {guest.guestPhone.trim() && !guestPhone(guest.guestPhone) ? <small className="err">Bitte eine gültige Telefonnummer, zum Beispiel 0151 12345678.</small> : null}
          </label>
          <label className="field"><span>Notiz</span><textarea value={guest.note} onChange={(e) => setGuest({ ...guest, note: e.target.value })} /></label>
          <label className="check agree">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
            <span>
              Ich habe die <a href={`/b/${slug}/datenschutz`} target="_blank" rel="noreferrer">Datenschutzerklärung</a> gelesen. {pub.tenant.name} darf Name und E-Mail für diesen Termin speichern.
            </span>
          </label>
          <button className={privacy && guestMail(guest.guestEmail) && guestPhone(guest.guestPhone) ? "btn" : "btn is-hold"} disabled={pending || !privacy || !guestMail(guest.guestEmail) || !guestPhone(guest.guestPhone)} type="submit">{pending ? "Sendet Code…" : "Code per Mail"}</button>
          <button className="btn quiet book-back" type="button" onClick={() => setStep(4)}>Zurück</button>
        </form>
      )}

      {step === 6 && hold && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
            setErr("");
            api.confirm(slug, hold.id, pin)
              .then((r) => {
                setDone(r.booking);
                setStep(7);
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

      {step === 7 && done && (
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

      <footer className="book-foot">
        Buchung von FLH DIGITAL
        {" · "}
        <a href={`/b/${slug}/datenschutz`}>Datenschutz</a>
      </footer>
    </BookShell>
  );
}

const COOKIE_KEY = "flh-book-ok";

function CookieBar({ onOk, privacyHref }: { onOk: () => void; privacyHref: string }) {
  return (
    <div className="cookie-bar" role="dialog" aria-label="Cookies">
      <p>
        Nur technisch nötige Daten für die Buchung. Keine Werbe-Cookies.{" "}
        <a href={privacyHref} target="_blank" rel="noreferrer">Datenschutzerklärung</a>
      </p>
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

function BookShell({ children, slug }: { children: ReactNode; slug: string }) {
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
      {cookies ? <CookieBar privacyHref={`/b/${slug}/datenschutz`} onOk={() => setCookies(false)} /> : null}
    </div>
  );
}

function UpsellOffer({ name, detail, line, on, onToggle }: { name: string; detail: string; line: string; on: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const btn = ref.current?.querySelector(".upsell-add");
    if (!btn || reduced() || on) return;
    gsap.fromTo(btn, { scale: 1 }, { scale: 1.04, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3, transformOrigin: "center", onComplete: () => gsap.set(btn, { clearProps: "transform" }) });
  }, { scope: ref });
  return (
    <div className="upsell-pitch" ref={ref}>
      <h2>{name} gleich mit?</h2>
      <p>{line}</p>
      <div className={"upsell-card" + (on ? " on" : "")}>
        <span>
          <strong>{name}</strong>
          <small>{detail}</small>
        </span>
        <button className={on ? "btn outline upsell-add" : "btn upsell-add"} type="button" onClick={onToggle}>
          {on ? "Doch nicht" : "Dazunehmen"}
        </button>
      </div>
    </div>
  );
}

function BookBones() {
  return (
    <div className="book-bones" role="status" aria-label="Laden">
      <span className="bone bone-logo" />
      <span className="bone bone-h" />
      <span className="bone bone-lead" />
      <div className="book-pick">
        <div className="book-list">
          <span className="bone bone-choice" />
          <span className="bone bone-choice" />
          <span className="bone bone-choice" />
          <span className="bone bone-choice" />
        </div>
        <aside className="book-cart" aria-hidden="true">
          <span className="bone bone-line" />
          <span className="bone bone-line" />
          <span className="bone bone-btn" />
        </aside>
      </div>
    </div>
  );
}

function DayBones() {
  return (
    <div className="days" role="status" aria-label="Termine werden geladen">
      {Array.from({ length: 14 }, (_, i) => <span key={i} className="bone bone-day" />)}
    </div>
  );
}

function SlotBones() {
  return (
    <div className="slots" role="status" aria-label="Termine werden geladen">
      {Array.from({ length: 8 }, (_, i) => <span key={i} className="bone bone-slot" />)}
    </div>
  );
}

function Mark({ minus }: { minus?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      {minus ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}

function chainClock(start: string, ids: string[], services: { id: string; name: string; durationMin: number; bufferMin?: number }[]) {
  let t = new Date(start).getTime();
  return ids.map((id) => {
    const s = services.find((x) => x.id === id);
    const label = `${new Date(t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} ${s?.name ?? "Termin"}`;
    t += ((s?.durationMin ?? 0) + (s?.bufferMin ?? 0)) * 60000;
    return label;
  }).join(" · ");
}

function uniqueStarts(slots: { start: string; end: string; staffId: string }[]) {
  const seen = new Set<string>();
  return slots.filter((s) => {
    if (seen.has(s.start)) return false;
    seen.add(s.start);
    return true;
  });
}
