import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, type Actor } from "./api";
import { Mark } from "./Mark";

function recoveryAccessToken(hash: string) {
  const q = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return q.get("type") === "recovery" ? q.get("access_token") ?? "" : "";
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

  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
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
  const [token, setToken] = useState(() => recoveryAccessToken(loc.hash));
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const next = recoveryAccessToken(loc.hash);
    if (!next) return;
    setToken(next);
    history.replaceState(null, "", "/reset");
  }, [loc.hash]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== again) {
      setErr("Passwörter stimmen nicht überein.");
      return;
    }
    setPending(true);
    try {
      await api.resetPassword(token, password);
      setOk(true);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Passwort konnte nicht gesetzt werden.");
    } finally {
      setPending(false);
    }
  }

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
        <h1>Neues Passwort</h1>
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
        <button className="btn" disabled={pending}>{pending ? "Speichern…" : "Passwort speichern"}</button>
      </form>
    </div>
  );
}
