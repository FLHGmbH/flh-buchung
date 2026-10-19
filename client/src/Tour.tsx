import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useApi, type Booking, type Bootstrap } from "./api";
import { gsap, reduced } from "./motion";

type Step = { id: string; path: string; title: string; why: string; text: string; free?: boolean; nav?: string };
type Rect = { x: number; y: number; w: number; h: number };
type Base = { staff: number; cats: number; svcs: number; ids: Set<string> };

const STEPS: Step[] = [
  {
    id: "intro", path: "", free: true,
    title: "Hallo und herzlich willkommen!",
    why: "Wir richten jetzt gemeinsam alles ein, damit Gäste bei dir buchen können: Mitarbeiter, Kategorie, Leistung und dein erster Termin. Die Seiten wechselst du selbst.",
    text: "Du legst alles selbst an und klickst die Seiten in der Leiste selbst an. Klick auf Los geht's.",
  },
  {
    id: "go-staff", path: "/app/mitarbeiter", nav: "nav-staff",
    title: "Zu den Mitarbeitern",
    why: "Zuerst brauchst du eine Person, der Termine gehören.",
    text: "Klick in der Seitenleiste auf Mitarbeiter.",
  },
  {
    id: "staff", path: "/app/mitarbeiter",
    title: "Mitarbeiter anlegen",
    why: "Jeder Termin gehört einer Person. Ohne Mitarbeiter kann niemand gebucht werden.",
    text: "Klick auf + Mitarbeiter und lege dich oder dein Team an.",
  },
  {
    id: "go-services", path: "/app/leistungen", nav: "nav-services",
    title: "Zu den Leistungen",
    why: "Kategorien und Leistungen liegen auf einer eigenen Seite.",
    text: "Klick in der Seitenleiste auf Leistungen.",
  },
  {
    id: "category", path: "/app/leistungen",
    title: "Kategorie anlegen",
    why: "Kategorien wie Haarschnitt oder Farbe sortieren deine Leistungen. Gäste wählen auf der Buchungsseite zuerst die Kategorie.",
    text: "Klick auf + Kategorie und lege deine erste an.",
  },
  {
    id: "service", path: "/app/leistungen",
    title: "Leistung anlegen",
    why: "Eine Leistung bestimmt Dauer, Preis und wer sie machen darf. Daraus berechnet das System die freien Zeiten.",
    text: "Klick auf + Leistung und lege deine erste an.",
  },
  {
    id: "go-calendar", path: "/app", nav: "nav-calendar",
    title: "Zum Kalender",
    why: "Den ersten Termin legst du im Kalender an.",
    text: "Klick in der Seitenleiste auf Kalender.",
  },
  {
    id: "booking", path: "/app",
    title: "Ersten Termin anlegen",
    why: "So siehst du, wie ein Termin im Kalender landet. Gäste buchen später genauso über deine Buchungsseite.",
    text: "Klick auf + Neuer Termin und lege einen Termin an.",
  },
  {
    id: "go-dashboard", path: "/app/dashboard", nav: "nav-dashboard",
    title: "Zum Dashboard",
    why: "Zum Schluss siehst du die Übersicht deines Salons.",
    text: "Klick in der Seitenleiste auf Dashboard.",
  },
  {
    id: "dashboard", path: "/app/dashboard",
    title: "Dashboard",
    why: "Hier siehst du auf einen Blick, wie dein Salon läuft.",
    text: "Umsatz, Termine, Kunden und woher die Buchungen kommen. Mit Fertig schließt du den Rundgang.",
  },
];

function qs(name: string) {
  return document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
}

function formId() {
  return document.querySelector("[data-tour='booking-form']")?.getAttribute("data-id") ?? null;
}

function val(name: string) {
  return document.querySelector<HTMLInputElement>(`[data-tour="${name}"]`)?.value.trim() ?? "";
}

function slideOf() {
  return document.querySelector("[data-tour='svc-form']")?.getAttribute("data-slide") ?? null;
}

// Filled and left: the spotlight moves on to Speichern. While the user types it stays on the field.
function done(name: string) {
  return val(name) !== "" && document.activeElement !== qs(name);
}

