import { useEffect } from "react";
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
  useEffect(() => { api.prefetch(kd ? "/app" : "/admin"); }, [kd]);
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
        <button className="ghost" type="button" onClick={onLogout}>Abmelden</button>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
