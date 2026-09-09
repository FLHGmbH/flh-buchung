import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { hashPassword } from "./auth.ts";
import { db } from "./db.ts";
import { bookings, memberships, openingHours, serviceStaff, services, staff, tenants, users } from "./schema.ts";

export async function seedIfEmpty() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;
  await seed();
  console.log("Seed: admin@flh.digital / Test1234!  ·  salon@demo.test / Test1234!");
}

export async function seed() {
  const passwordHash = await hashPassword("Test1234!");

  const [admin] = await db
    .insert(users)
    .values({ email: "admin@flh.digital", name: "FLH DIGITAL", passwordHash })
    .returning();
  await db.insert(memberships).values({ userId: admin.id, tenantId: null, role: "platform_admin" });

  const [tenant] = await db
    .insert(tenants)
    .values({ name: "Salon Demo", slug: "salon-demo", timezone: "Europe/Berlin" })
    .returning();

  const [kd] = await db
    .insert(users)
    .values({ email: "salon@demo.test", name: "Mira Demo", passwordHash })
    .returning();
  await db.insert(memberships).values({ userId: kd.id, tenantId: tenant.id, role: "tenant_admin" });

  const [anna] = await db.insert(staff).values({ tenantId: tenant.id, name: "Anna Berger", sort: 0 }).returning();
  const [ben] = await db.insert(staff).values({ tenantId: tenant.id, name: "Ben Krüger", sort: 1 }).returning();

  const [cut] = await db
    .insert(services)
    .values({ tenantId: tenant.id, name: "Haarschnitt", durationMin: 45, bufferMin: 0 })
    .returning();
  const [color] = await db
    .insert(services)
    .values({ tenantId: tenant.id, name: "Farbe", durationMin: 90, bufferMin: 15 })
    .returning();
  await db.insert(serviceStaff).values([
    { serviceId: cut.id, staffId: anna.id },
    { serviceId: cut.id, staffId: ben.id },
    { serviceId: color.id, staffId: anna.id },
  ]);

  await db.insert(openingHours).values([
    ...[1, 2, 3, 4, 5].map((weekday) => ({ tenantId: tenant.id, weekday, startHm: "09:00", endHm: "18:00" })),
    { tenantId: tenant.id, weekday: 6, startHm: "09:00", endHm: "14:00" },
  ]);

  const zone = tenant.timezone;
  let day = DateTime.now().setZone(zone);
  if (day.weekday === 7) day = day.plus({ days: 1 });
  const start = day.set({ hour: 11, minute: 0, second: 0, millisecond: 0 });
  await db.insert(bookings).values({
    tenantId: tenant.id,
    staffId: anna.id,
    serviceId: cut.id,
    startsAt: start.toJSDate(),
    endsAt: start.plus({ minutes: 45 }).toJSDate(),
    guestName: "Lea Hoffmann",
    guestEmail: "lea@example.test",
    guestPhone: "0170 000000",
    note: "",
  });
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const { migrate } = await import("./db.ts");
  await migrate();
  const [u] = await db.select().from(users).where(eq(users.email, "admin@flh.digital")).limit(1);
  if (!u) await seed();
  else console.log("Schon gesät.");
  process.exit(0);
}
