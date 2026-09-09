import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api, type Actor } from "./api";
import { AdminDetail, AdminList, AdminNew } from "./Admin";
import { BookPage } from "./Book";
import { CalendarPage } from "./Calendar";
import { BookingsPage, HoursPage, ServicesPage, StaffPage, TimeOffPage } from "./Manage";
import { LoginPage } from "./Login";
import { Shell } from "./Shell";

export function App() {
  const loc = useLocation();
  const [actor, setActor] = useState<Actor | null | undefined>(undefined);

  useEffect(() => {
    api.me().then((r) => setActor(r.actor)).catch(() => setActor(null));
  }, []);

  const publicBook = loc.pathname.startsWith("/b/");
  if (actor === undefined && !publicBook) return <div className="page">Laden…</div>;

  return (
    <Routes>
      <Route path="/login" element={actor ? <Home actor={actor} /> : <LoginPage onLogin={setActor} />} />
      <Route path="/b/:slug" element={<BookPage />} />
      <Route
        element={
          actor ? (
            <Shell actor={actor} onLogout={() => api.logout().then(() => setActor(null))} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/app" element={actor?.role === "tenant_admin" ? <CalendarPage /> : <Navigate to="/admin" replace />} />
        <Route path="/app/termine" element={<BookingsPage />} />
        <Route path="/app/mitarbeiter" element={<StaffPage />} />
        <Route path="/app/sperren" element={<TimeOffPage />} />
        <Route path="/app/leistungen" element={<ServicesPage />} />
        <Route path="/app/zeiten" element={<HoursPage />} />
        <Route path="/admin" element={actor?.role === "platform_admin" ? <AdminList /> : <Navigate to="/app" replace />} />
        <Route path="/admin/neu" element={<AdminNew />} />
        <Route path="/admin/:id" element={<AdminDetail />} />
      </Route>
      <Route path="*" element={<Home actor={actor} />} />
    </Routes>
  );
}

function Home({ actor }: { actor: Actor | null }) {
  if (!actor) return <Navigate to="/login" replace />;
  return <Navigate to={actor.role === "platform_admin" ? "/admin" : "/app"} replace />;
}
