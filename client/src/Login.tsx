import { useState, type FormEvent } from "react";
import { api, type Actor } from "./api";
import { Mark } from "./Mark";

export function LoginPage({ onLogin }: { onLogin: (a: Actor) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setPending(true);
    try {
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
        <h1>Anmelden</h1>
        <p>Eine Tür für Mandanten und FLH.</p>
        {err ? <p className="err">{err}</p> : null}
        <label className="field">
          <span>E-Mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Passwort</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn" disabled={pending}>{pending ? "Verbindung…" : "Anmelden"}</button>
      </form>
    </div>
  );
}
