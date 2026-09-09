# FLH DIGITAL Buchung

Terminbuchung für FLH-Kunden-Homepages. Eine App, eine Login-Seite, iframe unter `/b/{slug}`.

## Lokal

Ohne Docker: PGlite-Datei in `data/pg` (automatisch).

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

## Render

Blueprint `render.yaml`: Web Service Free + Postgres Free (Frankfurt). `PUBLIC_ORIGIN` auf die `onrender.com`-URL setzen, damit die iframe-Snippets stimmen. Free-Postgres läuft 30 Tage — nur zum Testen.

Nach dem ersten Start ist der Seed automatisch da, wenn die User-Tabelle leer ist.