function spot(step: Step) {
  if (step.free) return null;
  if (step.nav) return qs(step.nav);
  if (step.id === "dashboard") return qs("dashboard");
  if (step.id === "booking") {
    if (formId() !== "") return qs("add-booking");
    return done("guest-name") ? qs("save-booking") : qs("guest-name") ?? qs("save-booking");
  }
  if (step.id === "category") {
    if (qs("cat-name")) return done("cat-name") ? qs("save-category") : qs("cat-name");
    return qs("add-category");
  }
  if (step.id === "service") {
    const slide = slideOf();
    if (slide === "0") return qs("svc-name");
    if (slide === "1") return qs("svc-staff");
    if (slide === "2") return qs("save-service");
    return qs("add-service");
  }
  if (qs("staff-name")) return done("staff-name") ? qs("save-staff") : qs("staff-name");
  return qs("add-staff");
}

function cue(step: Step, path: string) {
  if (step.nav) return path === step.path ? "Du bist schon auf der richtigen Seite. Klick auf Weiter." : step.text;
  if (step.id === "staff" && qs("staff-name")) {
    return done("staff-name") ? "Speichern legt die Person an." : val("staff-name") ? "Passt der Name? Dann klick auf Speichern." : "Trag den Namen der Person ein.";
  }
  if (step.id === "category" && qs("cat-name")) {
    return done("cat-name") ? "Speichern legt die Kategorie an." : val("cat-name") ? "Passt der Name? Dann klick auf Speichern." : "Trag den Namen der Kategorie ein.";
  }
  if (step.id === "service") {
    const slide = slideOf();
    if (slide === "0") return "Name, Dauer und Kategorie trägst du selbst ein. Danach Weiter im Formular.";
    if (slide === "1") return "Wähl selbst, wer die Leistung machen darf. Danach Weiter im Formular.";
    if (slide === "2") return "Preis kannst du leer lassen. Speichern legt deine Leistung an.";
  }
  if (step.id === "booking" && formId() === "") {
    return done("guest-name") ? "Termin erstellen legt deinen Termin in den Kalender." : val("guest-name") ? "Passt alles? Dann klick auf Termin erstellen." : "Wähle Datum und Leistung und trag den Gast ein.";
  }
  return step.text;
}

function finished(step: Step, boot: Bootstrap, rows: Booking[], base: Base, path: string) {
  if (step.nav) return path === step.path;
  if (step.id === "dashboard" || step.free) return true;
  if (step.id === "staff") return boot.staff.length > base.staff;
  if (step.id === "category") return boot.categories.length > base.cats;
  if (step.id === "service") return boot.services.length > base.svcs;
  if (step.id === "booking") return rows.some((b) => !base.ids.has(b.id) && b.status !== "cancelled");
  return false;
}

function place(r: Rect, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  const m = document.querySelector(".modal")?.getBoundingClientRect();
  const side = m && m.right + gap + w <= vw - 12 ? m.right + gap : m && m.left - gap - w >= 12 ? m.left - gap - w : null;
  if (side !== null && m) return { x: side, y: Math.min(Math.max(12, r.y + r.h / 2 - h / 2), vh - h - 12) };
  let y = r.y + r.h + gap;
  let x = Math.min(Math.max(12, r.x), vw - w - 12);
  if (y + h > vh - 12) y = Math.max(12, r.y - gap - h);
  const over = y < r.y + r.h && y + h > r.y && x < r.x + r.w && x + w > r.x;
  if (over && r.x + r.w + gap + w <= vw - 12) x = r.x + r.w + gap;
  else if (over && r.x - gap - w >= 12) x = r.x - gap - w;
  return { x, y };
}

