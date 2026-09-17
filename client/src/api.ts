import { useEffect, useState } from "react";

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: "platform_admin" | "tenant_admin";
  tenantId: string | null;
  tenantName: string | null;
};

const mem = new Map<string, unknown>();
const wait = new Map<string, Promise<unknown>>();
const subs = new Set<() => void>();

function bump() {
  for (const fn of subs) fn();
}

export function peek<T>(path: string): T | null {
  return (mem.get(path) as T) ?? null;
}

function inflight<T>(path: string): Promise<T> {
  const w = wait.get(path);
  if (w) return w as Promise<T>;
  const p = req<T>(path).then(
    (d) => {
      mem.set(path, d);
      wait.delete(path);
      return d;
    },
    (e) => {
      wait.delete(path);
      throw e;
    },
  );
  wait.set(path, p);
  return p;
}

export function load<T>(path: string, set: (d: T) => void) {
  const hit = peek<T>(path);
  if (hit) set(hit);
  return inflight<T>(path).then(set);
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(() => (path ? peek<T>(path) : null));
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  useEffect(() => {
    if (!path) return;
    let on = true;
    load<T>(path, (d) => {
      if (on) setData(d);
    });
    return () => {
      on = false;
    };
  }, [path, tick]);
  return data;
}

function bust(prefix: string) {
  for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k);
  for (const k of [...wait.keys()]) if (k.startsWith(prefix)) wait.delete(k);
  bump();
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

async function mutate<T>(path: string, init: RequestInit, prefix = "/api/app"): Promise<T> {
  const r = await req<T>(path, init);
  bust(prefix);
  return r;
}

export const api = {
  me: () => inflight<{ actor: Actor | null }>("/api/me"),
  login: async (email: string, password: string) => {
    const r = await req<{ actor: Actor }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    mem.set("/api/me", { actor: r.actor });
    return r;
  },
  logout: async () => {
    await req("/api/auth/logout", { method: "POST" });
    mem.clear();
    wait.clear();
    bump();
  },
  tenants: () => inflight<{ tenants: TenantRow[] }>("/api/admin/tenants"),
  tenant: (id: string) => inflight<{ tenant: TenantRow; admins: { id: string; email: string; name: string }[]; bookUrl: string; iframe: string }>(`/api/admin/tenants/${id}`),
  createTenant: (body: object) => mutate("/api/admin/tenants", { method: "POST", body: JSON.stringify(body) }, "/api/admin"),
  patchTenant: (id: string, body: object) =>
    mutate(`/api/admin/tenants/${id}`, { method: "PATCH", body: JSON.stringify(body) }, "/api/admin"),
  bootstrap: () => inflight<Bootstrap>("/api/app/bootstrap"),
  day: (date: string) => inflight<DayPayload>(`/api/app/day?date=${date}`),
  addStaff: (name: string) => mutate("/api/app/staff", { method: "POST", body: JSON.stringify({ name }) }),
  patchStaff: (id: string, body: object) => mutate(`/api/app/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addService: (body: object) => mutate("/api/app/services", { method: "POST", body: JSON.stringify(body) }),
  patchService: (id: string, body: object) => mutate(`/api/app/services/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  putHours: (hours: object[]) => mutate("/api/app/hours", { method: "PUT", body: JSON.stringify({ hours }) }),
  timeOff: () => inflight<{ timeOff: TimeOff[] }>("/api/app/time-off"),
  addTimeOff: (body: object) => mutate("/api/app/time-off", { method: "POST", body: JSON.stringify(body) }),
  delTimeOff: (id: string) => mutate(`/api/app/time-off/${id}`, { method: "DELETE" }),
  bookings: () => inflight<{ bookings: Booking[] }>("/api/app/bookings"),
  addBooking: (body: object) => mutate("/api/app/bookings", { method: "POST", body: JSON.stringify(body) }),
  cancelBooking: (id: string) => mutate(`/api/app/bookings/${id}/cancel`, { method: "POST" }),
  pub: (slug: string) => inflight<Pub>(`/api/public/${slug}`),
  slots: (slug: string, serviceId: string, staffId?: string) =>
    inflight<{ slots: { start: string; end: string; staffId: string }[] }>(
      `/api/public/${slug}/slots?serviceId=${serviceId}${staffId ? `&staffId=${staffId}` : ""}`,
    ),
  book: (slug: string, body: object) => req(`/api/public/${slug}/book`, { method: "POST", body: JSON.stringify(body) }),
  confirm: (slug: string, id: string, pin: string) =>
    req<{ booking: { id: string; startsAt: string } }>(`/api/public/${slug}/bookings/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),
  prefetch(to: string) {
    if (to === "/app") {
      inflight("/api/app/bootstrap");
      const d = new Date();
      const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      inflight(`/api/app/day?date=${z.toISOString().slice(0, 10)}`);
    } else if (to === "/app/termine") {
      inflight("/api/app/bootstrap");
      inflight("/api/app/bookings");
    } else if (to === "/app/sperren") {
      inflight("/api/app/bootstrap");
      inflight("/api/app/time-off");
    } else if (to.startsWith("/app")) inflight("/api/app/bootstrap");
    else if (to === "/admin") inflight("/api/admin/tenants");
  },
};

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  bookUrl?: string;
  iframe?: string;
};

export type Staff = { id: string; name: string; active: boolean };
export type Service = { id: string; name: string; durationMin: number; bufferMin: number; active: boolean; staffIds: string[] };
export type Booking = {
  id: string;
  staffId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  note: string;
  status: string;
};
export type TimeOff = { id: string; staffId: string; startsAt: string; endsAt: string; reason: string };
export type Bootstrap = {
  tenant: { id: string; name: string; timezone: string };
  staff: Staff[];
  services: Service[];
  hours: { weekday: number; startHm: string; endHm: string }[];
};
export type DayPayload = {
  date: string;
  timezone: string;
  staff: Staff[];
  services: Service[];
  bookings: Booking[];
  timeOff: TimeOff[];
};
export type Pub = {
  tenant: { name: string; slug: string; timezone: string };
  staff: { id: string; name: string }[];
  services: { id: string; name: string; durationMin: number; staffIds: string[] }[];
};
