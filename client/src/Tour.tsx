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
    why: "Wir richten jetzt gemeinsam alles ein, damit Gäste bei dir buchen können: Mitarbeiter, Kategorie, Leistung, dein erster Termin und dein Unternehmen. Die Seiten wechselst du selbst.",
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
    id: "staff-hours", path: "/app/mitarbeiter",
    title: "Arbeitszeiten",
    why: "Eigene Arbeitszeiten legen fest, wann diese Person gebucht werden kann. Aktiv schaltet sie im Kalender und in der Online-Buchung frei.",
    text: "Klick auf das Zahnrad, leg die Zeiten an und speichere.",
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
    id: "cross", path: "/app/leistungen",
    title: "Zusammen buchbar",
    why: "Das ist Cross-Selling. Sobald mehrere Leistungen da sind, wählst du hier welche dazu passen.",
    text: "Im letzten Schritt der Leistung. Der Gast kann sie im Buchungsfenster dazubuchen.",
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
    id: "drag", path: "/app",
    title: "Termin verschieben",
    why: "Einen bestehenden Termin ziehst du mit der Maus auf eine andere Uhrzeit oder einen anderen Tag.",
    text: "In der Wochen- oder Tagesansicht fasst du den Termin an und ziehst ihn an die neue Stelle. Danach Weiter.",
  },
  {
    id: "go-firm", path: "/app/zeiten", nav: "nav-firm",
    title: "Zum Unternehmen",
    why: "Kontaktdaten, Öffnungszeiten und der Text deiner Mails liegen hier.",
    text: "Klick in der Seitenleiste auf Unternehmen.",
  },
  {
    id: "contact", path: "/app/zeiten",
    title: "Kontakt",
    why: "Adresse, Telefon, E-Mail und Homepage sieht der Gast im Buchungsfenster und auf der Absagen-Seite.",
    text: "Trag deine Daten ein und speichere.",
  },
  {
    id: "hours", path: "/app/zeiten",
    title: "Öffnungszeiten",
    why: "Gäste können nur buchen, solange der Salon offen ist. Ein Tag ohne Haken ist geschlossen.",
    text: "Prüf die Tage und Uhrzeiten und speichere.",
  },
  {
    id: "mail", path: "/app/zeiten",
    title: "E-Mail",
    why: "Dieser Text steht am Ende jeder Mail an deine Gäste.",
    text: "Klapp E-Mail auf, schreib den Text und speichere.",
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
  return document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-tour="${name}"]`)?.value.trim() ?? "";
}

const CONTACT = ["contact-address", "contact-phone", "contact-mail", "contact-site"];

function focused(names: string[]) {
  return names.find((n) => document.activeElement === qs(n)) ?? null;
}

function shownEl(name: string) {
  const el = qs(name);
  const box = el?.closest("details");
  if (box instanceof HTMLDetailsElement && !box.open) return box.querySelector<HTMLElement>("summary");
  return el;
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
    if (slide === "2") return qs("svc-cross");
    return qs("add-service");
  }
  if (step.id === "cross") {
    if (slideOf() === "2") return qs("svc-cross");
    if (slideOf() !== null) return qs("save-service");
    return qs("add-service");
  }
  if (step.id === "drag") return document.querySelector<HTMLElement>(".day-col [data-tour='chip']") ?? qs("chip");
  if (step.id === "staff-hours") {
    if (!qs("staff-set")) return qs("edit-staff");
    const custom = qs("staff-custom")?.querySelector("input");
    if (!(custom instanceof HTMLInputElement && custom.checked)) return qs("staff-custom");
    if (!qs("staff-shifts")?.querySelector("input[type=checkbox]:checked")) return qs("staff-shifts");
    const active = qs("staff-active");
    const box = active?.closest("details");
    if (box instanceof HTMLDetailsElement && !box.open) return box.querySelector<HTMLElement>("summary");
    return qs("save-staff-edit");
  }
  if (step.id === "contact") {
    const hit = focused(CONTACT);
    if (hit) return shownEl(hit);
    if (!CONTACT.some((n) => val(n))) return shownEl("contact-address");
    return shownEl("save-contact");
  }
  if (step.id === "hours") return shownEl("hours");
  if (step.id === "mail") {
    if (!val("mail-sign") || document.activeElement === qs("mail-sign")) return shownEl("mail-sign");
    return shownEl("save-mail");
  }
  if (qs("staff-name")) return done("staff-name") ? qs("save-staff") : qs("staff-name");
  return qs("add-staff");
}

const ENTRY = new Set(["add-staff", "add-category", "add-service", "add-booking"]);

function spotKey(el: HTMLElement | null) {
  if (!el) return "";
  const name = el.getAttribute("data-tour");
  if (name) return name;
  if (el.tagName === "SUMMARY") return `sum:${(el.textContent ?? "").trim()}`;
  return "";
}

// Closed form: the page only has the + button left. That is behind us, not the next step.
function rewindToEntry(old: HTMLElement | null, next: HTMLElement | null) {
  return Boolean(old && !old.isConnected && ENTRY.has(next?.getAttribute("data-tour") ?? ""));
}

// `at` is the target the ring has already committed to. Copy stays there until the ring moves.
function cue(step: Step, path: string, at: string) {
  if (step.nav) return path === step.path ? "Du bist schon auf der richtigen Seite. Klick auf Weiter." : step.text;
  if (step.id === "staff") {
    if (at === "save-staff") return "Speichern legt die Person an.";
    if (at === "staff-name") return val("staff-name") ? "Passt der Name? Dann klick auf Speichern." : "Trag den Namen der Person ein.";
    return step.text;
  }
  if (step.id === "category") {
    if (at === "save-category") return "Speichern legt die Kategorie an.";
    if (at === "cat-name") return val("cat-name") ? "Passt der Name? Dann klick auf Speichern." : "Trag den Namen der Kategorie ein.";
    return step.text;
  }
  if (step.id === "service") {
    if (at === "svc-name") return "Name, Dauer und Kategorie trägst du selbst ein. Danach Weiter im Formular.";
    if (at === "svc-staff") return "Wähl selbst, wer die Leistung machen darf. Danach Weiter im Formular.";
    if (at === "svc-cross") return "Hier steht Zusammen buchbar. Gleich dazu mehr.";
    return step.text;
  }
  if (step.id === "cross") {
    if (at === "svc-cross") return "Sobald mehrere Leistungen da sind, wählst du hier bis zu drei aus. Das ist Cross-Selling. Speichern legt die Leistung an.";
    if (at === "save-service") return "Weiter bis zum letzten Schritt. Dort steht Zusammen buchbar.";
    return step.text;
  }
  if (step.id === "drag") {
    return at === "chip" ? "Zieh den Termin auf eine andere Uhrzeit oder einen anderen Tag." : step.text;
  }
  if (step.id === "staff-hours") {
    if (at === "edit-staff") return "Klick auf das Zahnrad, um den Mitarbeiter zu bearbeiten.";
    if (at === "staff-custom") return "Haken setzen: eigene Arbeitszeiten statt der Öffnungszeiten.";
    if (at === "staff-shifts") return "Tag anhaken. Die Uhrzeit im Balken per Doppelklick ändern.";
    if (at.startsWith("sum:")) return "Klick auf Farbe & Status. Dort schaltest du Aktiv ein.";
    if (at === "staff-active") return "Aktiv lässt die Person im Kalender und online buchen. Dann Speichern.";
    if (at === "save-staff-edit") return "Speichern übernimmt Zeiten und Status.";
    return step.text;
  }
  if (step.id === "booking") {
    if (at === "save-booking") return "Termin erstellen legt deinen Termin in den Kalender.";
    if (at === "guest-name") return val("guest-name") ? "Passt alles? Dann klick auf Termin erstellen." : "Wähle Datum und Leistung und trag den Gast ein.";
    return step.text;
  }
  if (step.id === "contact") {
    if (at.startsWith("sum:")) return "Klick auf Kontakt, um die Felder aufzuklappen.";
    if (at === "save-contact") return "Speichern übernimmt die Kontaktdaten.";
    if (at.startsWith("contact-")) return "Trag Adresse, Telefon, E-Mail oder Homepage ein.";
    return step.text;
  }
  if (step.id === "hours") {
    if (at.startsWith("sum:")) return "Klick auf Öffnungszeiten.";
    return "Haken auf, Uhrzeit setzen, dann Speichern. Ohne Haken ist der Tag geschlossen.";
  }
  if (step.id === "mail") {
    if (at.startsWith("sum:")) return "Klick auf E-Mail, um den Text aufzuklappen.";
    if (at === "mail-sign") return "Schreib den Text, der am Ende jeder Mail steht.";
    if (at === "save-mail") return "Speichern hängt den Text an jede Mail.";
    return step.text;
  }
  return step.text;
}

function finished(step: Step, boot: Bootstrap, rows: Booking[], base: Base, path: string) {
  if (step.nav) return path === step.path;
  if (step.id === "dashboard" || step.id === "drag" || step.free) return true;
  if (step.id === "staff") return boot.staff.length > base.staff;
  if (step.id === "staff-hours") return qs("staff-saved")?.getAttribute("data-saved") === "1";
  if (step.id === "category") return boot.categories.length > base.cats;
  if (step.id === "service") return slideOf() === "2" || boot.services.length > base.svcs;
  if (step.id === "cross") return boot.services.length > base.svcs;
  if (step.id === "booking") return rows.some((b) => !base.ids.has(b.id) && b.status !== "cancelled");
  if (step.id === "contact") return qs("save-contact")?.getAttribute("data-saved") === "1" && CONTACT.some((n) => val(n));
  if (step.id === "hours") return qs("save-hours")?.getAttribute("data-saved") === "1";
  if (step.id === "mail") return qs("save-mail")?.getAttribute("data-saved") === "1" && val("mail-sign") !== "";
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
  const [at, setAt] = useState("");
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
  const phase = useRef<"wait" | "idle">("wait");
  const since = useRef(0);
  const vis = useRef(false);
  const dimOn = useRef(false);
  const lit = useRef(false);
  const lastEl = useRef<HTMLElement | null>(null);
  const cand = useRef<{ el: HTMLElement | null; at: number }>({ el: null, at: 0 });
  const cardAt = useRef({ x: 0, y: 0, set: false });
  const swapping = useRef(false);
  const shownRef = useRef(0);
  const atRef = useRef("");
  const stepMark = useRef<number | null>(null);
  const unready = useRef(false);
  const jump = useRef(false);
  const entered = useRef(false);

  const step = steps?.[i];
  const view = steps?.[shown];
  const rows = list?.bookings ?? [];
  const readyNow = Boolean(step && boot && base.current && finished(step, boot, rows, base.current, loc.pathname));
  const ctx = useRef({ step, boot, i, path: loc.pathname, ready: readyNow });
  ctx.current = { step, boot, i, path: loc.pathname, ready: readyNow };
  // New step waits at the old spot until its own target exists, then flies once.
  if (steps && stepMark.current !== i) {
    stepMark.current = i;
    phase.current = "wait";
    since.current = 0;
  }

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
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-slide", "data-id", "data-saved", "disabled", "open"] });
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
      // Text swaps in the same breath as the flight, after the target is on screen.
      const commit = (node: HTMLElement | null) => {
        lastEl.current = node;
        const key = spotKey(node);
        const stepI = c.i;
        if (shownRef.current !== stepI) {
          shownRef.current = stepI;
          swapping.current = true;
          setShown(stepI);
        }
        if (atRef.current !== key) {
          atRef.current = key;
          setAt(key);
        }
      };
      const aim = (node: HTMLElement) => {
        node.scrollIntoView({ block: "nearest", inline: "nearest" });
        return rectOf(node);
      };

      if (phase.current === "wait" && (t || free) && since.current && performance.now() - since.current > (quick ? 0 : 32)) {
        phase.current = "idle";
        const aimed = el ? aim(el) : null;
        commit(el);
        if (aimed) {
          show();
          begin(aimed, 0, 0.55);
        } else textsIn(0);
      } else if (phase.current === "idle") {
        let to = t;
        if (t && el) {
          if (!vis.current) {
            show();
            const aimed = aim(el) ?? t;
            begin(aimed, 0, 0.45);
            to = aimed;
            commit(el);
          } else if (el !== lastEl.current) {
            const old = lastEl.current;
            if (cand.current.el !== el) cand.current = { el, at: performance.now() };
            // ponytail: 2s so a save refresh can advance the step before we accept the + button. Abbrechen still returns after that.
            const rewind = rewindToEntry(old, el);
            if (rewind && (c.ready || performance.now() - cand.current.at < (quick ? 0 : 2000))) {
              to = { x: p.x, y: p.y, w: p.w, h: p.h };
            } else if (rewind || !old?.isConnected || performance.now() - cand.current.at > (quick ? 0 : 450)) {
              const aimed = aim(el) ?? t;
              begin(aimed, 0, 0.5);
              to = aimed;
              commit(el);
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
        const k = 1 - Math.exp(-dt / (f.p < 1 ? 45 : 110));
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
        const half = arrow.offsetWidth / 2 || 7;
        const inset = half * (22 / 7);
        if (side === "top" || side === "bottom") {
          arrow.style.left = `${Math.min(Math.max(inset, tcx - a.x), w - inset) - half}px`;
          arrow.style.top = side === "top" ? `${-half}px` : `${h - half}px`;
        } else if (side) {
          arrow.style.top = `${Math.min(Math.max(inset, tcy - a.y), h - inset) - half}px`;
          arrow.style.left = side === "left" ? `${-half}px` : `${w - half}px`;
        }
      }
    };
    gsap.ticker.add(fn);
    return () => {
      gsap.ticker.remove(fn);
      gsap.killTweensOf([fly.current, ringRef.current, cardRef.current, dimRef.current]);
    };
  }, []);

  const sawText = useRef(false);
  useLayoutEffect(() => {
    if (!sawText.current) {
      sawText.current = true;
      return;
    }
    textsIn(0);
  }, [shown]);

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

  const ready = readyNow;
  if (!ready) unready.current = true;

  // Done: a short green beat, then the tour moves on by itself.
  useEffect(() => {
    if (!ready || !step || step.id === "dashboard" || step.id === "drag" || step.free || !unready.current || jump.current) return;
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

  const hint = view ? cue(view, loc.pathname, at) : "";
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
    const call = gsap.delayedCall(reduced() ? 0 : 0.45, () => nextRef.current?.focus());
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