export function Tour({ onClose }: { onClose: () => void }) {
  const loc = useLocation();
  const boot = useApi<Bootstrap>("/api/app/bootstrap");
  const list = useApi<{ bookings: Booking[] }>("/api/app/bookings");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [, setTick] = useState(0);
  const base = useRef<Base | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<SVGRectElement>(null);
  const dimRef = useRef<SVGSVGElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const pos = useRef({ x: 0, y: 0, w: 0, h: 0, on: false });
  const fly = useRef({ p: 1, from: { x: 0, y: 0, w: 0, h: 0 } });
  const phase = useRef<"out" | "wait" | "idle">("out");
  const since = useRef(0);
  const vis = useRef(false);
  const dimOn = useRef(false);
  const lit = useRef(false);
  const lastEl = useRef<HTMLElement | null>(null);
  const hold = useRef(0);
  const cand = useRef<{ el: HTMLElement | null; at: number }>({ el: null, at: 0 });
  const cardAt = useRef({ x: 0, y: 0, set: false });
  const started = useRef(false);
  const swapping = useRef(false);
  const unready = useRef(false);
  const jump = useRef(false);
  const entered = useRef(false);

  const step = steps?.[i];
  const view = steps?.[shown];
  const rows = list?.bookings ?? [];
  const ctx = useRef({ step, boot, i, path: loc.pathname });
  ctx.current = { step, boot, i, path: loc.pathname };

  useEffect(() => {
    if (steps || !boot || !list) return;
    base.current = {
      staff: boot.staff.length,
      cats: boot.categories.length,
      svcs: boot.services.length,
      ids: new Set(list.bookings.map((b) => b.id)),
    };
    setSteps(STEPS);
  }, [boot, list, steps]);

  // DOM changes and typing re-render the card copy. Positions follow in the ticker below.
  useEffect(() => {
    let raf = 0;
    const bump = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setTick((n) => n + 1);
      });
    };
    const mo = new MutationObserver(bump);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-slide", "data-id", "disabled"] });
    document.addEventListener("input", bump, true);
    document.addEventListener("focusout", bump, true);
    window.addEventListener("resize", bump);
    return () => {
      mo.disconnect();
      document.removeEventListener("input", bump, true);
      document.removeEventListener("focusout", bump, true);
      window.removeEventListener("resize", bump);
      cancelAnimationFrame(raf);
    };
  }, []);

  const texts = () => cardRef.current?.querySelectorAll(".tour-swap") ?? [];
  const textsIn = (delay: number) => {
    if (!texts().length) return;
    if (reduced()) {
      gsap.set(texts(), { autoAlpha: 1, y: 0 });
      return;
    }
    gsap.fromTo(texts(), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.06, delay, ease: "power2.out", overwrite: true });
  };

  // One ticker moves ring, dim hole and card. No tween restarts when the target moves.
  useEffect(() => {
    const ease = gsap.parseEase("expo.inOut");
    const land = () => {
      const ring = ringRef.current;
      if (!ring || reduced()) return;
      gsap.fromTo(ring, { scale: 0.95 }, { scale: 1, duration: 0.5, ease: "back.out(2.2)", overwrite: "auto" });
      gsap.fromTo(ring.querySelectorAll("i"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, stagger: 0.04, ease: "back.out(2)" });
      gsap.fromTo(ring.querySelector(".tour-glint b"), { xPercent: -140, autoAlpha: 0.9 }, { xPercent: 260, autoAlpha: 0, duration: 0.8, ease: "power2.inOut" });
      if (ctx.current.step?.id === "dashboard" && document.querySelector(".stat-row .stat")) {
        gsap.fromTo(".stat-row .stat", { y: 0 }, { y: -6, duration: 0.25, yoyo: true, repeat: 1, stagger: 0.08, delay: 0.2, ease: "power2.out", clearProps: "transform" });
      }
    };
    const fn = (_t: number, dt: number) => {
      const c = ctx.current;
      const ring = ringRef.current;
      const card = cardRef.current;
      const hole = holeRef.current;
      const dim = dimRef.current;
      const arrow = arrowRef.current;
      if (!c.step || !c.boot || !ring || !card || !hole || !dim) return;
      const quick = reduced();
      const p = pos.current;
      const f = fly.current;
      const free = Boolean(c.step.free);
      const here = free || Boolean(c.step.nav) || c.path === c.step.path;
      if (!here) since.current = 0;
      else if (!since.current) since.current = performance.now();
      const el = here ? spot(c.step) : null;
      const rectOf = (e: HTMLElement | null | undefined): Rect | null => {
        const b = e?.getBoundingClientRect();
        return b && b.width ? { x: b.left - 8, y: b.top - 8, w: b.width + 16, h: b.height + 16 } : null;
      };
      const t = rectOf(el);
      const modal = Boolean(document.querySelector(".modal"));
      if (modal !== lit.current) {
        lit.current = modal;
        ring.classList.toggle("is-lit", modal);
      }

      const begin = (to: Rect, delay: number, dur: number) => {
        gsap.killTweensOf(f);
        if (!p.on || quick) {
          Object.assign(p, to, { on: true });
          f.p = 1;
          land();
          return;
        }
        f.from = { x: p.x, y: p.y, w: p.w, h: p.h };
        f.p = 0;
        gsap.to(f, { p: 1, delay, duration: dur, ease: "none", onComplete: land });
      };
      const show = () => {
        if (vis.current) return;
        vis.current = true;
        gsap.to(ring, { autoAlpha: 1, duration: quick ? 0 : 0.25, overwrite: "auto" });
      };

      if (phase.current === "wait" && (t || free) && since.current && performance.now() - since.current > (quick ? 0 : 260)) {
        phase.current = "idle";
        lastEl.current = el;
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
        textsIn(0.3);
        // Read first: the card explains what and why, then the ring points at the target.
        if (t) {
          if (vis.current) begin(t, quick ? 0 : 0.9, 0.7);
          else hold.current = performance.now() + (quick ? 0 : 900);
        }
      } else if (phase.current === "idle") {
        let to = t;
        if (t) {
          if (!vis.current) {
            if (performance.now() >= hold.current) {
              show();
              begin(t, 0, 0.45);
            }
            lastEl.current = el;
          } else if (el !== lastEl.current) {
            // A new target must stay stable for a moment, so the ring never hops back and forth.
            const old = lastEl.current;
            if (cand.current.el !== el) cand.current = { el, at: performance.now() };
            if (!old?.isConnected || performance.now() - cand.current.at > (quick ? 0 : 450)) {
              begin(t, 0.08, 0.5);
              lastEl.current = el;
            } else to = rectOf(old) ?? t;
          }
          if (f.p < 1 && to) {
            const e = ease(f.p);
            p.x = f.from.x + (to.x - f.from.x) * e;
            p.y = f.from.y + (to.y - f.from.y) * e;
            p.w = f.from.w + (to.w - f.from.w) * e;
            p.h = f.from.h + (to.h - f.from.h) * e;
          } else if (to) {
            const k = quick ? 1 : 1 - Math.exp(-dt / 40);
            p.x += (to.x - p.x) * k;
            p.y += (to.y - p.y) * k;
            p.w += (to.w - p.w) * k;
            p.h += (to.h - p.h) * k;
          }
        } else if (vis.current) {
          vis.current = false;
          gsap.to(ring, { autoAlpha: 0, duration: quick ? 0 : 0.2, overwrite: "auto" });
        }
      }

      if (p.on) {
        ring.style.translate = `${p.x}px ${p.y}px`;
        ring.style.width = `${p.w}px`;
        ring.style.height = `${p.h}px`;
        hole.setAttribute("x", String(p.x));
        hole.setAttribute("y", String(p.y));
        hole.setAttribute("width", String(free ? 0 : Math.max(0, p.w)));
        hole.setAttribute("height", String(free ? 0 : Math.max(0, p.h)));
      }
      const wantDim = (vis.current || (free && phase.current === "idle")) && !modal;
      if (wantDim !== dimOn.current) {
        dimOn.current = wantDim;
        gsap.to(dim, { opacity: wantDim ? 1 : 0, duration: quick ? 0 : 0.3, overwrite: "auto" });
      }

      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const d = p.on && !free && vis.current ? place(p, w, h) : { x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 };
      const a = cardAt.current;
      if (!a.set || quick) {
        a.x = d.x;
        a.y = d.y;
        a.set = true;
      } else {
        const k = 1 - Math.exp(-dt / 110);
        a.x += (d.x - a.x) * k;
        a.y += (d.y - a.y) * k;
      }
      card.style.translate = `${a.x}px ${a.y}px`;

      if (arrow) {
        const tcx = p.x + p.w / 2;
        const tcy = p.y + p.h / 2;
        let side = "";
        if (p.on && vis.current) {
          if (a.y >= p.y + p.h - 2) side = "top";
          else if (a.y + h <= p.y + 2) side = "bottom";
          else if (a.x >= p.x + p.w - 2) side = "left";
          else if (a.x + w <= p.x + 2) side = "right";
        }
        arrow.dataset.side = side;
        if (side === "top" || side === "bottom") {
          arrow.style.left = `${Math.min(Math.max(22, tcx - a.x), w - 22) - 7}px`;
          arrow.style.top = side === "top" ? "-7px" : `${h - 7}px`;
        } else if (side) {
          arrow.style.top = `${Math.min(Math.max(22, tcy - a.y), h - 22) - 7}px`;
          arrow.style.left = side === "left" ? "-7px" : `${w - 7}px`;
        }
      }
    };
    gsap.ticker.add(fn);
    return () => {
      gsap.ticker.remove(fn);
      gsap.killTweensOf([fly.current, ringRef.current, cardRef.current, dimRef.current]);
    };
  }, []);

  // Step change: fade out, short beat, wait for the target, fly in. The user changes pages.
  useEffect(() => {
    if (!steps) return;
    const first = !started.current;
    started.current = true;
    const quick = reduced();
    phase.current = "out";
    if (!first && !quick) {
      gsap.to(texts(), { autoAlpha: 0, y: -6, duration: 0.14, overwrite: true });
      gsap.to(ringRef.current, { scale: 0.96, duration: 0.14, overwrite: "auto" });
    }
    const call = gsap.delayedCall(first || quick ? 0 : 0.18, () => {
      swapping.current = true;
      setShown(i);
      since.current = 0;
      phase.current = "wait";
    });
    return () => {
      call.kill();
    };
  }, [i, steps]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || entered.current) return;
    entered.current = true;
    if (reduced()) gsap.set(card, { autoAlpha: 1 });
    else gsap.fromTo(card, { autoAlpha: 0, scale: 0.94, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" });
  });

  useEffect(() => {
    const dot = dotsRef.current?.children[i];
    if (dot && !reduced()) gsap.fromTo(dot, { scaleX: 0.5 }, { scaleX: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" });
    jump.current = false;
    unready.current = false;
  }, [i]);

  const ready = Boolean(step && boot && base.current && finished(step, boot, rows, base.current, loc.pathname));
  if (!ready) unready.current = true;

  // Done: a short green beat, then the tour moves on by itself.
  useEffect(() => {
    if (!ready || !step || step.id === "dashboard" || step.free || !unready.current || jump.current) return;
    const ring = ringRef.current;
    jump.current = true;
    ring?.classList.add("is-ok");
    const call = gsap.delayedCall(reduced() ? 0 : 0.55, () => {
      ring?.classList.remove("is-ok");
      setI((n) => n + 1);
    });
    return () => {
      call.kill();
      ring?.classList.remove("is-ok");
    };
  }, [ready, step]);

  useEffect(() => {
    if (ready && nextRef.current && !reduced() && step?.id !== "dashboard") {
      gsap.fromTo(nextRef.current, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    }
  }, [ready, step?.id]);

  const hint = view ? cue(view, loc.pathname) : "";
  useEffect(() => {
    if (swapping.current) {
      swapping.current = false;
      return;
    }
    const el = cardRef.current?.querySelector(".tour-text");
    if (el && !reduced()) gsap.fromTo(el, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.25, overwrite: "auto" });
  }, [hint]);

  useEffect(() => {
    if (view?.id !== "dashboard") return;
    // The card fades in first. Hidden buttons cannot take focus.
    const call = gsap.delayedCall(reduced() ? 0 : 0.9, () => nextRef.current?.focus());
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      call.kill();
      window.removeEventListener("keydown", key);
    };
  }, [view?.id, onClose]);

  if (!step || !view || !boot || !base.current) return null;
  const last = i === steps!.length - 1;
  const goOn = () => {
    if (jump.current) return;
    jump.current = true;
    setI((n) => n + 1);
  };
  return createPortal(
    <>
      <svg ref={dimRef} className="tour-dim" aria-hidden="true">
        <defs>
          <mask id="tour-hole">
            <rect width="100%" height="100%" fill="#fff" />
            <rect ref={holeRef} rx="14" fill="#000" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(13, 59, 67, 0.55)" mask="url(#tour-hole)" />
      </svg>
      <div ref={ringRef} className="tour-ring" aria-hidden="true">
        <i /><i /><i /><i />
        <span className="tour-glint"><b /></span>
      </div>
      <div ref={cardRef} className="tour-card" role="dialog" aria-modal={view.id === "dashboard"} aria-labelledby="tour-count">
        <span ref={arrowRef} className="tour-arrow" />
        <div ref={dotsRef} className="tour-dots" aria-hidden="true">
          {steps!.map((x, n) => <span key={x.id} className={n < i ? "is-done" : n === i ? "is-on" : ""} />)}
        </div>
        <p id="tour-count" className="tour-count tour-swap">{shown === 0 ? "Willkommen" : `Schritt ${shown} von ${steps!.length - 1}`}</p>
        <p className="tour-title tour-swap">{view.title}</p>
        <p className="tour-why tour-swap">{view.why}</p>
        <p className="tour-text tour-swap">{hint}</p>
        <div className="tour-actions tour-swap">
          <button type="button" className="btn outline" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>Zurück</button>
          <button type="button" className="btn outline" onClick={onClose}>Überspringen</button>
          <button ref={nextRef} type="button" className="btn" disabled={!ready} onClick={() => (last ? onClose() : goOn())}>
            {last ? "Fertig" : i === 0 ? "Los geht's" : "Weiter"}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
