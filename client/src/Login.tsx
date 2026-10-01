import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type Actor } from "./api";
import { Mark } from "./Mark";
import { gsap, reduced, useGSAP } from "./motion";

const RESET_KEY = "flh-recovery";

function recoveryAccessToken(hash: string) {
  const q = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return q.get("type") === "recovery" ? q.get("access_token") ?? "" : "";
}

function storedToken() {
  try {
    return sessionStorage.getItem(RESET_KEY) ?? "";
  } catch {
    return "";
  }
}

function keepToken(token: string) {
  try {
    sessionStorage.setItem(RESET_KEY, token);
  } catch {
    /* private mode */
  }
}

function dropToken() {
  try {
    sessionStorage.removeItem(RESET_KEY);
  } catch {
    /* private mode */
  }
}

export function LoginPage({ onLogin }: { onLogin: (a: Actor) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");
    setPending(true);
    try {
      if (forgot) {
        await api.recover(email);
        setOk("Wenn das Konto existiert, kommt eine Mail mit dem Link.");
        return;
      }
      const r = await api.login(email, password);
      onLogin(r.actor);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  const box = useRef<HTMLFormElement>(null);
  useGSAP(() => {
    if (reduced() || !box.current) return;
    gsap.fromTo(box.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" });
  }, { scope: box });

  return (
    <div className="login">
      <form className="panel" ref={box} onSubmit={submit}>
        <Mark />
        <h1>{forgot ? "Passwort zurücksetzen" : "Anmelden"}</h1>
        <p>{forgot ? "Link kommt per Mail, gültig für die Live-App." : "Eine Tür für Mandanten und FLH. Login über Supabase Auth."}</p>
        {err ? <p className="err">{err}</p> : null}
        {ok ? <p className="ok">{ok}</p> : null}
        <label className="field">
          <span>E-Mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {forgot ? null : (
          <label className="field">
            <span>Passwort</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
        )}
        <button className="btn" disabled={pending}>{pending ? "Verbindung…" : forgot ? "Link senden" : "Anmelden"}</button>
        <button
          type="button"
          className="btn quiet"
          onClick={() => {
            setForgot((v) => !v);
            setErr("");
            setOk("");
          }}
        >
          {forgot ? "Zurück zur Anmeldung" : "Passwort vergessen"}
        </button>
      </form>
    </div>
  );
}

export function ResetPage() {
  const loc = useLocation();
  const [token, setToken] = useState(() => recoveryAccessToken(loc.hash) || storedToken());
  const [who, setWho] = useState<{ name: string; company: string } | null>(null);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const next = recoveryAccessToken(loc.hash);
    if (!next) return;
    keepToken(next);
    setToken(next);
    history.replaceState(null, "", "/reset");
  }, [loc.hash]);

  useEffect(() => {
    if (!token) return;
    let on = true;
    api.resetContext(token).then(
      (r) => {
        if (on) setWho(r);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!agree) {
      setErr("Bitte die AGB und die Datenschutzerklärung bestätigen.");
      return;
    }
    if (password !== again) {
      setErr("Passwörter stimmen nicht überein.");
      return;
    }
    setPending(true);
    try {
      await api.resetPassword(token, password);
      dropToken();
      setOk(true);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Passwort konnte nicht gesetzt werden.");
    } finally {
      setPending(false);
    }
  }

  const hello = who?.name ? `Hallo ${who.name}, lass uns dein Passwort festlegen` : "Lass uns dein Passwort festlegen";

  if (!token) {
    return (
      <div className="login">
        <div className="panel">
          <Mark />
          <h1>Passwort setzen</h1>
          <p className="err">Link ungültig oder abgelaufen.</p>
          <Link to="/login">Zur Anmeldung</Link>
        </div>
      </div>
    );
  }

  if (ok) {
    return (
      <div className="login">
        <div className="panel">
          <Mark />
          <h1>Passwort gesetzt</h1>
          <p className="ok">Neues Passwort ist aktiv.</p>
          <Link to="/login">Zur Anmeldung</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        <Mark />
        {who?.company ? <p className="co">{who.company}</p> : null}
        <h1>{hello}</h1>
        <p>Mindestens 8 Zeichen. Danach mit dem neuen Passwort anmelden.</p>
        {err ? <p className="err">{err}</p> : null}
        <label className="field">
          <span>Neues Passwort</span>
          <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="field">
          <span>Passwort wiederholen</span>
          <input type="password" autoComplete="new-password" minLength={8} required value={again} onChange={(e) => setAgain(e.target.value)} />
        </label>
        <label className="check agree">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          <span>
            Ich habe die <Link to="/agb">AGB</Link> und die <Link to="/datenschutz">Datenschutzerklärung</Link> gelesen und bin einverstanden.
          </span>
        </label>
        <button className={agree ? "btn" : "btn is-hold"} disabled={pending || !agree}>{pending ? "Speichern…" : "Passwort speichern"}</button>
      </form>
    </div>
  );
}

export function LegalPage({ kind }: { kind: "agb" | "privacy" }) {
  const agb = kind === "agb";
  return (
    <div className="login">
      <article className="panel legal">
        <Mark />
        <h1>{agb ? "Allgemeine Geschäftsbedingungen" : "Datenschutzerklärung"}</h1>
        <p className="note">Platzhalter. Der endgültige Text folgt und ersetzt diese Seite.</p>
        {agb ? (
          <>
            <h2>Geltung</h2>
            <p>Diese Bedingungen gelten für die Nutzung von Kalendaa zwischen dem Betreiber und dem Mandanten. Sie sind noch kein Vertragstext.</p>
            <h2>Leistung</h2>
            <p>Kalendaa stellt eine Online-Buchung und einen Kalender für Termine bereit. Umfang, Preise und Laufzeit stehen im jeweiligen Auftrag.</p>
            <h2>Konto</h2>
            <p>Zugangsdaten sind geheim zu halten. Das Passwort wird beim ersten Aufruf des Links aus der Mail selbst festgelegt.</p>
          </>
        ) : (
          <>
            <h2>Verantwortlicher</h2>
            <p>Verantwortlich für die Datenverarbeitung ist der Betreiber von Kalendaa. Kontaktdaten werden hier ergänzt.</p>
            <h2>Welche Daten</h2>
            <p>Für das Konto speichern wir Name, E-Mail und ein Passwort beim Authentifizierungsdienst. Buchungen enthalten die Angaben, die Gäste im Formular machen.</p>
            <h2>Zweck</h2>
            <p>Die Daten dienen dem Login, der Terminverwaltung und der Zustellung der Buchungsmails. Eine Weitergabe zu Werbezwecken findet nicht statt.</p>
          </>
        )}
        <p>
          <Link to={agb ? "/datenschutz" : "/agb"}>{agb ? "Zur Datenschutzerklärung" : "Zu den AGB"}</Link>
        </p>
        {storedToken() ? (
          <p>
            <Link to="/reset">Zurück zum Passwort</Link>
          </p>
        ) : null}
      </article>
    </div>
  );
}
