import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { api, type ApiErr, type Pub, type StornoView } from "./api";
import { guestMail, guestPhone } from "../../server/guest.ts";
import { Fold, gsap, reduced, StepPane, useGSAP } from "./motion";
import { euro, Modal, priceLabel, serviceLine } from "./ui";

function berlinDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const z = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${z(dt.getUTCMonth() + 1)}-${z(dt.getUTCDate())}`;
}

function mondayOf(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return shiftKey(key, wd === 0 ? -6 : 1 - wd);
}

function isoWeek(key: string) {
  const mon = mondayOf(key);
  const year = Number(shiftKey(mon, 3).slice(0, 4));
  const start = mondayOf(`${year}-01-04`);
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = mon.split("-").map(Number);
  return 1 + Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000 / 7);
}

function monthEnd(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

function dayLabel(key: string, opt: Intl.DateTimeFormatOptions) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("de-DE", { timeZone: "UTC", ...opt });
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const STEPS = ["Leistung", "Person", "Tag", "Uhrzeit", "Angaben", "Fertig"];

export function BookPage() {
  const { slug = "" } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [err, setErr] = useState("");
  const [block, setBlock] = useState<string | null>(null);
  function noteErr(ex: unknown) {
    const hit = ex as ApiErr;
    if (hit instanceof Error && hit.blocked) {
      setErr("");
      setBlock(hit.phone ?? "");
      return;
    }
    setErr(ex instanceof Error ? ex.message : "Buchung fehlgeschlagen.");
  }
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
  const [monthYm, setMonthYm] = useState("");
  const [slot, setSlot] = useState<{ start: string; end: string; staffId: string } | null>(null);
  const [guest, setGuest] = useState({ guestName: "", guestEmail: "", guestPhone: "", note: "" });
  const [done, setDone] = useState<{ id: string; startsAt: string } | null>(null);
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

  useEffect(() => {
    if (!pub || step !== 1 || pending || !slots.length) return;
    const service = pub.services.find((s) => s.id === serviceId);
    const fit = pub.staff.filter((s) => !service || service.staffIds.includes(s.id));
    const openIds = new Set(slots.map((s) => s.staffId));
    const free = fit.filter((s) => openIds.has(s.id));
    if (free.length !== 1) return;
    setStaffId(free[0].id);
    setStep(2);
  }, [pub, step, pending, slots, serviceId]);

  const openDays = useMemo(() => {
    const map = new Set<string>();
    for (const s of (staffId ? slots.filter((x) => x.staffId === staffId) : slots)) map.add(berlinDay(s.start));
    return map;
  }, [slots, staffId]);
  const todayKey = berlinDay(new Date().toISOString());
  const horizon = shiftKey(todayKey, 27);
  const month = monthYm || (day || todayKey).slice(0, 7);
  const months: string[] = [];
  for (let k = todayKey; k <= horizon; k = shiftKey(k, 1)) {
    const ym = k.slice(0, 7);
    if (!months.includes(ym)) months.push(ym);
  }
  const cells: string[] = [];
  const monthStop = shiftKey(mondayOf(monthEnd(month)), 6);
  for (let k = mondayOf(`${month}-01`); k <= monthStop; k = shiftKey(k, 1)) cells.push(k);
  const canPrev = months.indexOf(month) > 0;
  const canNext = months.indexOf(month) < months.length - 1;
  const calTitle = dayLabel(`${month}-01`, { month: "long", year: "numeric" });

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
    <div key={s.id} className="svc-row">
      <div className={"choice svc-pick" + (on ? " on" : "")}>
        <button className="choice-hit" type="button" onClick={() => toggleService(s.id, keepStaff)}>{serviceLine(s)}</button>
        <button className={"choice-mark" + (on ? " is-minus" : "")} type="button" aria-label={on ? `${s.name} entfernen` : `${s.name} hinzufügen`} onClick={() => toggleService(s.id, keepStaff)}>
          <Mark minus={on} />
        </button>
      </div>
      {s.info?.trim() ? (
        <details className="svc-more">
          <summary>Weitere Infos</summary>
          <p>{s.info}</p>
        </details>
      ) : null}
    </div>
    );
  }
  const picked = ids.flatMap((id) => {
    const s = pub.services.find((x) => x.id === id);
    return s ? [s] : [];
  });
  const mins = picked.reduce((n, s) => n + s.durationMin, 0);
  const cents = picked.length && picked.every((s) => s.priceCents != null && s.priceMaxCents == null && !s.priceFrom)
    ? picked.reduce((n, s) => n + (s.priceCents ?? 0), 0)
    : null;
  const who = staffId ? pub.staff.find((s) => s.id === staffId)?.name ?? "Keine Präferenz" : "Keine Präferenz";
  const pickedDay = day && day >= todayKey && day <= horizon ? day : "";
  const offers = (service?.crossIds ?? []).slice(0, 3).flatMap((id) => {
    const row = id === service?.id ? undefined : pub.services.find((s) => s.id === id);
    return row ? [row] : [];
  });
  const offerIds = new Set(offers.map((s) => s.id));
  const withUpsell = offers.length > 0 && ids.every((id, i) => i === 0 || offerIds.has(id));
  const labels = withUpsell
    ? ["Leistung", "Person", "Tag", "Dazu", "Uhrzeit", "Angaben", "Fertig"]
    : STEPS;
  const at = (withUpsell || step < 3 ? step : step - 1) - (step >= 6 ? 1 : 0);
  const pickedNames = ids.map((id) => pub.services.find((s) => s.id === id)?.name).filter(Boolean).join(" + ");
  const recap = [
    pickedNames,
    step > 1 ? who : "",
    step > 2 && pickedDay ? dayLabel(pickedDay, { weekday: "short", day: "numeric", month: "short" }) : "",
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
                  <small>{s.durationMin} Min.{priceLabel(s) ? ` · ${priceLabel(s)}` : ""}</small>
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
      <p className="lead">Leistung, Zeit, dann die Bestätigung per Mail.</p>
      {err ? <p className="err" role="alert">{err}</p> : null}
      {block !== null ? (
        <Modal title="Online-Buchung nicht möglich" onClose={() => setBlock(null)}>
          <p className="ask-copy">Online-Buchung ist für diese E-Mail oder Telefonnummer nicht möglich. Bitte den Salon anrufen.</p>
          {block ? (
            <a className="ask-phone" href={`tel:${block.replace(/[^\d+]/g, "")}`}>{block}</a>
          ) : (
            <p className="ask-note">Im Salon ist noch keine Telefonnummer hinterlegt.</p>
          )}
          <div className="modal-foot">
            <button className="btn" type="button" onClick={() => setBlock(null)}>Schließen</button>
          </div>
        </Modal>
      ) : null}
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
            {cart({
              go: () => {
                if (staffForService.length === 1) {
                  setStaffId(staffForService[0].id);
                  setSlot(null);
                  setStep(2);
                  return;
                }
                setStep(1);
              },
              on: Boolean(serviceId),
            })}
          </div>
        ) : (
          <p className="err">Noch keine Leistung angelegt. Im Mandanten-Konto unter Leistungen eine anlegen.</p>
        )
      )}

      {step === 1 && staffForService.length !== 1 && (pending || offered.length !== 1) && (
        <>
          {offered.map((s) => (
            <button key={s.id} className={"choice person" + (staffId === s.id ? " on" : "")} type="button" onClick={() => { setStaffId(s.id); setStep(2); }}>
              {s.photoUrl ? <img src={s.photoUrl} alt="" /> : <span className="ph">{s.name.slice(0, 1)}</span>}
              {s.name}
            </button>
          ))}
          {offered.length > 1 ? (
            <>
              <p className="book-or">oder</p>
              <button className="choice person is-any" type="button" onClick={() => { setStaffId(""); setStep(2); }}>
                <span className="ph" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span>Keine Präferenz<small>Der Salon teilt eine freie Person zu.</small></span>
              </button>
            </>
          ) : null}
          {!pending && !offered.length ? <p>In den nächsten 4 Wochen ist niemand frei.</p> : null}
        </>
      )}

      {step === 2 && (
        <div className="book-step is-cal">
          {pending && !slots.length ? <DayBones /> : (
            <BookMonth month={month}>
              <div className="book-cal-bar">
                <button
                  type="button"
                  aria-label="Vorheriger Monat"
                  disabled={!canPrev}
                  onClick={() => setMonthYm(months[months.indexOf(month) - 1] ?? month)}
                >
                  ‹
                </button>
                <strong>{calTitle}</strong>
                <button
                  type="button"
                  aria-label="Nächster Monat"
                  disabled={!canNext}
                  onClick={() => setMonthYm(months[months.indexOf(month) + 1] ?? month)}
                >
                  ›
                </button>
              </div>
              <div className="book-cal-wd" aria-hidden="true">
                <span className="book-kw">KW</span>
                {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
              </div>
              <div className="days">
                {cells.flatMap((key, i) => {
                  const inRange = key >= todayKey && key <= horizon;
                  const open = inRange && openDays.has(key);
                  const outside = key.slice(0, 7) !== month;
                  const week = isoWeek(key);
                  const btn = (
                    <button
                      key={key}
                      type="button"
                      disabled={!open}
                      className={[day === key ? "on" : "", key === todayKey ? "is-today" : "", outside ? "is-out" : ""].filter(Boolean).join(" ")}
                      aria-pressed={day === key}
                      aria-label={dayLabel(key, { weekday: "long", day: "numeric", month: "long" })}
                      onClick={() => {
                        setDay(key);
                        setMonthYm(key.slice(0, 7));
                        setStep(ids.length === 1 && offers.length ? 3 : 4);
                      }}
                    >
                      <strong>{Number(key.slice(8))}</strong>
                      {key === todayKey ? <small>Heute</small> : null}
                    </button>
                  );
                  return i % 7 === 0 ? [<span key={`kw-${key}`} className="book-kw" aria-label={`Kalenderwoche ${week}`}>{week}</span>, btn] : [btn];
                })}
              </div>
              {day ? <p className="book-cal-pick">{dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}</p> : null}
            </BookMonth>
          )}
          {!pending && !slots.length ? <p>In den nächsten 4 Wochen kein freier Slot.</p> : null}
        </div>
      )}

      {step === 3 && offers.length ? (
        <>
          <div className="book-pick upsell">
            {offers.map((item) => (
              <UpsellOffer
                key={item.id}
                name={item.name}
                detail={item.durationMin + " Min." + (priceLabel(item) ? ` · ${priceLabel(item)}` : "")}
                line={service && service.name.length <= 32 ? `Direkt nach ${service.name}, im selben Termin.` : "Im selben Termin, direkt im Anschluss."}
                on={ids.includes(item.id)}
                onToggle={() => toggleService(item.id, true)}
              />
            ))}
            {cart({ go: () => setStep(4), on: true, label: ids.some((id) => offerIds.has(id)) ? "Weiter" : "Ohne weiter" }, true)}
          </div>
        </>
      ) : null}

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
                setDone((r as { booking: { id: string; startsAt: string } }).booking);
                setStep(7);
              })
              .catch((ex) => noteErr(ex))
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
          <p className="legal-note">Unverbindlicher Termin. Genannte Preise können abweichen und dienen nur zur Orientierung.</p>
          <label className="check agree">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
            <span>
              Ich habe die <a href={`/b/${slug}/datenschutz`} target="_blank" rel="noreferrer">Datenschutzerklärung</a> gelesen. {pub.tenant.name} darf Name und E-Mail für diesen Termin speichern.
            </span>
          </label>
          <button className={privacy && guestMail(guest.guestEmail) && guestPhone(guest.guestPhone) ? "btn" : "btn is-hold"} disabled={pending || !privacy || !guestMail(guest.guestEmail) || !guestPhone(guest.guestPhone)} type="submit">{pending ? "Wird gebucht…" : "Termin buchen"}</button>
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

      {step > 0 && step < 6 ? (
        <button
          className="btn outline book-back"
          type="button"
          onClick={() => setStep(step === 1 ? 0 : step === 2 ? (staffForService.length === 1 || (!pending && offered.length <= 1) ? 0 : 1) : step === 3 ? 2 : step === 4 ? (withUpsell ? 3 : 2) : 4)}
        >
          Zurück
        </button>
      ) : null}

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
    <div className={"book-page book-fit" + (cookies ? " has-cookie" : "")}>
      <div className="book" ref={ref}>{children}</div>
      {cookies ? <CookieBar privacyHref={`/b/${slug}/datenschutz`} onOk={() => setCookies(false)} /> : null}
    </div>
  );
}

function siteLabel(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.host.replace(/^www\./, "")}${path}`;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

