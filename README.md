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
- FLH: `admin@flh.digital` / `Test1234!`
- KD: `salon@demo.test` / `Test1234!`
- iframe-Demo: http://localhost:5173/b/salon-demo

## Vercel

`PUBLIC_ORIGIN` auf die Vercel-URL setzen (iframe-Snippets). `DATABASE_URL` = Supabase Transaction-Pooler (IPv4, Port 6543), User `flh_app.<PROJECT_REF>`.
