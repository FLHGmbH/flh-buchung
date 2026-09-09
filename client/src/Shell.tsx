import { NavLink, Outlet } from "react-router-dom";
import type { Actor } from "./api";
import { Mark } from "./Mark";

export function Shell({ actor, onLogout }: { actor: Actor; onLogout: () => void }) {
  const kd = actor.role === "tenant_admin";
  return (
    <div className="app">
      <aside className="sidebar">
        <Mark invert word />
        <nav>
          {kd ? (
            <>
              <NavLink to="/app" end>Kalender</NavLink>
              <NavLink to="/app/termine">Termine</NavLink>
              <NavLink to="/app/mitarbeiter">Mitarbeiter</NavLink>
              <NavLink to="/app/sperren">Sperren</NavLink>
              <NavLink to="/app/leistungen">Leistungen</NavLink>
              <NavLink to="/app/zeiten">Öffnungszeiten</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/admin" end>Mandanten</NavLink>
              <NavLink to="/admin/neu">Neuer Mandant</NavLink>
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
