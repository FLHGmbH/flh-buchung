import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type Pub } from "./api";

function berlinDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

const STEPS = ["Leistung", "Person", "Tag", "Uhrzeit", "Angaben", "Code", "Fertig"];

export function BookPage() {
  const { slug = "" } = useParams();
  const [pub, setPub] = useState<Pub | null>(null);
  const [err, setErr] = useState("");
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
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api.pub(slug).then(setPub).catch((e) => setErr(e.message));
  }, [slug]);

  useEffect(() => {
    if (!serviceId || !pub) return;
    setPending(true);
    api.slots(slug, serviceId, staffId || undefined)
      .then((r) => setSlots(r.slots))
      .catch((e) => setErr(e.message))
      .finally(() => setPending(false));
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
      out.push({ key, label: d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" }), open: map.has(key) });
    }
    return out;
  }, [slots]);

  const daySlots = slots.filter((s) => berlinDay(s.start) === day).sort((a, b) => a.start.localeCompare(b.start));

  if (!pub) return <div className="book">{err ? <p className="err">{err}</p> : "Kalender wird geladen…"}</div>;

  const service = pub.services.find((s) => s.id === serviceId);
  const staffForService = pub.staff.filter((s) => !service || service.staffIds.includes(s.id));

  return (
    <div className="book">
      <h1>{pub.tenant.name}</h1>
      <p className="lead">Termin buchen</p>
      {err ? <p className="err">{err}</p> : null}
      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s} className={i === step ? "on" : ""}>{s}</span>
        ))}
      </div>

      {step === 0 && (
        pub.services.length ? pub.services.map((s) => (
          <button key={s.id} className={"choice" + (serviceId === s.id ? " on" : "")} type="button" onClick={() => { setServiceId(s.id); setStaffId(""); setSlot(null); setStep(1); }}>
            {s.name} · {s.durationMin} Min.
          </button>
        )) : (
          <p className="err">Noch keine Leistung angelegt. Im Mandanten-Konto unter Leistungen eine anlegen.</p>
        )
      )}

      {step === 1 && (
        <>
          <button className={"choice" + (staffId === "" ? " on" : "")} type="button" onClick={() => { setStaffId(""); setStep(2); }}>Egal</button>
          {staffForService.map((s) => (
            <button key={s.id} className={"choice" + (staffId === s.id ? " on" : "")} type="button" onClick={() => { setStaffId(s.id); setStep(2); }}>
              {s.name}
            </button>
          ))}
          <button className="btn quiet" type="button" onClick={() => setStep(0)}>Zurück</button>
        </>
      )}

      {step === 2 && (
        <>
          {pending ? <p>Termine werden geladen…</p> : null}
          <div className="days">
            {days.map((d) => (
              <button key={d.key} type="button" disabled={!d.open} className={day === d.key ? "on" : ""} onClick={() => { setDay(d.key); setStep(3); }}>
                {d.label}
              </button>
            ))}
          </div>
          {!pending && days.every((d) => !d.open) ? <p>In den nächsten 14 Tagen kein freier Slot.</p> : null}
          <button className="btn quiet" type="button" onClick={() => setStep(1)}>Zurück</button>
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
          <button className="btn quiet" type="button" onClick={() => setStep(2)}>Zurück</button>
        </>
      )}

      {step === 4 && slot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
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
          <p>{new Date(slot.start).toLocaleString("de-DE")} · {service?.name}</p>
          <label className="field"><span>Name</span><input required value={guest.guestName} onChange={(e) => setGuest({ ...guest, guestName: e.target.value })} /></label>
          <label className="field"><span>E-Mail</span><input type="email" required value={guest.guestEmail} onChange={(e) => setGuest({ ...guest, guestEmail: e.target.value })} /></label>
          <label className="field"><span>Telefon</span><input value={guest.guestPhone} onChange={(e) => setGuest({ ...guest, guestPhone: e.target.value })} /></label>
          <label className="field"><span>Notiz</span><textarea value={guest.note} onChange={(e) => setGuest({ ...guest, note: e.target.value })} /></label>
          <button className="btn" disabled={pending} type="submit">{pending ? "Sendet Code…" : "Code per Mail"}</button>
          <button className="btn quiet" type="button" onClick={() => setStep(3)}>Zurück</button>
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
          <p>Code ist unterwegs (15 Minuten gültig).</p>
          <label className="field">
            <span>6-stelliger Code</span>
            <input
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
        <div className="panel">
          <h1 style={{ fontSize: "1.25rem" }}>Gebucht</h1>
          <p>Nummer {done.id.slice(0, 8).toUpperCase()}</p>
          <p>{new Date(done.startsAt).toLocaleString("de-DE")}</p>
        </div>
      )}

      <footer className="book-foot">Buchung von FLH DIGITAL</footer>
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
