import { bookWindow, clip, hashToken, inIntRange, limited, mailFromAddr, passwordOk, platformAdminEmail, resetLimits, sbConfigured, securityHeaders, seedAllowed, serviceMins, siteOrigin } from "./guard.ts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

resetLimits();
assert(!limited("a", 2), "first");
assert(!limited("a", 2), "second");
assert(limited("a", 2), "third trips");
assert(!limited("b", 2), "other key independent");

assert(serviceMins(45, 0)?.durationMin === 45, "ok service");
assert(serviceMins(45, undefined)?.bufferMin === 0, "buffer default");
assert(serviceMins(4, 0) === null, "duration too small");
assert(serviceMins(481, 0) === null, "duration too big");
assert(serviceMins(45, -1) === null, "buffer neg");
assert(serviceMins(45, 121) === null, "buffer too big");
assert(serviceMins(45.5, 0) === null, "duration float");
assert(inIntRange(5, 5, 480) && !inIntRange(4, 5, 480), "range");

const w = bookWindow("Europe/Berlin", new Date("2026-09-17T10:00:00+02:00"));
assert(w.to.diff(w.from, "days").days > 13.9, "14 day horizon");

assert(clip("  ab  ", 80) === "ab", "clip trim");
assert(clip("x".repeat(90), 80).length === 80, "clip max");
assert(hashToken("a") === hashToken("a") && hashToken("a") !== hashToken("b"), "token hash");
assert(hashToken("a").length === 64, "sha256 hex");
assert(securityHeaders("/login")["Content-Security-Policy"] === "frame-ancestors 'self'", "csp app");
assert(securityHeaders("/b/salon")["Content-Security-Policy"] === "frame-ancestors *", "csp book");

const prevOrigin = process.env.PUBLIC_ORIGIN;
const prevEnv = process.env.NODE_ENV;
const prevVercelUrl = process.env.VERCEL_URL;
delete process.env.PUBLIC_ORIGIN;
delete process.env.VERCEL_URL;
process.env.NODE_ENV = "production";
assert(siteOrigin("https://evil.example/") === null, "prod origin required");
process.env.VERCEL_URL = "flh-kalender.vercel.app";
assert(siteOrigin("https://evil.example/") === "https://flh-kalender.vercel.app", "vercel url fallback");
delete process.env.VERCEL_URL;
process.env.NODE_ENV = prevEnv || "development";
if (prevVercelUrl) process.env.VERCEL_URL = prevVercelUrl;
else delete process.env.VERCEL_URL;
if (prevOrigin) process.env.PUBLIC_ORIGIN = prevOrigin;
else delete process.env.PUBLIC_ORIGIN;
process.env.PUBLIC_ORIGIN = "https://book.example";
assert(siteOrigin("https://evil.example/") === "https://book.example", "env origin wins");
if (prevOrigin) process.env.PUBLIC_ORIGIN = prevOrigin;
else delete process.env.PUBLIC_ORIGIN;

assert(passwordOk("Test1234!") && !passwordOk("short") && !passwordOk("x".repeat(201)), "password policy");
assert(seedAllowed({ NODE_ENV: "development" }), "seed local");
assert(!seedAllowed({ NODE_ENV: "production" }), "no seed prod");
assert(!seedAllowed({ NODE_ENV: "development", DATABASE_URL: "postgres://x.pooler.supabase.com/db" }), "no seed supabase");
assert(mailFromAddr("onboarding@resend.dev") === null, "no resend");
assert(mailFromAddr("") === null, "empty from");
assert(mailFromAddr("Buchung <mail@flh.digital>") === "Buchung <mail@flh.digital>", "mail from header");
assert(!sbConfigured({}), "sb off");
assert(sbConfigured({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k" }), "sb on");
assert(platformAdminEmail({}) === "mail@flh-mediadigital.de", "admin default");
assert(platformAdminEmail({ AUTH_ADMIN_EMAIL: "A@B.de" }) === "a@b.de", "admin env");

console.log("guard.check ok");
