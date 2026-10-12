# FLH Buchung

Online-Terminbuchung für die Websites von FLH-Kunden. Der Gast bucht im Fenster auf der Salon-Homepage, ohne Konto. Der Betrieb sieht den Termin sofort im eigenen Kalender und kann ihn dort pflegen. FLH legt die Betriebe an und setzt das Buchungsfenster auf die jeweilige Website.

Ein Betrieb, ein Buchungsfenster, ein Login für den Betrieb. Die Termine gehören nur diesem Betrieb.

## Für wen

**Gast.** Bucht eine Leistung auf der Website des Salons. Braucht kein Konto.

**Betrieb.** Pflegt Leistungen, Mitarbeiter und Zeiten. Sieht den Kalender, legt Termine selbst an und wertet aus, was gebucht wird.

**FLH.** Legt Betriebe an, gibt dem Betrieb seinen Login, sperrt oder aktiviert einen Betrieb und setzt das Buchungsfenster auf die Kundenwebsite.

## Was der Gast macht

Die Buchung läuft in kurzen Schritten:

1. Leistung wählen, nach Kategorie. Mehrere Leistungen können in einem Termin hintereinander liegen. Dauer, Preis und weitere Infos stehen bei der Leistung.
2. Wunschperson wählen, oder „Egal“. Es erscheinen nur Personen, die diese Leistung machen und in den nächsten Tagen frei sind.
3. Tag wählen, innerhalb der nächsten 14 Tage. Belegte und geschlossene Tage sind nicht wählbar.
4. Optional eine passende Zusatzleistung im selben Termin dazunehmen, wenn der Betrieb das so hinterlegt hat. Der Gast kann sie auch weglassen.
5. Uhrzeit wählen. Beginn und Ende der einzelnen Leistungen werden angezeigt.
6. Name, E-Mail, Telefon und eine optionale Notiz angeben und der Datenschutzerklärung zustimmen. Preise sind eine Orientierung und können abweichen. Der Termin ist unverbindlich.
7. Den 6-stelligen Code aus der Mail eingeben. Der Code gilt 15 Minuten. Erst danach ist der Termin bestätigt.

Danach sieht der Gast die Bestätigung und eine kurze Buchungsnummer. Per Mail kommt die Bestätigung mit einer Kalenderdatei (`termin.ics`).

Online buchbar sind nur Zeiten, die wirklich frei sind: Öffnungszeiten, Arbeitszeit der Person, Dauer plus Nachbearbeitung, bereits gebuchte Termine und Abwesenheiten. Derselbe Zeitraum bei derselben Person kann nicht zweimal vergeben werden. Termine in den nächsten zwei Stunden sind online nicht buchbar. Wer einmal als „nicht erschienen“ markiert wurde, kann mit derselben E-Mail oder Telefonnummer nicht erneut online buchen.

Der Gast kann den Termin nicht selbst verschieben oder absagen. Das macht der Betrieb.

## Was der Betrieb kann

Nach dem Login sieht der Betrieb seinen eigenen Salon.

**Kalender.** Tag, Woche und Monat. Termine liegen farblich bei der Leistung. Ein Klick öffnet den Termin, ein freier Bereich legt einen neuen an.

**Termine.** Liste aller Buchungen, durchsuchbar nach Name, E-Mail oder Telefon. Status: Code noch offen, bestätigt, storniert, nicht erschienen. Neue Termine kann der Betrieb auch selbst anlegen, inklusive weiterer Leistungen direkt im Anschluss, jeweils mit passender Person.

**Verschieben, stornieren, No-Show.** Ein bestätigter Termin lässt sich im Kalender auf eine andere Zeit, Person oder Leistung legen. Der Gast bekommt eine Mail mit bisheriger und neuer Zeit. Beim Stornieren wird die Zeit wieder frei und der Gast bekommt eine Absage-Mail, wenn eine E-Mail hinterlegt ist. „Nicht erschienen“ lässt den Termin sichtbar, gibt die Uhrzeit aber frei. „Doch gekommen“ hebt die Markierung wieder auf.

