export type Actor = {
  id: string;
  email: string;
  name: string;
  role: "platform_admin" | "tenant_admin";
  tenantId: string | null;
  tenantName: string | null;
};

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

export const api = {
  me: () => req<{ actor: Actor | null }>("/api/me"),
  login: (email: string, password: string) =>
    req<{ actor: Actor }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => req("/api/auth/logout", { method: "POST" }),
  tenants: () => req<{ tenants: TenantRow[] }>("/api/admin/tenants"),
  tenant: (id: string) => req<{ tenant: TenantRow; admins: { id: string; email: string; name: string }[]; bookUrl: string; iframe: string }>(`/api/admin/tenants/${id}`),
  createTenant: (body: object) => req("/api/admin/tenants", { method: "POST", body: JSON.stringify(body) }),
  patchTenant: (id: string, body: object) =>
    req(`/api/admin/tenants/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  bootstrap: () => req<Bootstrap>("/api/app/bootstrap"),
  day: (date: string) => req<DayPayload>(`/api/app/day?date=${date}`),
  addStaff: (name: string) => req("/api/app/staff", { method: "POST", body: JSON.stringify({ name }) }),
  patchStaff: (id: string, body: object) => req(`/api/app/staff/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addService: (body: object) => req("/api/app/services", { method: "POST", body: JSON.stringify(body) }),
  patchService: (id: string, body: object) => req(`/api/app/services/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  putHours: (hours: object[]) => req("/api/app/hours", { method: "PUT", body: JSON.stringify({ hours }) }),
  timeOff: () => req<{ timeOff: TimeOff[] }>("/api/app/time-off"),
  addTimeOff: (body: object) => req("/api/app/time-off", { method: "POST", body: JSON.stringify(body) }),
  delTimeOff: (id: string) => req(`/api/app/time-off/${id}`, { method: "DELETE" }),
  bookings: () => req<{ bookings: Booking[] }>("/api/app/bookings"),
  addBooking: (body: object) => req("/api/app/bookings", { method: "POST", body: JSON.stringify(body) }),
  cancelBooking: (id: string) => req(`/api/app/bookings/${id}/cancel`, { method: "POST" }),
  pub: (slug: string) => req<Pub>(`/api/public/${slug}`),
  slots: (slug: string, serviceId: string, staffId?: string) =>
    req<{ slots: { start: string; end: string; staffId: string }[] }>(
      `/api/public/${slug}/slots?serviceId=${serviceId}${staffId ? `&staffId=${staffId}` : ""}`,
    ),
  book: (slug: string, body: object) => req(`/api/public/${slug}/book`, { method: "POST", body: JSON.stringify(body) }),
  confirm: (slug: string, id: string, pin: string) =>
    req<{ booking: { id: string; startsAt: string } }>(`/api/public/${slug}/bookings/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),
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
