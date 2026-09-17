import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { api, rememberedActor, type Actor } from "./api";
import { AdminDetail, AdminList, AdminNew } from "./Admin";
import { BookPage } from "./Book";
import { CalendarPage } from "./Calendar";
import { BookingsPage, HoursPage, ServicesPage, StaffPage, TimeOffPage } from "./Manage";
import { LoginPage } from "./Login";
import { Shell } from "./Shell";

export function App() {
  const loc = useLocation();
  const [actor, setActor] = useState<Actor | null>(() => rememberedActor());

  useEffect(() => {
    api.me().then((r) => setActor(r.actor)).catch(() => setActor(null));
  }, []);
  useEffect(() => {
    if (!actor) return;
    api.prefetch(actor.role === "tenant_admin" ? "/app" : "/admin");
  }, [actor]);

  const publicBook = loc.pathname.startsWith("/b/");
  if (publicBook) {
    return (
      <Routes>
        <Route path="/b/:slug" element={<BookPage />} />
      </Routes>
    );
  }

  const kd = actor?.role === "tenant_admin";
  const flh = actor?.role === "platform_admin";

  return (
    <Routes>
      <Route path="/login" element={actor ? <Home actor={actor} /> : <LoginPage onLogin={(a) => { setActor(a); api.prefetch(a.role === "tenant_admin" ? "/app" : "/admin"); }} />} />
      <Route
        element={
          actor ? (
            <Shell actor={actor} onLogout={() => api.logout().then(() => setActor(null))} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route element={kd ? <Outlet /> : <Navigate to="/admin" replace />}>
          <Route path="/app" element={<CalendarPage />} />
          <Route path="/app/termine" element={<BookingsPage />} />
          <Route path="/app/mitarbeiter" element={<StaffPage />} />
          <Route path="/app/sperren" element={<TimeOffPage />} />
          <Route path="/app/leistungen" element={<ServicesPage />} />
          <Route path="/app/zeiten" element={<HoursPage />} />
        </Route>
        <Route element={flh ? <Outlet /> : <Navigate to="/app" replace />}>
          <Route path="/admin" element={<AdminList />} />
          <Route path="/admin/neu" element={<AdminNew />} />
          <Route path="/admin/:id" element={<AdminDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Home actor={actor} />} />
    </Routes>
  );
}

function Home({ actor }: { actor: Actor | null }) {
  if (!actor) return <Navigate to="/login" replace />;
  return <Navigate to={actor.role === "platform_admin" ? "/admin" : "/app"} replace />;
}
