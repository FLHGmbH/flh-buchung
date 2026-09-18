import { useEffect, type ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api, type Actor } from "./api";
import { Avatar } from "./ui";
import { Mark } from "./Mark";

function Ico({ children }: { children: ReactNode }) {
  return (
    <svg className="nav-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  Kalender: (
    <Ico>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </Ico>
  ),
  Termine: (
    <Ico>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Ico>
  ),
  Mitarbeiter: (
    <Ico>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Ico>
  ),
  Sperren: (
    <Ico>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Ico>
  ),
  Leistungen: (
    <Ico>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" x2="8.12" y1="4" y2="15.88" />
      <line x1="14.47" x2="20" y1="14.48" y2="20" />
      <line x1="8.12" x2="12" y1="8.12" y2="12" />
    </Ico>
  ),
  "Unternehmen": (
    <Ico>
      <rect x="4" y="10" width="16" height="11" rx="1" />
      <path d="M9 21v-5h6v5" />
      <path d="M4 10V8l8-5 8 5v2" />
    </Ico>
  ),
  Mandanten: (
    <Ico>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Ico>
  ),
  "Neuer Mandant": (
    <Ico>
      <path d="M12 5v14M5 12h14" />
    </Ico>
  ),
};

function link(to: string, label: string) {
  return (
    <NavLink to={to} end={to === "/app" || to === "/admin"} onMouseEnter={() => api.prefetch(to)} onFocus={() => api.prefetch(to)}>
      {ICONS[label]}
      <span>{label}</span>
    </NavLink>
  );
}

export function Shell({ actor, onLogout }: { actor: Actor; onLogout: () => void }) {
  const kd = actor.role === "tenant_admin";
  useEffect(() => { api.prefetch(kd ? "/app" : "/admin"); }, [kd]);
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Mark invert word />
        </div>
        <nav>
          {kd ? (
            <>
              {link("/app", "Kalender")}
              {link("/app/termine", "Termine")}
              {link("/app/mitarbeiter", "Mitarbeiter")}
              {link("/app/sperren", "Sperren")}
              {link("/app/leistungen", "Leistungen")}
              {link("/app/zeiten", "Unternehmen")}
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
          <Avatar name={actor.name} size={40} />
          <div>
            <strong>{actor.name}</strong>
            <span>{actor.tenantName || "FLH DIGITAL"}</span>
          </div>
        </div>
        <button className="ghost" type="button" onClick={onLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Abmelden
        </button>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