function MoveCal({ slug, token, onMoved }: { slug: string; token: string; onMoved: (row: StornoView) => void }) {
  const [slots, setSlots] = useState<{ start: string; end: string; staffId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [day, setDay] = useState("");
  const [monthYm, setMonthYm] = useState("");
  const [pick, setPick] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    api.stornoSlots(slug, token)
      .then((r) => setSlots(r.slots))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [slug, token]);
  const todayKey = berlinDay(new Date().toISOString());
  const horizon = shiftKey(todayKey, 27);
  const month = monthYm || todayKey.slice(0, 7);
  const months: string[] = [];
  for (let k = todayKey; k <= horizon; k = shiftKey(k, 1)) {
    const ym = k.slice(0, 7);
    if (!months.includes(ym)) months.push(ym);
  }
  const cells: string[] = [];
  const monthStop = shiftKey(mondayOf(monthEnd(month)), 6);
  for (let k = mondayOf(`${month}-01`); k <= monthStop; k = shiftKey(k, 1)) cells.push(k);
  const openDays = new Set(slots.map((s) => berlinDay(s.start)));
  const daySlots = uniqueStarts(slots.filter((s) => berlinDay(s.start) === day));
  return (
    <div className="storno-move">
      <h2>Neuen Termin wählen</h2>
      {err ? <p className="err" role="alert">{err}</p> : null}
      {loading ? <DayBones /> : (
        <div className="storno-cal">
          <BookMonth month={month}>
            <div className="book-cal-bar">
              <button type="button" aria-label="Vorheriger Monat" disabled={months.indexOf(month) <= 0} onClick={() => setMonthYm(months[months.indexOf(month) - 1] ?? month)}>‹</button>
              <strong>{dayLabel(`${month}-01`, { month: "long", year: "numeric" })}</strong>
              <button type="button" aria-label="Nächster Monat" disabled={months.indexOf(month) >= months.length - 1} onClick={() => setMonthYm(months[months.indexOf(month) + 1] ?? month)}>›</button>
            </div>
            <div className="book-cal-wd" aria-hidden="true">
              <span className="book-kw">KW</span>
              {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
            </div>
            <div className="days">
              {cells.flatMap((key, i) => {
                const open = key >= todayKey && key <= horizon && openDays.has(key);
                const btn = (
                  <button
                    key={key}
                    type="button"
                    disabled={!open}
                    className={[day === key ? "on" : "", key === todayKey ? "is-today" : "", key.slice(0, 7) !== month ? "is-out" : ""].filter(Boolean).join(" ")}
                    aria-pressed={day === key}
                    onClick={() => { setDay(key); setPick(""); setMonthYm(key.slice(0, 7)); }}
                  >
                    <strong>{Number(key.slice(8))}</strong>
                    {key === todayKey ? <small>Heute</small> : null}
                  </button>
                );
                return i % 7 === 0 ? [<span key={`kw-${key}`} className="book-kw">{isoWeek(key)}</span>, btn] : [btn];
              })}
            </div>
          </BookMonth>
          {day ? (
            <div className="slots">
              {daySlots.map((s) => (
                <button key={s.start} className={"choice" + (pick === s.start ? " amber" : "")} type="button" onClick={() => setPick(s.start)}>
                  {new Date(s.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </button>
              ))}
            </div>
          ) : null}
          {!slots.length ? <p>In den nächsten 4 Wochen ist nichts frei.</p> : null}
          {pick ? (
            <button
              className="btn"
              type="button"
              disabled={pending}
              onClick={() => {
                setPending(true);
                setErr("");
                api.moveStorno(slug, token, pick)
                  .then(onMoved)
                  .catch((e: Error) => setErr(e.message))
                  .finally(() => setPending(false));
              }}
            >
              {pending ? "Wird verschoben…" : "Auf diese Uhrzeit verschieben"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function CancelPage() {
  const { slug = "", token = "" } = useParams();
  const [row, setRow] = useState<StornoView | null>(null);
  const [err, setErr] = useState("");
  const [kept, setKept] = useState(false);
  const [pending, setPending] = useState(false);
  const [moved, setMoved] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.storno(slug, token).then(setRow).catch((e: Error) => setErr(e.message));
  }, [slug, token]);

  useGSAP(() => {
    if (reduced() || !box.current) return;
    gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" });
  }, { scope: box });

  const title = !row && err
    ? "Link ungültig"
    : kept
      ? "Termin bleibt"
      : row?.state === "gone"
        ? "Termin abgesagt"
        : row?.state === "closed"
          ? "Absagen nicht möglich"
          : "Termin ändern?";
  const lead = !row && err
    ? err
    : kept && row
      ? `Bei ${row.salon} hat sich nichts geändert.`
      : row?.state === "gone"
        ? `Bei ${row.salon} ist der Platz wieder frei.`
        : row?.state === "closed"
          ? "Dieser Termin ist vorbei oder schon abgeschlossen."
          : row
            ? moved
              ? `Neuer Termin bei ${row.salon}. Die Mail ist unterwegs. Du kannst ihn noch einmal verschieben oder absagen.`
              : `Bei ${row.salon}. Du kannst absagen oder unten einen neuen Termin wählen.`
            : "Einen Moment.";

  return (
    <div className="login">
      <div className="storno-stack" ref={box}>
      <div className="panel storno-card">
        {row?.logoUrl ? <img className="book-logo" src={row.logoUrl} alt={row.salon} /> : null}
        <h1>{title}</h1>
        <p className={err && !row ? "err" : undefined}>{lead}</p>
        {row ? (
          <div className="storno-when">
            <strong>{row.service}</strong>
            <span>{row.when}</span>
          </div>
        ) : null}
        {err && row ? <p className="err" role="alert">{err}</p> : null}
        {row && !kept && row.state === "open" ? (
          <>
            <button
              className="btn danger"
              type="button"
              disabled={pending}
              onClick={() => {
                setPending(true);
                setErr("");
                api.dropStorno(slug, token)
                  .then(setRow)
                  .catch((e: Error) => setErr(e.message))
                  .finally(() => setPending(false));
              }}
            >
              {pending ? "Wird abgesagt…" : "Ja, absagen"}
            </button>
            <button className="btn quiet" type="button" disabled={pending} onClick={() => setKept(true)}>Nein, behalten</button>
            <MoveCal key={row.when} slug={slug} token={token} onMoved={(next) => { setRow(next); setMoved(true); }} />
          </>
        ) : null}
        {row && (row.website || row.address || row.phone || row.email) ? (
          <div className="storno-foot">
            {row.website ? (
              <p className="storno-site">
                Unsere Homepage
                <a href={row.website} target="_blank" rel="noreferrer">{siteLabel(row.website)}</a>
              </p>
            ) : null}
            {row.address ? <p className="storno-addr">{row.address}</p> : null}
            {row.phone ? <p><a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}>{row.phone}</a></p> : null}
            {row.email ? <p><a href={`mailto:${row.email}`}>{row.email}</a></p> : null}
          </div>
        ) : null}
      </div>
      <a className="flh-credit" href="https://www.flh-digital.de/" target="_blank" rel="noreferrer">
        <img src="/kalendaa.svg" alt="" width={28} height={31} />
        Powered by FLH - Kalender
      </a>
      </div>
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

function BookMonth({ month, children }: { month: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useGSAP(() => {
    const root = ref.current;
    if (!root) return;
    if (!seen.current) {
      seen.current = true;
      return;
    }
    if (reduced()) return;
    const items = root.querySelectorAll(".book-cal-bar, .book-cal-wd span, .book-kw, .days button");
    if (!items.length) return;
    gsap.fromTo(items, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, stagger: 0.03, ease: "power2.out", clearProps: "transform" });
  }, { dependencies: [month], scope: ref });
  return <div className="book-cal" ref={ref}>{children}</div>;
}

function DayBones() {
  return (
    <div className="days" role="status" aria-label="Termine werden geladen">
      {Array.from({ length: 7 }, (_, i) => <span key={i} className="bone bone-day" />)}
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
