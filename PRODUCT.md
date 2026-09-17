# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript. Hosting: Vercel. Datenbank: Supabase Postgres. Öffentliche Buchung wird als iframe in FLH-Kunden-Homepages eingebettet.

## Users

- **Mandanten-Admin (KD):** Inhaber oder Leitung eines Betriebs, für den FLH eine Homepage baut. Kommt aus dem Alltag (Termine, Personal, Urlaub), nicht aus der Software. Job: Kalender führen, Mitarbeiter und Sperren pflegen, alle Buchungen sehen.
- **FLH-Admin:** FLH DIGITAL intern. Job: Mandanten anlegen, betreuen und das iframe-Snippet je Mandant holen, um es in die Kunden-HP einzubauen.
- **Endkunde des KD:** Gast ohne Account. Job: auf der Kunden-HP einen freien Termin buchen.

Mitarbeiter des KD sind im MVP buchbare Ressourcen, kein eigener Login. Der KD-Admin legt Urlaub und andere Sperren für sie fest.

## Product Purpose

Wiederverwendbares Terminbuchungs-Tool für FLH-Kundenwebsites. Ein Mandant = ein Betrieb. Der Mandant steuert Verfügbarkeit; Gäste sehen nur freie Slots und buchen über ein iframe auf der HP. Erfolg: FLH kann jeden neuen KD mit Account + iframe onboarden, ohne das Produkt neu zu bauen; Gäste können keinen belegten Slot wählen.

## Positioning

Kein generischer Kalender und kein öffentliches Buchungs-SaaS. Das Produkt sitzt in der FLH-Lieferkette: Homepage bauen, Mandant anlegen, iframe einsetzen. Verfügbarkeit (Öffnungszeiten minus Sperren minus bestehende Termine) ist die harte Kante.

## Operating Context

FLH erstellt React/Vite-Homepages für Kunden und setzt dort ein iframe auf die öffentliche Buchungsseite (`/b/{tenant-slug}`). KD und FLH teilen eine Login-Seite; die Rolle entscheidet, ob das KD-Dashboard oder das FLH-Admin-Panel erscheint. Betrieb läuft im Browser, Hosting Vercel (Frankfurt), Datenbank Supabase.

## Capabilities and Constraints

**Kann:**

- FLH legt Mandanten an und erhält das iframe-Embed je Mandant.
- KD-Admin: Kalender, Mitarbeiter (Ressourcen), Urlaub/Sperren, Leistungen, Öffnungszeiten, alle Termine.
- Gast im iframe: Leistung, optional Mitarbeiter, nur freie Tage/Slots, Kontaktdaten, Bestätigung.
- Eine gemeinsame Login-Seite, rollenbasiert weiter.

**Nicht im MVP:** Mitarbeiter-Login, Endkunden-Accounts, Zahlung, Kalender-Sync, Erinnerungsmails, Gast-Storno, mehrere Standorte, Custom Domain pro Mandant.

**Storno:** nur durch den KD-Admin. Der Gast bestätigt per PIN und hat danach keinen Storno-Weg.

**Begriffe:** Mandant = FLH-Kunde/Betrieb. Staff = Mitarbeiter-Ressource. Gast = Endkunde ohne Login. Slot = freies Buchungsraster.

## Brand Commitments

Name und Identität: **FLH DIGITAL**. Verbindliches CI aus dem Markenleitfaden (Anhang): Logo mit Hexagon-Mark und Wortmarke „FLH DIGITAL“, Primärfarben Petrol / Graphite / Amber, Hausschrift Apparat (Light, Regular, Bold), Systemschrift Segoe UI für Office-Dokumente. Gilt für Login, KD-Dashboard, FLH-Admin und das Buchungs-iframe. Keine fremde Markenwelt, kein Calendly-/SaaS-Klischee als Ersatz-CI.

## Evidence on Hand

- CI-Seiten: Logo-Varianten, Farbtafel (Petrol `#006478`, Graphite `#253239`, Amber `#FF9600` plus Rasterwerte), Schrifttafel Apparat / Segoe UI. Dateien im Workspace unter den angehängten CI-Bildern.
- Keine echten Mandantendaten, keine Testimonial-Zitate, keine Screenshots eines bestehenden Buchungstools. Folgearbeit darf keine erfundenen Kundenstimmen oder Kennzahlen als Beweis verwenden.

## Product Principles

1. Ein Produkt, drei Rollen, eine Login-Tür — nicht drei Apps.
2. Gäste sehen nur, was buchbar ist; der Mandant sieht die volle Belegung.
3. FLH onboardet Mandanten und baut das iframe in die HP; der KD betreibt den Kalender.
4. Die App läuft auf Vercel, die Daten liegen in Supabase — nicht auf Render.
5. CI von FLH DIGITAL ist die Identität, nicht ein Theme-Schalter.

## Accessibility & Inclusion

Keine gesonderte Zertifizierungsvorgabe erfasst. Oberfläche deutsch. Mindeststandard für Folgearbeit: tastaturbedienbar, sichtbarer Fokus, Kontrast der CI-Volltöne gegen Weiß/Graphite prüfen (Amber als Fläche auf Weiß ist grenzwertig).
