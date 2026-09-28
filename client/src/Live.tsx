import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { gsap, reduced, useGSAP } from "./motion";

type Hit = { id: string; guestName: string; startsAt: string; serviceName: string; staffName: string };

function Toast({ hit, onDone }: { hit: Hit; onDone: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || reduced()) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 18, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power3.out", clearProps: "transform" });
  }, { scope: ref });
  useEffect(() => {
    const t = setTimeout(() => onDone(hit.id), 8000);
    return () => clearTimeout(t);
  }, [hit.id, onDone]);
  const when = new Date(hit.startsAt).toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="live-toast" ref={ref} role="status">
      <div>
        <strong>Neuer Termin</strong>
        <span>{hit.guestName}</span>
        <span>{hit.serviceName} · {hit.staffName}</span>
        <span>{when}</span>
      </div>
      <button type="button" className="live-x" aria-label="Schließen" onClick={() => onDone(hit.id)}>×</button>
    </div>
  );
}

export function LiveBookings() {
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Hit[]>([]);
  const drop = useCallback((id: string) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  useEffect(() => {
    let on = true;
    async function tick() {
      if (document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/app/pulse", { credentials: "include" });
        if (!r.ok || !on) return;
        const data = (await r.json()) as { bookings: Hit[] };
        const ids = data.bookings.map((b) => b.id);
        if (!seen.current) {
          seen.current = new Set(ids);
          return;
        }
        const fresh = data.bookings.filter((b) => !seen.current!.has(b.id));
        for (const id of ids) seen.current.add(id);
        if (!fresh.length) return;
        setToasts((list) => [...list, ...fresh].slice(-3));
        api.sync();
      } catch {
        /* nächster Tick */
      }
    }
    // ponytail: poll instead of a socket; Vercel drops long-lived streams. Drop the interval if realtime lands.
    tick();
    const id = setInterval(tick, 4000);
    const wake = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", wake);
    return () => {
      on = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="live-toasts">
      {toasts.map((hit) => <Toast key={hit.id} hit={hit} onDone={drop} />)}
    </div>
  );
}
