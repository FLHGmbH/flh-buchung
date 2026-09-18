# FLH DIGITAL Buchung

Terminbuchung für FLH-Kunden-Homepages. Eine App, eine Login-Seite, iframe unter `/b/{slug}`.

Hosting: **Vercel**. Datenbank: **Supabase Postgres**.

## Lokal

Ohne `DATABASE_URL`: PGlite-Datei in `data/pg`. Mit URL: dieselbe Supabase-DB wie live.

```
copy .env.example .env
npm install
npm run check:slots
npm run dev
```

- App: http://localhost:5173
- Lokal ohne Supabase-Auth: FLH `admin@flh.digital` / `Test1234!`, KD `salon@demo.test` / `Test1234!` (nur PGlite)
- Live: Login über Supabase Auth. FLH `mail@flh-mediadigital.de`. Neuer Mandant legt den KD-Login in Auth mit an (`SUPABASE_SERVICE_ROLE_KEY`).
- Passwort-Reset: Auth → URL Configuration. Site URL `https://flh-kalender.vercel.app`. Redirect URLs: `https://flh-kalender.vercel.app/reset` und `https://flh-kalender.vercel.app/**`.
- iframe-Demo: http://localhost:5173/b/salon-demo

## Vercel

`PUBLIC_ORIGIN` auf die Vercel-URL setzen (iframe-Snippets). `DATABASE_URL` = Supabase Transaction-Pooler (IPv4, Port 6543). PIN-Mails: Mittwald SMTP (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`, `MAIL_FROM` = Postfachadresse). Login: `SUPABASE_URL` + `SUPABASE_ANON_KEY`, Mandanten anlegen braucht `SUPABASE_SERVICE_ROLE_KEY`. FLH-Admin `AUTH_ADMIN_EMAIL`.