**Live-Hinweis.** Kommt eine neue Online-Buchung, während der Betrieb eingeloggt ist, erscheint ein kurzer Hinweis mit Name, Leistung, Person und Zeit.

**Mitarbeiter.** Name, Foto, Farbe im Kalender, aktiv oder inaktiv. Eigene Arbeitszeiten pro Wochentag, oder die Öffnungszeiten des Betriebs. Anstehende Abwesenheit steht auf der Karte, die nächsten Termine der Person darunter.

**Sperren.** Urlaub, Krankheit oder eine andere Sperre für eine Person und einen Zeitraum. Liegen in der Zeit schon Termine, müssen die zuerst auf einen anderen Tag, eine andere Uhrzeit, eine andere Leistung oder eine andere Person gelegt werden. Erst dann gilt die Sperre.

**Leistungen.** Kategorien, zum Beispiel Frauenhaarschnitt. Pro Leistung: Name, Dauer, Nachbearbeitung, welche Personen sie machen dürfen, optional ein Infotext, aktiv oder inaktiv. Preis als Festpreis, „ab“, Spanne oder ohne Preis. Eine Leistung kann mit genau einer anderen zusammen angeboten werden; die erscheint dem Gast als optionale Ergänzung. Beim Anlegen schlägt eine Vorlagenliste gängige Salonleistungen mit üblicher Dauer vor. Der Betrieb übernimmt den Vorschlag und kann ihn ändern.

**Unternehmen.** Öffnungszeiten pro Wochentag. Logo oben im Buchungsfenster. Text und Bild am Ende jeder Mail an Gäste.

**Dashboard.** Für den laufenden Monat: Umsatz, Anzahl Termine, Buchungen insgesamt, Kunden insgesamt, jeweils im Vergleich zum Vormonat. Dazu Umsatz nach Monat, beliebteste Leistungen, Buchungen nach Herkunft (Kalender oder Buchungsseite) und nach Wochentag. Stornierte Termine zählen nicht. Umsatz kommt nur aus Leistungen, für die ein Preis hinterlegt ist.

## Was FLH kann

**Mandanten.** Liste aller Betriebe, Suche nach Name, aktiv oder gesperrt. Einen Betrieb sperren heißt: das Buchungsfenster und der Login des Betriebs sind aus.

**Neuer Betrieb.** Name, Adresse des Buchungsfensters und der Login für den Betrieb (Name, E-Mail, Passwort). Das Passwort lässt sich später neu setzen.

**Website.** Pro Betrieb gibt es die Buchungsadresse und ein Snippet für die Homepage. FLH kopiert das Snippet auf die Kundenwebsite. In der Verwaltung ist eine Vorschau des Buchungsfensters.

**Dashboard über alle Betriebe.** Aktive und gesperrte Mandanten, Termine heute, Termine und Umsatz im Monat, Buchungen über das Jahr. Eine Nachschau-Liste zeigt Betriebe, die gesperrt sind, noch unvollständig eingerichtet sind oder seit 45 Tagen keine Buchung hatten.

## Was bei einer Buchung passiert

Der Gast wählt eine freie Zeit. Die Zeit bleibt für die Dauer des Codes reserviert, damit niemand dieselbe Lücke parallel bestätigt. Läuft der Code ab, ohne eingegeben zu werden, fällt die Reservierung weg.

Mit dem richtigen Code ist der Termin bestätigt. Der Betrieb sieht ihn im Kalender und in der Terminliste. Der Gast hat die Bestätigung und die Kalenderdatei in der Mail.

Verschiebt oder storniert der Betrieb den Termin, geht eine neue Mail raus. Der Kalender und die Mails zeigen denselben Stand.

## Was dieses Produkt nicht ist

Keine Bezahlung, keine Anzahlung, kein Gästekonto und keine Termin-Historie für den Gast. Keine Erinnerung vor dem Termin, keine Warteliste, keine Familienbuchung und kein salonübergreifendes Portal. Absage und Umbuchung laufen über den Betrieb, nicht über den Gast.
