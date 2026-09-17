import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api, type Actor } from "./api";
import { Mark } from "./Mark";

function link(to: string, label: string) {
  return (
    <NavLink to={to} end={to === "/app" || to === "/admin"} onMouseEnter={() => api.prefetch(to)} onFocus={() => api.prefetch(to)}>
      {label}
    </NavLink>
  );
}

export function Shell({ actor, onLogout }: { actor: Actor; onLogout: () => void }) {
  const kd = actor.role === "tenant_admin";
  const [pw, setPw] = useState({ current: "", next: "", err: "", ok: false });
  useEffect(() => { api.prefetch(kd ? "/app" : "/admin"); }, [kd]);
  function changePw(e: FormEvent) {
    e.preventDefault();
    setPw((s) => ({ ...s, err: "", ok: false }));
    api.changePassword(pw.current, pw.next)
      .then(() => setPw({ current: "", next: "", err: "", ok: true }))
      .catch((ex) => setPw((s) => ({ ...s, err: ex instanceof Error ? ex.message : "Fehler", ok: false })));
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <Mark invert word />
        <nav>
          {kd ? (
            <>
              {link("/app", "Kalender")}
              {link("/app/termine", "Termine")}
              {link("/app/mitarbeiter", "Mitarbeiter")}
              {link("/app/sperren", "Sperren")}
              {link("/app/leistungen", "Leistungen")}
              {link("/app/zeiten", "Öffnungszeiten")}
            </>
          ) : (
            <>
              {link("/admin", "Mandanten")}
              {link("/admin/neu", "Neuer Mandant")}
            </>
          )}
        </nav>
        <div className="grow" />
        <div className="who">
          {actor.name}
          {actor.tenantName ? (
            <>
              <br />
              {actor.tenantName}
            </>
          ) : null}
        </div>
        <details className="pw">
          <summary>Passwort ändern</summary>
          <form onSubmit={changePw}>
            {pw.err ? <p className="err">{pw.err}</p> : null}
            {pw.ok ? <p className="ok">Gespeichert.</p> : null}
            <label className="field"><span>Aktuell</span><input type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value, ok: false }))} /></label>
            <label className="field"><span>Neu</span><input type="password" autoComplete="new-password" minLength={8} required value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value, ok: false }))} /></label>
            <button className="ghost" type="submit">Speichern</button>
          </form>
        </details>
        <button className="ghost" type="button" onClick={onLogout}>Abmelden</button>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
