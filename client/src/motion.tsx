import { useRef, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.defaults({ ease: "power3.out", duration: 0.32 });

export { gsap, useGSAP };

export function reduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function tickSaved() {
  if (reduced()) return;
  const el = document.querySelector(".page-motion, .book");
  if (!el) return;
  gsap.fromTo(el, { filter: "brightness(1.06)" }, { filter: "brightness(1)", duration: 0.45, ease: "power2.out", overwrite: "auto" });
}

export function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (reduced() || !seen.current) {
      seen.current = true;
      gsap.set(el, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      return;
    }
    if (open) {
      // ponytail: height auto for accordion; Flip if layout fights
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.32, ease: "power2.out" });
      return;
    }
    gsap.to(el, { height: 0, opacity: 0, duration: 0.22, ease: "power2.in" });
  }, { dependencies: [open] });
  return <div ref={ref} className="fold">{children}</div>;
}

export function StepPane({ id, children }: { id: string | number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reduced() || !ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" });
  }, { dependencies: [id], scope: ref });
  return <div ref={ref}>{children}</div>;
}

export function PageMotion() {
  const loc = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const root = ref.current;
    if (!root || reduced()) return;
    const bits = root.querySelectorAll(".page-head, .hours-card, .card-table, .staff-card, .stat-row, .admin-grid > *, .cal-wrap, .empty, .panel");
    gsap.fromTo(root, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" });
    if (bits.length) {
      gsap.fromTo(bits, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.045, delay: 0.05, ease: "power3.out" });
    }
  }, { scope: ref, dependencies: [loc.pathname] });
  return (
    <div className="page-motion" ref={ref} key={loc.pathname}>
      <Outlet />
    </div>
  );
}
