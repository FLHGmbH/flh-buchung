# FLH Kalender

Online-Terminbuchung für die Websites von FLH-Kunden. Der Gast bucht im Fenster auf der Salon-Homepage, ohne eigenes Konto. Der Betrieb pflegt Kalender, Leistungen und Mitarbeiter. FLH legt die Betriebe an und setzt das Buchungsfenster auf die Kundenwebsite.

Live: [flh-kalender.vercel.app](https://flh-kalender.vercel.app)

## Wo was liegt

```text
GitHub          Code
   │
   ▼
Vercel          App + API  (Hosting)
   │
   ├── Supabase     Datenbank + Login
   └── SMTP         Buchungs- und PIN-Mails
```

| Was | Wo |
| --- | --- |
| Code | [github.com/FLHGmbH/flh-buchung](https://github.com/FLHGmbH/flh-buchung) |
| Hosting | [Vercel, Projekt `flh-kalender`](https://vercel.com/flh-kalender-tool/flh-kalender) im Team **flh-kalender-tool** |
| Datenbank und Login | [Supabase, Projekt **FLH Kalender Tool**](https://supabase.com/dashboard/project/vnjmreerwhcfdlocycdh) |
| Oberfläche | `client/` — React, Vite |
| API | `server/` — Hono, auf Vercel unter `api/` |
| Buchungsfenster | `/b/{slug}` (iframe auf der Kundenwebsite) |
| Betrieb | `/app` nach dem Login |
| FLH | `/admin` nach dem Login |

## Stack

| Schicht | Technik |
| --- | --- |
| Frontend | React, Vite, React Router |
| API | Hono auf Node, Deploy über Vercel |
| Datenbank | Supabase Postgres |
| Auth | Supabase Auth |
| Mails | SMTP (PIN, Bestätigung, Absage) |

Lokal ohne `DATABASE_URL` läuft eine Datei-Datenbank (PGlite) in `data/pg`. Mit URL dieselbe Supabase-Datenbank wie live. Setup und Env-Variablen stehen in `README.md`.

## Was es kann

**Gast.** Leistung, Person, Tag und Uhrzeit wählen, Kontaktdaten angeben, 6-stelligen Code aus der Mail eingeben. Danach ist der Termin bestätigt.

**Betrieb.** Eigenen Kalender sehen, Termine anlegen, verschieben, stornieren oder als nicht erschienen markieren. Mitarbeiter, Sperren, Leistungen und Öffnungszeiten pflegen.

**FLH.** Betriebe anlegen, sperren oder freigeben und das Snippet für die Kundenwebsite kopieren. Salon-Logins legt die App beim Anlegen des Betriebs in Supabase Auth mit an.

## Neuen FLH-User anlegen

FLH-Zugänge werden im Supabase-Projekt **FLH Kalender Tool** angelegt, nicht in der App.

1. [Supabase-Projekt öffnen](https://supabase.com/dashboard/project/vnjmreerwhcfdlocycdh)
2. **Authentication → Users → Add user**
3. FLH-E-Mail und das Standard-Passwort eintragen, User anlegen
4. Beim neuen User **Passwort-Reset** auslösen, damit die Person die Mail bekommt und das Passwort selbst setzt

Die Reset-Mail läuft über die Auth-URL-Konfiguration. Site URL ist `https://flh-kalender.vercel.app`, Redirects gehen auf `/reset`.
