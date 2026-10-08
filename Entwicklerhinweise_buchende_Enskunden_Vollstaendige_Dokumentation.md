Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

# Entwicklerhinweise aus den Kundeninterviews K1 bis K6 

### _Vollständige Dokumentation aus den Notizen der sechs Interview Napkins_ 

Die Entwicklerhinweise der sechs Buchendenrollen ergeben einen gemeinsamen Funktionskern für das Onlinebuchungstool auf Salonwebsites. Leistungen und Preise müssen verständlich sein, freie Zeiten zur tatsächlichen Kapazität passen, Zusagen eindeutig sein und Änderungen den gültigen Terminbestand zuverlässig erhalten. Wiederbuchung, Beratung und Familienkoordination erfordern zusätzliche Abläufe, deren Umfang noch zu prüfen ist. 

Dieses Dokument führt die Hinweise thematisch zusammen und dokumentiert anschließend sämtliche Notizinhalte der sechs Napkin-PowerPoints einschließlich aller 60 Use Cases. Es dient dem Produktreview, der Festlegung salonseitiger Regeln und der Vorbereitung realer Nutzertests. Die begleitende Präsentation verdichtet denselben Stand auf drei Folien. 

### **Umfang und Leseschlüssel** 

**Teil 1** 13 Themen bündeln die wiederkehrenden und besonderen Entwicklerhinweise. Die Kennungen E01 bis E13 verbinden Dokumentation und Präsentation. Prioritäten sind Vorschläge zur Diskussion. 

**Teil 2** Die Notizen aus K1 bis K6 sind vollständig und in ihrer ursprünglichen Reihenfolge wiedergegeben. Alle Funktionen, Entwicklerregeln, prüfbaren Use Cases, Priorisierungshinweise, Quellenbezüge und Validierungsfragen bleiben enthalten. Nur die Formatierung wird vereinheitlicht. 

**Quellenkennungen** K1 bis K3 verwenden innerhalb der Quelle UC01 bis UC10; im Zusammenhang mit dem Rollenkürzel sind sie eindeutig. K4 bis K6 führen die Rolle bereits in der Use-Case-Kennung. I verweist auf Interviewabschnitte; P auf nullbasiert gezählte Word-Absätze einschließlich leerer Absätze. Quellendaten im Originalanhang bleiben unverändert; der aktuelle Auswertungsstand ist 06.10.2026. 

### **Methodische Einordnung** 

Alle sechs Interviews sind synthetische KI-Interviews mit vorgegebenen Rollen. K1 bis K3 wurden interaktiv im Chat geführt, K4 bis K6 mit einer anderen KI und als Transkripte bereitgestellt. Wiederkehrende Aussagen sind keine unabhängige empirische Bestätigung. Konkrete Konzepte wie Beratung, Rückruf und Familienkonto wurden teilweise durch die Fragen angeregt. Häufigkeit im Markt, Nutzungsbereitschaft, Zahlungsbereitschaft, Zeitersparnis und Wirkung auf No-shows lassen sich daraus nicht quantifizieren. 

Interviewhinweis, gewünschte Funktion und technische Entwicklerableitung werden unterschieden. Beispielsweise ist die sichere zusammenhängende Umbuchung eine technische Ableitung aus dem Wunsch, den alten Termin nicht zu verlieren. Die Quellen enthalten keine verbindliche Gesamt-Roadmap, belastbaren Standard-Behandlungszeiten, Pflichtanzahlung oder neue Gebührensysteme. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 1 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **Teil 1 Zusammenführung für die Entwicklung** 

### **Übersicht der Themen und Quellen** 

|**ID**|**Entwicklungsthema**|**Bezug in den Quellnotizen**|
|---|---|---|
|E01|Leistungen Preise und Dauer verständlich<br>machen|K1 UC03; K2 UC03; K3 UC07; K4 UC02; K5 UC03;<br>K6 UC05|
|E02|Freie Zeiten aus echter Kapazität ableiten|K1 UC02; K2 UC01–UC04; K4 UC01/UC04; K5<br>UC02; K6 UC02|
|E03|Einfach und mobil ohne Kontozwang<br>buchen|K1 UC09; K2 UC06/UC10; K4 UC03; K5 UC04; K6<br>UC01/UC04|
|E04|Buchungsstatus eindeutig und dauerhaft<br>zeigen|K1 UC04; K2 UC05/UC06; K3 UC08/UC10; K4<br>UC05; K5 UC03; K6 UC06|
|E05|Umbuchen Absagen und<br>Leistungsänderungen sicher ausführen|K1 UC05–UC07; K2 UC07; K3 UC10; K4 UC06; K5<br>UC05/UC06; K6 UC08|
|E06|Bestätigungen Erinnerungen und Kontakt<br>aktuell halten|K1 UC06/UC09; K2 UC07/UC08; K4 UC05/UC07;<br>K5 UC07; K6 UC07/UC09|
|E07|Gewohnte Leistungen als geprüfte<br>Vorlage übernehmen|K1 UC01; K5 UC04/UC10; K6 UC03/UC10|
|E08|Unklare Wünsche über Beratung klären|K3 UC01–UC03/UC06–UC10|
|E09|Bilder und Vorinformationen geschützt<br>ergänzen|K3 UC04–UC06/UC09|
|E10|Familientermine gemeinsam planen und<br>verwalten|K5 UC01–UC10|
|E11|Ausfälle und Vertretung mit Entscheidung<br>behandeln|K1 UC08; K2 UC09; K6 UC10|
|E12|Warteliste und passende Alternativen<br>freiwillig anbieten|K1 UC10; K4 UC08; K5 UC09|
|E13|Vertrauen Orientierung und<br>Zusatzangebote begrenzen|K2 UC10; K4 UC01/UC09/UC10|



### **E01 Leistungen Preise und Dauer verständlich machen** 

**Funktionalität** Enthaltene Schritte, Pflichtbestandteile, Kundendauer, Preisart und mögliche Extras vor Abschluss erklären. 

**Entwicklerhinweis** Salon pflegt Katalog und Regeln. Festpreis, Ab-Preis und Spanne unterscheiden. Bekannte Zuschläge und zusätzliche Zeit sichtbar aktualisieren; keine simulierten Minutenwerte als Standard übernehmen. 

**Prüfkriterium** Passende Leistung finden und erklären, was enthalten ist und welche Kosten noch offen sind. 

**Quellen und Einordnung** K1 UC03; K2 UC03; K3 UC07; K4 UC02; K5 UC03; K6 UC05. Kernkandidat. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 2 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **E02 Freie Zeiten aus echter Kapazität ableiten** 

**Funktionalität** Passende Verfügbarkeit früh zeigen. Wunschperson oder Keine Präferenz ermöglichen; Beginn und voraussichtliches Ende nennen. 

**Entwicklerhinweis** Dauer, Qualifikation, Arbeitszeiten, Abwesenheiten, Ressourcen und Mindestvorlauf gemeinsam prüfen. Personwahl beibehalten; keine ungefragte Vertretung. Ein Abschluss belegt genau die benötigte Kapazität. 

**Prüfkriterium** Zwei konkurrierende Abschlüsse können nicht dieselbe Personenkapazität verbindlich erhalten. 

**Quellen und Einordnung** K1 UC02; K2 UC01–UC04; K4 UC01/UC04; K5 UC02; K6 UC02. Kernkandidat. 

### **E03 Einfach und mobil ohne Kontozwang buchen** 

**Funktionalität** Verfügbarkeit vor Kontaktformular; verständliche kurze Schritte, wenige Pflichtangaben, Rücknavigation und Gastbuchung. 

**Entwicklerhinweis** Gastbuchung nicht mit Zugriff auf Historie verwechseln. Persönliche Daten, Vorlagen und Änderungsrechte geschützt zugänglich machen. Konto freiwillig anbieten, Familienkonto nur mit erkennbarem Nutzen. 

**Prüfkriterium** Erste Buchung ohne Registrierung abschließen; keine fremden Buchungen über Namen oder E- Mail allein einsehen. 

**Quellen und Einordnung** K1 UC09; K2 UC06/UC10; K4 UC03; K5 UC04; K6 UC01/UC04. Kernkandidat. 

### **E04 Buchungsstatus eindeutig und dauerhaft zeigen** 

**Funktionalität** Anfrage, Vorschlag, Vormerkung und bestätigten Termin unterscheiden. Vollständige Zusammenfassung, Erfolgsseite und wiederauffindbaren Status bereitstellen. 

**Entwicklerhinweis** Bestätigt erst nach erfolgreicher Speicherung. Buchungs- und Versandstatus trennen. Wiederholung derselben Aktion erzeugt keinen zweiten Termin. Familiengesamtstatus darf keine fehlenden Einzeltermine verdecken. 

**Prüfkriterium** Fehlende E-Mail ändert den bestätigten Termin nicht; bei Slotverlust bleiben Auswahl und Angaben für eine Alternative erhalten. 

**Quellen und Einordnung** K1 UC04; K2 UC05/UC06; K3 UC08/UC10; K4 UC05; K5 UC03; K6 UC06. Kernkandidat. 

### **E05 Umbuchen Absagen und Leistungsänderungen sicher ausführen** 

**Funktionalität** Alte und neue Daten vergleichen; Fristen, Kosten und Änderungsfolgen erklären. Einzeltermin, Familie und abhängige Termine bewusst auswählen. 

**Entwicklerhinweis** Alten Termin bis zum erfolgreichen Wechsel behalten. Bei Fehler nichts unbemerkt verlieren. Fehlende Kapazität von gesperrter Onlinefrist unterscheiden. Zusatzleistung benötigt neue Dauerund Kapazitätsprüfung oder eine klar benannte Anfrage. 

**Prüfkriterium** Bei fehlgeschlagener Änderung bleibt die bisherige Buchung gültig; nicht ausgewählte Familientermine bleiben erhalten. 

**Quellen und Einordnung** K1 UC05–UC07; K2 UC07; K3 UC10; K4 UC06; K5 UC05/UC06; K6 UC08. Kern; Leistungsänderung und Verknüpfung prüfen. 

### **E06 Bestätigungen Erinnerungen und Kontakt aktuell halten** 

**Funktionalität** Termindaten, Kalenderexport und persönliche Hilfe zugänglich machen; Erinnerungen passend zum aktuellen Termin senden. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 3 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis** Alle Kanäle nutzen denselben Bestand. Telefonänderung aktualisiert Onlineansicht und Nachrichten. Nach Absage Erinnerungen stoppen. Kanal und Zeitpunkt konfigurieren; Versandfehler behandeln. Standort und Hilfe klar nennen. 

**Prüfkriterium** Telefonisch verschobener Termin erscheint online korrekt und löst keine Erinnerung an die alte Zeit aus. 

**Quellen und Einordnung** K1 UC06/UC09; K2 UC07/UC08; K4 UC05/UC07; K5 UC07; K6 UC07/UC09. Kernkandidat; Export ergänzend. 

### **E07 Gewohnte Leistungen als geprüfte Vorlage übernehmen** 

**Funktionalität** Wiederbuchung, Wunschperson und gespeicherte Profile können Neueingabe reduzieren. 

**Entwicklerhinweis** Identität geeignet prüfen; alte Leistungen und Preise gegen aktuellen Katalog abgleichen. Neue Zeit bewusst wählen. Routinen und Intervalle nur als Vorschlag, keine automatische Buchung. 

**Prüfkriterium** Aus einer früheren Buchung entsteht erst nach aktueller Prüfung und ausdrücklichem Abschluss ein neuer Termin. 

**Quellen und Einordnung** K1 UC01; K5 UC04/UC10; K6 UC03/UC10. Erweiterung mit hohem Rollenbezug. 

### **E08 Unklare Wünsche über Beratung klären** 

**Funktionalität** Beratung als eigenständigen ersten Schritt anbieten; Rückruf als optionales Format prüfen. Nach Beratung Umfang, Kosten und Etappen erklären. 

**Entwicklerhinweis** Salons definieren Direktbuchbarkeit und Beratungsbedarf. Beratung und Rückruf benötigen echte Zeit und geeignete Personen. Fachliche Bewertung bleibt beim Salon. Vorschlag verpflichtet nicht zur Behandlung; Übergabe im gemeinsamen Fall. 

**Prüfkriterium** Kunde bucht Beratung ohne Fachbegriff; Bestätigung verspricht keine Färbung und kein Ergebnis. 

**Quellen und Einordnung** K3 UC01–UC03/UC06–UC10. Kern für komplexe Wünsche; Rückruf prüfen. 

### **E09 Bilder und Vorinformationen geschützt ergänzen** 

**Funktionalität** Wunschbild, Ist-Zustand und unbekannte Angaben unterscheiden; Bilder optional später ergänzen. 

**Entwicklerhinweis** Dateien einem Salon und Beratungsfall zuordnen; berechtigte Zugriffe, Formate, Fehler, Aufbewahrung und Entfernen regeln. Upload bestätigt Eingang, keine fachliche Sichtung. Buchung bleibt bei Uploadfehler erhalten. 

**Prüfkriterium** Beratung ohne Bild buchen und später ergänzen; anderer Salon erhält keinen Zugriff. 

**Quellen und Einordnung** K3 UC04–UC06/UC09. Erweiterung; Schutz bei Einführung verpflichtend. 

### **E10 Familientermine gemeinsam planen und verwalten** 

**Funktionalität** Mehrere Personen in einem Vorgang, passende Reihenfolge oder Parallelität, gemeinsamer Preis und Aufenthaltsübersicht. 

**Entwicklerhinweis** Buchende, behandelte und begleitende Personen unterscheiden. Betreuung, 

Qualifikationen und Ressourcen je Person prüfen. Gruppe vollständig sichern; Teilbuchung nur mit Zustimmung. Teilen von Informationen und Änderungsrecht trennen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 4 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Prüfkriterium** Einzelne Änderung betrifft nur ausgewählte Personen; Familienbestätigung deckt alle bestätigten Einzeltermine ab. 

**Quellen und Einordnung** K5 UC01–UC10. Eigenes Szenario; Umfang validieren. 

### **E11 Ausfälle und Vertretung mit Entscheidung behandeln** 

**Funktionalität** Bei Ausfall geeignete Ersatzperson oder neue Zeit anbieten; offene Rückmeldungen im Salon verfolgen. 

**Entwicklerhinweis** Originalstatus, Absage, Ersatzangebot und angenommene Alternative konsistent führen. Kein stiller Personenwechsel. Eine manuelle Salonaufgabe kann zunächst die Automatisierung ersetzen. 

**Prüfkriterium** Kunde kann Vertretung ablehnen; ungeprüftes Ersatzangebot erscheint nie als bestätigter Termin. 

**Quellen und Einordnung** K1 UC08; K2 UC09; K6 UC10. Ausfallprozess vor Start; Automation später. 

### **E12 Warteliste und passende Alternativen freiwillig anbieten** 

**Funktionalität** Wunschfenster, Person und Behandlung berücksichtigen; bei Familie vollständige Kombination suchen. 

**Entwicklerhinweis** Benachrichtigung ersetzt keine Umbuchung. Angebote mit Annahmefrist und erneuter Kapazitätsprüfung; bisherige Termine bis erfolgreicher Annahme erhalten. Abmeldung ermöglichen. 

**Prüfkriterium** Mehrere Empfänger können einen angebotenen Slot nicht gleichzeitig verbindlich erhalten. 

**Quellen und Einordnung** K1 UC10; K4 UC08; K5 UC09. Spätere Erweiterung. 

### **E13 Vertrauen Orientierung und Zusatzangebote begrenzen** 

**Funktionalität** Salonkontext, vorhandene Fotos und Bewertungen helfen bei neuen Anbietern. Empfehlungen, Extras und echte Knappheitshinweise getrennt prüfen. 

**Entwicklerhinweis** Website-Widget nicht automatisch zur salonübergreifenden Plattform erweitern. Keine eigenen Bewertungen oder Standorttracking ableiten. Empfehlungen salonseitig begründen, Extras aktiv wählen; Knappheit nur aus echten aktuellen Slots. 

**Prüfkriterium** Buchender erkennt Salon und Preis; Ablehnung einer Empfehlung erzeugt keine Zusatzleistung und keinen Zuschlag. 

**Quellen und Einordnung** K2 UC10; K4 UC01/UC09/UC10. Websitekontext Kern; Erweiterungen prüfen. 

### **Priorisierung und nächste reale Prüfung** 

Zunächst den gemeinsamen Kern prototypisieren und die salonseitigen Grundlagen klären: Katalog, Dauer, Preisregeln, Qualifikationen, Kapazität, Mindestvorlauf, Fristen, Zugriff und Zuständigkeiten. Ein praktikabler Hilfs- und Ausfallprozess gehört vor den Start, auch wenn er anfangs manuell bearbeitet wird. Die Bedienbarkeit mit echten Kunden testen, bevor besondere Szenarien den ersten Produktumfang erweitern. 

Wiederbuchung, Beratungsübergang und Familienkombinationen getrennt untersuchen. Warteliste, Uploads, Rückruf, Kalenderintegration, automatische Ersatzangebote und Entscheidungshilfen benötigen jeweils Nutzen- und Aufwandprüfung. Sobald eine Erweiterung umgesetzt wird, gelten ihre notwendigen Schutz- und Konsistenzregeln vollständig. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 5 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **Teil 2 Vollständige Notizen der sechs Napkins** 

Die folgenden sechs Abschnitte geben den gesamten Text der jeweiligen Foliennotizen wieder. Der Wortlaut wird nicht gekürzt. Quellinterne Überschriften und Feldbezeichnungen bleiben erhalten; die Abschnittsformatierung wurde für Word vereinheitlicht. 

## **K1 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K1_Napkin_Stammkundin_Anna_final.pptx 

#### **NAPKIN K1 – STAMMKUNDIN ANNA** 

**Quelle:** Interaktives KI-Interview im Chat am 05.10.2026, Abschnitte I01 bis I09. Vollständiges Transkript und detaillierte Ableitungen in der zugehörigen Word-Datei. I10 ist der organisatorische Abschluss. 

#### **METHODIK UND EVIDENZGRENZE** 

**Vorgegeben:** Stammkundin, regelmäßig dieselbe Leistung bei der Lieblingsfriseurin. Name und konkrete Erlebnisse wurden in der Simulation ergänzt. Sämtliche Aussagen und Branchenbeispiele sind synthetisch. Ab I04 überwiegen hypothetische Onlinewünsche, die durch direkte Nachfragen nach Funktionen angeregt wurden. Keine Marktanteile, Nutzungsquoten oder bestätigten Einsparungen ableiten. 

#### **KERNAUSSAGE** 

K1 will die Sicherheit des persönlichen Gesprächs auch online. Sie priorisiert vertraute Person und Behandlung. Vor-Ort-Buchung funktioniert bereits gut. Online bietet vor allem bei späterer Planung und Änderungen einen vermuteten Zusatznutzen. Ein Kanalwechsel ist noch nicht belegt. 

#### **SITUATION UND SPANNUNGEN** 

**Heute:** Direkte Wiederbuchung beim Bezahlen, sonst Anruf. Etwa sechs Wochen Vorlauf, bei Bedarf eine Woche später. Personenbindung ist wichtiger als frühester Slot. Die Friseurin übersetzt „wie immer“ in Leistung und Dauer. Kärtchen plus mündliche Zusage gelten als Bestätigung. Beim Telefonieren entstehen Wartezeiten und Unsicherheit über angekommenen Änderungswunsch. 

### **UC01 Gewohnte Behandlung erneut buchen** 

**Bezug:** I02–I04 

**Interviewhinweis:** Anna sagt ‚wieder das Gleiche‘, kennt Leistungsnamen und Dauer jedoch nicht. Sie möchte die letzte Behandlung auswählen und bei Bedarf anpassen. 

**Funktionalität:** Vorherige Buchung als Vorschlag übernehmen. Bestandteile, aktuelle Preise, Dauer und gewählte Person vor Abschluss zeigen. 

**Entwicklerhinweis:** Historische Leistungen auf den aktuellen Salon-Katalog abgleichen. Nicht mehr verfügbare Bestandteile kennzeichnen. Änderungen lösen eine neue Prüfung von Dauer, Qualifikation und Verfügbarkeit aus. Zugriff auf persönliche Historie nur nach geeigneter Identifikation. 

**Prüfbarer Use Case:** Ein alter Termin dient als Vorlage. Änderungen sind möglich. Das System bestätigt erst nach aktueller Prüfung und zeigt die tatsächliche neue Zusammenstellung. 

#### **Priorität für K1:** Kernkandidat 

**Validierung:** Verstehen echte Stammkunden die wiederholte Zusammenstellung und erkennen sie Änderungen? 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 6 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **UC02 Bei der Lieblingsfriseurin einen passenden Termin finden** 

**Bezug:** I01–I05, I08 

**Interviewhinweis:** Anna akzeptiert eine Woche Wartezeit für ihre Friseurin und möchte diese zuerst auswählen. Bei Urlaub will sie deren nächste Verfügbarkeit sehen. 

**Funktionalität:** Person früh auswählen, danach passende freie Zeiten sowie Alternativen bei derselben Person anbieten. Voraussichtliche Endzeit anzeigen. 

**Entwicklerhinweis:** Verfügbarkeit aus Arbeitszeiten, Abwesenheiten, Leistungsqualifikation und Behandlungsdauer bestimmen. Personenwahl bei Datumssuche beibehalten. Ein Wechsel zu einer anderen Person erfordert ausdrückliche Auswahl. Endzeit als Schätzung kennzeichnen. 

**Prüfbarer Use Case:** Wenn der Wunschtag nicht frei ist, bleiben Alternativen bei derselben Person sichtbar. Das System wechselt die Person nicht automatisch. 

**Priorität für K1:** Kernkandidat 

**Validierung:** Welche Reihenfolge bevorzugen andere Rollen und welche Zeitfilter sind tatsächlich nötig? 

### **UC03 Leistungsumfang und Preis vor Abschluss verstehen** 

**Bezug:** I03, I06 

**Interviewhinweis:** Anna möchte wissen, ob Waschen und Föhnen enthalten sind und ob sich der Preis geändert hat. Unklare Leistungsnamen führten in einer simulierten Massage-Erfahrung zum Abbruch. 

**Funktionalität:** Verständliche Leistungspakete mit enthaltenen Bestandteilen, Dauer und aktuellem Preis beziehungsweise nachvollziehbarer Preisspanne. Kontaktweg bei Unsicherheit. 

**Entwicklerhinweis:** Der Salon definiert enthaltene Schritte und Pflichtkombinationen. Das System unterscheidet Festpreis, Preis ab einem Betrag und Schätzung. Es zeigt bekannte Zusatzkosten vor Abschluss. Preisvergleich zur Vorbuchung nur bei vergleichbarer Zusammenstellung. 

**Prüfbarer Use Case:** Vor Absenden sind Behandlung und Umfang nachvollziehbar. Zusätzliche Bestandteile verändern Preis und Zeit sichtbar. Eine Rückfrage ist ohne falsche Buchung möglich. 

**Priorität für K1:** Kernkandidat 

**Validierung:** Welche Begriffe, Pakete und Preisangaben verstehen reale Kunden ohne Unterstützung? 

### **UC04 Verbindlich buchen und den Status nachsehen** 

**Bezug:** I02, I04–I06 

**Interviewhinweis:** Eintrag, mündliche Zusage und Terminkärtchen schaffen Sicherheit. ‚Vielen Dank für Ihre Anfrage‘ ließ in einer anderen simulierten Buchung den Status offen. 

**Funktionalität:** Klare Unterscheidung zwischen Anfrage und bestätigtem Termin. Bestätigungsansicht und E- Mail mit Datum, Beginn, Person, Behandlung und Preisangabe. Termin später wieder aufrufen. 

**Entwicklerhinweis:** Erst nach erfolgreicher Speicherung einen Termin als bestätigt anzeigen. Bei Anfragen Bearbeitungsstatus und nächsten Schritt erklären. Buchungsstatus und Versandstatus getrennt führen. Wiederholtes Absenden darf keinen Doppeltermin erzeugen. Eine fehlgeschlagene Mail hebt die Buchung nicht auf. 

**Prüfbarer Use Case:** Nach erfolgreicher Buchung ist der Termin im Salon-Kalender vorhanden. Bei Mailfehler bleibt sein Status abrufbar. Ein technischer Fehler führt nicht zu einer falschen Zusage. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 7 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Priorität für K1:** Kernkandidat 

**Validierung:** Erkennen Nutzer in Status- und Fehleransichten eindeutig, ob sie einen Termin haben? 

### **UC05 Einen Termin sicher verschieben** 

**Bezug:** I04, I07–I08 

**Interviewhinweis:** Anna verschiebt telefonisch und hat Sorge, online ihren alten Termin zu verlieren, bevor ein neuer sicher ist. 

**Funktionalität:** Geschützter Änderungslink. Neue freie Zeit wählen, alte und neue Buchung vergleichen, Änderung verbindlich bestätigen. 

**Entwicklerhinweis:** Alten Termin bis zum erfolgreichen Abschluss behalten. Neue Zeit unmittelbar vor Abschluss prüfen. Wechsel zusammenhängend ausführen, damit bei Fehlern die alte Buchung erhalten bleibt. Erinnerungen und Salon-Kalender auf den neuen Stand bringen. 

**Prüfbarer Use Case:** Ist der neue Slot inzwischen vergeben oder schlägt die Änderung fehl, bleibt der alte Termin bestehen. Bei Erfolg existiert nur die neue aktive Buchung mit eindeutiger Bestätigung. 

**Priorität für K1:** Kernkandidat 

**Validierung:** Verstehen Kunden, wann die Umbuchung wirksam wird und was bei einem Fehler gilt? 

### **UC06 Absagen und Änderungen zuverlässig erinnern** 

**Bezug:** I05, I07 

**Interviewhinweis:** Anna möchte eine bestätigte Absage. Ein falsch eingetragener Termin führte in der Simulation zu Verspätung. Eine Erinnerung aus der Zahnarztpraxis dient als Vorbild. 

**Funktionalität:** Termin stornieren, Ergebnis schriftlich bestätigen und Zeit im Kalender freigeben. Erinnerungen sowie optional einen Kalendereintrag anbieten. 

**Entwicklerhinweis:** Salonregeln zur Änderungs- und Stornofrist vor Abschluss sowie beim Änderungszugriff verständlich zeigen. Wiederholte Stornierung verändert den Zustand nicht erneut. Geplante Erinnerungen nach Umbuchung aktualisieren und nach Absage stoppen. Keine No-show-Gebühren aus K1 ableiten. 

**Prüfbarer Use Case:** Nach Stornierung ist der Termin inaktiv und es geht keine alte Erinnerung mehr heraus. Nach Umbuchung beziehen sich Erinnerungen auf Datum und Uhrzeit des neuen Termins. 

**Priorität für K1:** Kernkandidat; Kalenderexport ergänzend 

**Validierung:** Welche Erinnerung und Vorlaufzeit helfen wirklich? Welche Salonregeln müssen berücksichtigt werden? 

### **UC07 Die Behandlung eines bestehenden Termins ändern** 

**Bezug:** I04–I05 

**Interviewhinweis:** Anna möchte eventuell zusätzlich schneiden lassen und eine ausdrückliche Rückmeldung, ob das zeitlich eingeplant ist. Ein Freitext allein genügt ihr nicht. 

**Funktionalität:** Leistungsänderung an einem Termin mit Prüfung oder als klar gekennzeichnete Änderungsanfrage. Entscheidung des Salons und aktualisierte Bestätigung anzeigen. 

**Entwicklerhinweis:** Zusätzliche Dauer, Preis, Qualifikation und nachfolgende Termine prüfen. 

Änderungswunsch, ursprüngliche Buchung und bestätigte Änderung getrennt führen. Bis zur Zusage gilt die ursprüngliche Leistung. Bei Ablehnung Alternativen anbieten. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 8 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Prüfbarer Use Case:** Eine Zusatzleistung verlängert den Termin nur, wenn Kapazität besteht oder der Salon zustimmt. Kunden sehen, ob die Änderung angefragt, angenommen oder abgelehnt wurde. 

**Priorität für K1:** Erweiterung; Statuslogik von Beginn an mitdenken 

**Validierung:** Welche Änderungen können Salons automatisch erlauben und wann ist Beratung nötig? 

### **UC08 Auf Ausfall der Friseurin reagieren** 

**Bezug:** I05, I09 

**Interviewhinweis:** Bei Urlaub sucht Anna die nächste Zeit ihrer Friseurin. Bei kurzfristigem Ausfall möchte sie zwischen Vertretung und Verschiebung entscheiden. 

**Funktionalität:** Betroffene Kunden informieren. Passende Ersatzperson oder neue Zeit zur ausdrücklichen Auswahl anbieten. 

**Entwicklerhinweis:** Geplante Abwesenheit blockiert neue Slots. Kurzfristiger Ausfall löst einen Bearbeitungsfall aus. Alternative zunächst als Angebot kennzeichnen. Originaltermin und Angebotstatus konsistent führen. Bei ausbleibender Reaktion bleibt eine Salon-Aufgabe sichtbar. 

**Prüfbarer Use Case:** Der Termin wechselt weder unbemerkt die Person noch erscheint eine unbestätigte Alternative als fest gebucht. Der Salon sieht noch offene Fälle. 

**Priorität für K1:** Erweiterung; Ausfallprozess vor Start festlegen 

**Validierung:** Wie arbeiten Salons bei Ausfällen und wie lange können sie auf eine Antwort warten? 

### **UC09 Ohne große Hürden buchen und persönlich nachfragen** 

**Bezug:** I01, I04–I06, I08–I09 

**Interviewhinweis:** Anna empfindet Konto und Passwort als lästig, möchte bekannte Daten nicht wiederholt eingeben und telefonisch Unterstützung erhalten. Der Salon soll ihre Onlinebuchung finden. 

**Funktionalität:** Gastbuchung als Option prüfen. Geschützter Zugriff auf Terminverwaltung. Gemeinsamer Salon-Kalender für Vor-Ort-, Telefon- und Onlinebuchung. Rückfrage über Kontaktangabe und Buchungsreferenz ermöglichen. 

**Entwicklerhinweis:** Gastbuchung und Zugriff auf Kundenhistorie getrennt gestalten. Persönliche Daten und Änderungsrechte nur nach geeigneter Identifikation zeigen. Kanalübergreifend dieselbe Buchung bearbeiten. Freie Kalenderzeiten unmittelbar vor Abschluss erneut prüfen. 

**Prüfbarer Use Case:** Der Salon findet die Onlinebuchung und kann sie telefonisch bearbeiten. Die Änderung erscheint im Kundenstatus. Eine Person ohne Berechtigung kann keine fremde Historie oder Buchung verwalten. 

**Priorität für K1:** Kernkandidat; Wiedererkennung gesondert prüfen 

**Validierung:** Wann akzeptieren Kunden Identifikation und welche vorhandenen Kalender müssen wir anbinden? 

### **UC10 Einen früheren Termin angeboten bekommen** 

**Bezug:** I05 

**Interviewhinweis:** Anna kann sich eine Nachricht vorstellen, wenn bei ihrer Friseurin etwas früher frei wird. Sie möchte dies nur auf eigenen Wunsch. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 9 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Funktionalität:** Optionale Warteliste mit Person, Zeitfenster und gewünschter Behandlung. Passenden frei gewordenen Termin anbieten. 

**Entwicklerhinweis:** Dauer und Personenpräferenz abgleichen. Angebote zeitlich begrenzen und vor Annahme erneut prüfen. Zustimmung und Abmeldung verwalten. Bestehende Buchung bis zur erfolgreichen Umbuchung erhalten. Keine automatische Umbuchung. 

**Prüfbarer Use Case:** Nur angemeldete Kunden erhalten passende Angebote. Wenn mehrere Kunden dasselbe Angebot öffnen, kann nur eine Person den Slot verbindlich erhalten. 

**Priorität für K1:** Spätere Erweiterung 

**Validierung:** Wie hoch ist der tatsächliche Bedarf und wie verteilen Salons frei gewordene Zeiten? 

#### **ÜBERGREIFENDE ENTWICKLERHINWEISE** 

1. Anfrage, bestätigt und storniert unterscheiden. Änderungsanfragen getrennt vom weiterhin gültigen Termin führen. Versandstatus ist kein Buchungsstatus. 

2. Alle Kanäle verwenden dieselbe Buchung und Verfügbarkeit. Wiederholtes Absenden und gleichzeitige Zugriffe dürfen keinen Doppeltermin erzeugen. 

3. Katalog, Pflichtkombinationen, Preise, Dauer und Qualifikation müssen salonseitig gepflegt werden. K1 liefert keine belastbaren Behandlungszeiten oder Regeln für parallele Arbeitsschritte. 

4. Gastbuchung senkt möglicherweise die Hürde. Persönliche Historie und Änderungen benötigen geeignete Identifikation und geschützten Zugriff. Konkrete Technik ist eine Entwicklerableitung. 

5. Hinweise auf weniger Anrufe und Verspätungen sind Nutzenhypothesen. Anna schildert keinen vollständig verpassten Friseurtermin. Aus dem Interview keine No-show-Gebühr ableiten. 

#### **VORSCHLAG FÜR DIE PRIORISIERUNG** 

**Kernkandidaten:** Person und Leistungsumfang, aktuelle Verfügbarkeit, klare Zusage, sichere Umbuchung und Absage, konsistente Erinnerungen und kanalübergreifender Terminbestand. Wiederbuchung und Gastbuchung prüfen. Leistungsänderungen, betreuter Ausfallprozess und freiwillige Warteliste als Erweiterungen. Ausfallprozess auch bei anfangs manueller Bearbeitung vor Start definieren. Keine verbindliche GesamtRoadmap aus K1 ableiten. 

#### **NÄCHSTE REALE PRÜFUNG** 

**Stammkunden beobachten:** Behandlung wiederholen, Umfang erklären, Person finden, verbindlichen Status erkennen und Fehler beim Verschieben verstehen. Mit Saloninhabern Katalogpflege, Zeitregeln, Stornofristen, Telefonänderungen und Mitarbeiterausfall prüfen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 10 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **K2 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K2_Napkin_Spontaner_Kunde_Felix.pptx 

#### **NAPKIN K2 – SPONTANER KUNDE FELIX** 

**Quelle:** Interaktives synthetisches KI-Interview im Chat am 06.10.2026. Vollständige Frage-Antwort-Folge I01 bis I13 in der Word-Datei. I01 verwendet zunächst Leon, I02 dokumentiert die vom Nutzer gewünschte Umbenennung in Felix. Das Profil blieb gleich. 

#### **METHODIK UND EVIDENZGRENZE** 

**Vorgegeben:** Kurzfristiger Termin, bei der Salonwahl flexibel. Perspektive: Verfügbarkeit, schnelle Auswahl, Buchung unterwegs. Alle Erfahrungen und Branchenbeispiele sind konstruiert. Geschildertes Verhalten und hypothetische Toolwünsche unterscheiden. Entwicklerlogik und Prioritäten sind Ableitungen, keine validierten Anforderungen oder quantifizierten Nutzenbelege. 

#### **KERNAUSSAGE** 

K2 priorisiert einen kurzfristig erreichbaren und sofort bestätigten Termin. Personenwahl ist bei der letzten Buchung nachrangig, kann nach guter Erfahrung wichtig werden. Frühe Verfügbarkeitsanzeige und ein kurzer mobiler Ablauf sind Kernhypothesen. Slotverlust, unklare Fristen und fehlende aktuelle Bestätigung sind relevante Fehlerfälle. 

#### **GRENZE DES PRODUKTUMFANGS** 

Unser Beispiel ist ein Tool auf der Website eines Salons. Die lokale Verfügbarkeit dieses Salons gehört zum Kern. Salonübergreifende Suche, eigenes Bewertungssystem und automatische Reisezeitberechnung sind gesonderte Produktentscheidungen. Felix sagt, dass er den Weg selbst einschätzen kann. Aus der NähePräferenz keine Pflicht zu Standorttracking ableiten. 

### **UC01 Kurzfristige Verfügbarkeit vor der Dateneingabe sehen** 

**Bezug:** I01, I03–I04, I06, I08, I12 

**Interviewhinweis:** Felix sucht heute oder morgen. Fehlende kurzfristige Zeiten führen zum Salonwechsel. Kontaktdaten möchte er erst nach der Auswahl eingeben. 

**Funktionalität:** Nach Leistungsauswahl den nächsten verfügbaren Termin sowie heute und morgen zeigen. Zeiten vor Registrierung oder Kontaktformular sichtbar machen. 

**Entwicklerhinweis:** Zeiten aus Leistungsdauer, qualifizierten Mitarbeitern, Arbeitszeiten, Abwesenheiten und belegten Terminen ableiten. Salons definieren den Mindestvorlauf. Datum und Uhrzeit eindeutig in SalonOrtszeit anzeigen. Leere Trefferliste mit nächster Möglichkeit erklären. Die Suche betrifft zunächst den Kalender des ausgewählten Salons. 

**Prüfbarer Use Case:** Felix wählt eine Leistung und sieht passende kurzfristige Zeiten ohne Dateneingabe. Ist erst nächste Woche etwas frei, erkennt er das sofort. Bereits vergangene Zeiten und nicht buchbare Slots erscheinen nicht als verfügbar. 

#### **Priorität für K2:** Kernkandidat 

**Validierung:** Wie viel Vorlauf brauchen Salons tatsächlich und wann erwarten Kunden die erste Verfügbarkeitsanzeige? 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 11 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **UC02 Freie Mitarbeiter ohne Personenpräferenz zusammenführen** 

**Bezug:** I03, I07–I09, I12 

**Interviewhinweis:** Felix kennt im neuen Salon niemanden. Er wählt ‚keine Präferenz‘ und erwartet, alle passenden freien Zeiten zu sehen. 

**Funktionalität:** Option ‚keine Präferenz‘ anbieten. Verfügbarkeiten aller für die gewählte Behandlung geeigneten Mitarbeiter zusammenführen. 

**Entwicklerhinweis:** Qualifikation, Arbeitszeit und notwendige Salonressourcen je Mitarbeiter prüfen. Gleichzeitige Slots verständlich bündeln. Die verbindliche Buchung einer geeigneten Person oder Kapazität zuordnen. Lastverteilung und interne Zuweisungsregeln salonseitig festlegen. Nicht das komplette Team für eine einzelne Buchung blockieren. 

**Prüfbarer Use Case:** Person A ist belegt, Person B kann die Behandlung übernehmen. Die Zeit bei B erscheint ohne einzelnen Kalenderwechsel. Bei Abschluss existiert genau eine passende Zuordnung mit ausreichender Kapazität. 

**Priorität für K2:** Kernkandidat 

**Validierung:** Welche Qualifikationen und Zuweisungsregeln benötigen Salons? Wollen Kunden die zugeteilte Person vor Abschluss sehen? 

### **UC03 Die passende Leistung mit nachvollziehbarem Preis wählen** 

**Bezug:** I03–I04, I07, I09–I10 

**Interviewhinweis:** Maschinenschnitt und Haarschnitt mit Waschen sind zunächst unklar. Die Erklärung löst die Unsicherheit. Felix will einen vollständigen Schnitt und keinen überraschenden Aufpreis. 

**Funktionalität:** Kurze verständliche Beschreibung, enthaltene Schritte, ungefähre Kundendauer und Preis zeigen. Bei ‚ab‘ oder Preisspanne erklären, welche Faktoren den Preis ändern. 

**Entwicklerhinweis:** Kundenzeit von internem Ressourcenbedarf unterscheiden. Pakete und nötige 

Zusatzleistungen im Salon-Katalog festlegen. Bekannte Preisfaktoren vor Bestätigung abfragen oder verbleibende Unsicherheit sichtbar machen. Die simulierten 30 Minuten sind ein Beispiel aus K2, kein Standardwert für das Produkt. 

**Prüfbarer Use Case:** Felix erkennt, dass der Maschinenschnitt nicht seinem Wunsch entspricht, und wählt das passende Paket. Umfang und Preisart sind vor Abschluss sichtbar. Er muss keine Pflichtleistung unbemerkt ergänzen. 

#### **Priorität für K2:** Kernkandidat 

**Validierung:** Verstehen reale Kunden die Leistungsnamen und welche Preisfaktoren können sie selbst richtig angeben? 

### **UC04 Ein passendes Zeitfenster und nahe Alternativen finden** 

**Bezug:** I03–I04, I08–I09, I12 

**Interviewhinweis:** Felix muss Anfahrt und Behandlung zwischen andere Termine einpassen. ‚Bis 16 Uhr fertig‘ unterscheidet sich von ‚um 15:45 Uhr beginnen‘. Restaurantbuchung dient als synthetischer Vergleich für nahe Alternativen. 

**Funktionalität:** Beginn, Dauer und voraussichtliches Ende anzeigen. Benachbarte Zeiten oder nächsten passenden Tag anbieten. Optional früheste Ankunft und spätestes Ende als Filter prüfen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 12 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Ein Zeitfenster muss die ganze Kundenbehandlung aufnehmen. Salon-Mindestvorlauf gilt unabhängig von der individuellen Anfahrt. Keine automatische Wegzeitberechnung aus K2 voraussetzen: Felix sagt, er könne den Weg selbst einschätzen. Standort und vollständige Adresse müssen zugänglich sein. Salonübergreifende Suche ist ein separater Produktumfang. 

**Prüfbarer Use Case:** Bei Ende spätestens 16 Uhr wird eine 30-minütige Behandlung ab 15:45 Uhr nicht als passend gezeigt. Für belegte Wunschzeit erscheinen nur Alternativen mit ausreichend Dauer und konkretem Datum. 

**Priorität für K2:** Zeitangaben Kernkandidat; zusätzliche Filter prüfen 

**Validierung:** Reichen Dauer und Endzeit oder brauchen Nutzer tatsächlich einen Endzeitfilter? Wie möchten sie ihren zeitlichen Spielraum angeben? 

### **UC05 Sofort verbindlich buchen und den Status wiederfinden** 

**Bezug:** I04–I05, I07, I10, I12 

**Interviewhinweis:** ‚Termin bestätigt‘ plus passende E-Mail beendet die Suche. Auf Salonfreigabe möchte Felix bei kurzfristiger Buchung nicht warten. Bei fehlender Mail könnte er erneut buchen. 

**Funktionalität:** Nach erfolgreicher Buchung sofort die Zusage mit Datum, Uhrzeit, Leistung und Salonadresse zeigen. E-Mail und geschützten Statuszugriff anbieten. Kalenderexport als Ergänzung. 

**Entwicklerhinweis:** Unmittelbar vor Speicherung Verfügbarkeit prüfen. Bestätigt nur anzeigen, wenn der Termin tatsächlich verbindlich gespeichert ist. Versandstatus getrennt führen. Mehrfaches Absenden technisch derselben Buchungsaktion zuordnen, damit bei Wiederholung keine Doppelbuchung entsteht. Anfrageverfahren vor dem Absenden klar benennen. Eine fehlende Mail storniert keinen Termin. 

**Prüfbarer Use Case:** Felix drückt wegen ausbleibender Mail erneut auf Absenden. Es entsteht nur ein Termin. Die Bestätigungsansicht zeigt den gespeicherten Status. Bei einer reinen Anfrage steht nirgends eine feste Zusage. 

**Priorität für K2:** Kernkandidat 

**Validierung:** Verstehen Kunden Anfrage und Zusage eindeutig? Finden sie ihre Buchung auch bei fehlender oder verspäteter Mail? 

### **UC06 Nach Slotverlust mit den vorhandenen Angaben weiterbuchen** 

**Bezug:** I08, I10 

**Interviewhinweis:** Ein Termin verschwindet während der Registrierung. Felix verlässt den Anbieter. Er möchte eine andere Zeit wählen und seine Daten nicht erneut eintippen. 

**Funktionalität:** Slotverlust klar erklären, passende alternative Zeiten zeigen und bereits eingegebene Angaben im laufenden Vorgang erhalten. Gastbuchung oder schlanken Zugang prüfen. 

**Entwicklerhinweis:** Ausgewählte Zeit ist ohne explizite Reservierung noch keine Zusage. Kurzzeitige Reservierung optional mit Salonregeln und Ablaufzeit entwerfen. Bei konkurrierenden Abschlüssen kann nur ein Kunde dieselbe Mitarbeiterkapazität erhalten. Bei Slotverlust keine falsche Bestätigung senden. Erhaltene Eingaben nur im vorgesehenen geschützten Kontext verwenden. 

**Prüfbarer Use Case:** Eine andere Person bucht den Slot zuerst. Felix erhält eine eindeutige Fehlermeldung und Alternativen. Leistung und Kontaktdaten bleiben verfügbar, und die neue Auswahl muss er ausdrücklich bestätigen. 

**Priorität für K2:** Kernkandidat; Reservierungsmechanismus separat entscheiden 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 13 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Validierung:** Welche Wartezeit akzeptieren Nutzer und verhindert eine kurze Reservierung tatsächlich Abbrüche? 

### **UC07 Kurzfristige Terminänderung und Frist verständlich machen** 

#### **Bezug:** I11 

**Interviewhinweis:** Am selben Tag findet Felix online keine spätere Zeit. Er weiß nicht, ob nichts frei oder die Änderungsfrist abgelaufen ist. Der Salon verschiebt telefonisch, ohne neue Mail. 

**Funktionalität:** Änderungslink mit eindeutigen Gründen für Einschränkungen. Zwischen fehlender Verfügbarkeit und abgelaufener Onlinefrist unterscheiden. Telefonnummer als Ausweg und aktualisierte Bestätigung nach Telefonänderung. 

**Entwicklerhinweis:** Salonregeln zu Umbuchung und Absage getrennt von freien Slots führen. Alten Termin bis zum erfolgreichen Wechsel erhalten. Online und Telefon greifen auf denselben Terminbestand zu. Erinnerungen, Statusseite und Bestätigung nach Änderung aktualisieren. Stornobestätigung ist eine ergänzende Entwicklerableitung, keine von Felix geschilderte Absageerfahrung. 

**Prüfbarer Use Case:** Ist die Onlineänderung wegen Frist gesperrt, sieht Felix den Grund und Kontakt. Verschiebt der Salon telefonisch, zeigen Statusseite und Bestätigung den neuen Termin. Ein fehlgeschlagener Wechsel lässt die alte Buchung bestehen. 

#### **Priorität für K2:** Kernkandidat 

**Validierung:** Welche kurzfristigen Änderungen erlauben Salons und wie werden telefonische Ausnahmen dokumentiert? 

### **UC08 Salon finden und bei Verspätung schnell anrufen** 

**Bezug:** I03–I05, I07, I11 

**Interviewhinweis:** Felix verspätet sich wegen eines schwer auffindbaren Eingangs. Unterwegs will er die Telefonnummer sofort finden. 

**Funktionalität:** Adresse, optionalen Eingangshinweis, Kartenlink und direkt anwählbare Telefonnummer in Bestätigung und Terminansicht zeigen. Mobile Darstellung für unterwegs. 

**Entwicklerhinweis:** Salons pflegen Standort- und Eingangsinformationen. Bei mehreren Standorten den gebuchten Standort statt nur Firmenadresse ausgeben. Ein Kartenlink ist ausreichend als erster Umsetzungsvorschlag. Keine Pflicht zur Standortfreigabe oder automatischer Reisezeitermittlung aus dem Interview ableiten. 

**Prüfbarer Use Case:** Felix öffnet unterwegs den Termin und findet ohne erneute Website-Suche den richtigen Standort, den Eingangshinweis und die Anruffunktion. Persönliche Daten bleiben im geschützten Zugriff. 

#### **Priorität für K2:** Kernkandidat 

**Validierung:** Welche Standortinformationen fehlen real häufig und wo suchen Nutzer zuerst nach der Telefonnummer? 

### **UC09 Bei Salonabsage schnell eine passende Ersatzlösung erhalten** 

**Bezug:** I12 

**Interviewhinweis:** Bei kurzfristiger Absage reicht Felix eine Nachricht allein nicht. Eine andere geeignete Person im selben Salon wäre für ihn akzeptabel. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 14 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Funktionalität:** Absage mit klar erkennbarem Status und angebotenen Alternativen verbinden. Freie geeignete Person oder neue Zeit zur ausdrücklichen Annahme anbieten. 

**Entwicklerhinweis:** Ersatzkapazität und Leistungsqualifikation prüfen. Angebot und verbindlich angenommene Ersatzbuchung unterscheiden. Ohne neue Kapazität keine Zusage. Annahme darf keinen zusätzlichen parallelen Termin erzeugen. Interne Bearbeitungsaufgabe bei offener Rückmeldung vorsehen. Automatische Personenwechsel nicht pauschal aus Zustimmung zu einer hypothetischen Vertretung ableiten. 

**Prüfbarer Use Case:** Eine Person fällt aus. Felix erhält eine passende Ersatzoption, nimmt sie an und sieht den neuen bestätigten Termin. Ist keine Alternative vorhanden, bleibt die Absage eindeutig und der Salon-Kontakt sichtbar. 

**Priorität für K2:** Erweiterung; praktikablen Ausfallprozess vor Start definieren 

**Validierung:** Wollen reale Nutzer Ersatzangebote direkt annehmen und welche Freigabe braucht der Salon? 

### **UC10 Vertrauen und mobile Orientierung vor der Buchung herstellen** 

**Bezug:** I01, I03, I06–I07, I12 

**Interviewhinweis:** Felix wechselt bei fehlender Kapazität den Salon, prüft aber Bilder und Bewertungen. Verfügbarkeit, Nähe und ein passender Preis wiegen schwerer als umfangreicher Vergleich. 

**Funktionalität:** Buchung von der Salonwebsite mobil leicht auffindbar machen. Leistung, Preis, Standort und Verfügbarkeit im Kontext des ausgewählten Salons zeigen. Vorhandene Vertrauensinformationen zugänglich halten. 

**Entwicklerhinweis:** Unser Website-Buchungstool bietet zunächst saloninterne Zeiten. Öffentliche Suche, Entfernungsvergleich und Bewertungen sind getrennte Entdeckungsfunktionen. Eine plattformweite SalonSuche oder ein eigenes Bewertungssystem sind durch K2 nicht automatisch Anforderungen. Mobile Bedienung, Rücknavigation und verständliche Formulare im Prototyp prüfen. 

**Prüfbarer Use Case:** Felix kommt von der mobilen Salonwebsite und erkennt, für welchen Salon er bucht. Er findet den Buchungseinstieg sowie Preis und freie Zeiten ohne langes Suchen. Vertrauensprüfung führt nicht zum Verlust seiner laufenden Auswahl. 

**Priorität für K2:** Mobiler Einstieg Kernkandidat; weitere Entdeckung separat prüfen 

**Validierung:** Welche Angaben gehören in das Widget und welche auf die Salonwebsite? Wo entdecken Nutzer neue Salons tatsächlich? 

#### **ÜBERGREIFENDE ENTWICKLERHINWEISE** 

1. Angezeigt, ausgewählt und bestätigt unterscheiden. Unmittelbar vor Speicherung Kapazität prüfen. Mehrfaches Absenden derselben Aktion darf keine Doppelbuchung auslösen. Versandstatus und Terminstatus getrennt halten. 

2. Ohne Personenpräferenz freie qualifizierte Mitarbeiter zusammenführen und die Buchung genau einer geeigneten Person oder Kapazität zuordnen. Arbeitszeiten, Dauer und notwendige Ressourcen einbeziehen. 

3. Kundendauer und voraussichtliches Ende zeigen. Der Salon legt den Mindestvorlauf fest. Individuelle Anfahrt beurteilt der Kunde zunächst selbst. Die simulierten 30 Minuten Behandlung sind kein Standardwert. 

4. Slotverlust mit Alternativen und erhaltenen Angaben behandeln. Eine kurze Reservierung ist eine zu prüfende Lösung, keine im Interview bewiesene technische Notwendigkeit. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 15 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

5. Bei Änderung fehlende Verfügbarkeit und gesperrte Frist unterscheiden. Telefonische Ausnahmen im selben Kalender speichern, Status und Benachrichtigungen aktualisieren. Alten Termin bis zum erfolgreichen Wechsel erhalten. 

6. K2 beschreibt Verspätung und Umbuchung, keinen vollständig verpassten Termin und keine konkrete Absage. Keine No-show-Raten, Gebühren oder gemessene Zahlungsbereitschaft ableiten. 

#### **VORSCHLAG FÜR DIE PRIORISIERUNG** 

**Kernkandidaten:** mobile Verfügbarkeit vor Dateneingabe, keine Präferenz, verständliche Pakete und Preisart, sofortige Zusage, geschützter Statuszugriff, Schutz vor Doppelbuchung, Slotverlust ohne Neustart, klare Änderungsfristen und direkte Kontaktangaben. Filter für Endzeit, Reservierung, Kalenderexport und automatisierte Ersatzangebote separat prüfen. Ein praktikabler Ausfallprozess muss zum Start vorhanden sein, auch mit manueller Salonarbeit. 

#### **NÄCHSTE REALE PRÜFUNG** 

**Kurzfristig Buchende am mobilen Prototyp beobachten:** passende Leistung finden, freie Zeit auswählen, ohne Personenpräferenz buchen, Endzeit erkennen, Slotverlust verstehen und Status bei fehlender Mail prüfen. Mit Salons Mindestvorlauf, Leistungsqualifikation, Zuweisung, Fristen und kanalübergreifende Änderungen abstimmen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 16 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **K3 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K3_Napkin_Komplexer_Wunsch_Miriam_final.pptx 

#### **NAPKIN K3 – MIRIAM MIT KOMPLEXEM FARBWUNSCH** 

**Quelle:** Interaktives synthetisches KI-Interview am 06.10.2026, I01 bis I12. Vollständiger Wortlaut und zehn Use Cases mit Entwicklerableitungen in der zugehörigen Word-Datei. I12 umfasst die Verabschiedung. 

#### **METHODIK UND EVIDENZGRENZE** 

**Vorgegeben:** größere Farbveränderung, Leistungsbezeichnung unbekannt. Perspektive: Orientierung, Beratung, Preis- und Zeitunsicherheit. Alle konkreten Erlebnisse einschließlich Küchenberatung sind simuliert. Der Wunsch nach Orientierung erscheint in I01. Die interviewführende Person schlägt Farbberatung in I03 und Rückruf in I04 vor. Die Uploadidee wird positiv weiterentwickelt. Zustimmung ist eine synthetische Konzeptreaktion und kein Nachweis realer Nutzung oder Zahlungsbereitschaft. 

#### **KERNAUSSAGE** 

Miriam sucht den richtigen ersten Schritt, bevor sie Färbetechnik, Dauer oder Preis einschätzen kann. Gewohnter Schnitt ist einfach buchbar. Der größere Farbwunsch braucht Einordnung. Beratung, Rückruf und Behandlung müssen als unterschiedliche Schritte erkennbar und mit echter Kapazität geplant sein. 

#### **BEOBACHTETE SPANNUNGEN INNERHALB DER SIMULATION** 

Der Schnitt ist fest zugesagt, die Beratungszeit bleibt offen. Miriam will nach Beratung leicht weiterbuchen, aber bei höherem Preis oder mehreren Schritten Bedenkzeit haben. Sie bevorzugt die bekannte Friseurin, akzeptiert jedoch geeignete Fachkompetenz einer Kollegin. Bilder sollen helfen, die Buchung aber nicht blockieren. Ein Wunschbild ist kein garantiertes Ergebnis. 

### **UC01 Den passenden ersten Termin ohne Fachwissen finden** 

**Bezug:** I01–I03, I07, I09, I11 

**Interviewhinweis:** Miriam kennt die passende Färbetechnik nicht. Sie verlässt die Leistungsauswahl vor Termin- und Datenauswahl und bucht telefonisch zunächst nur den Schnitt. 

**Funktionalität:** Neben konkreten Behandlungen einen verständlichen Einstieg für unklare oder größere Farbwünsche anbieten. Wunsch in eigenen Worten beschreiben und eine Beratung als nächsten Schritt wählen können. 

**Entwicklerhinweis:** Der Salon definiert, welche Leistungen direkt buchbar sind und wann Beratung nötig ist. Ein unklarer Wunsch erzeugt keine verbindliche automatische Auswahl einer Färbetechnik, Dauer oder Machbarkeit. Bei bekanntem einfachem Nachfärben kann der direkte Weg erhalten bleiben. Entscheidungshilfe zunächst mit salonseitigen Regeln prüfen. 

**Prüfbarer Use Case:** Miriam möchte von gefärbtem Haar deutlich heller werden und kennt die Technik nicht. Sie findet eine Beratungsoption, ohne Balayage oder Strähnen erraten zu müssen. Eine Behandlung entsteht erst nach eigener Auswahl beziehungsweise nach abgestimmtem Vorschlag. 

**Priorität für K3:** Kernkandidat für komplexe Wünsche 

**Validierung:** Welche Formulierungen führen reale Kunden zur passenden Beratung? Welche Fälle dürfen Salons direkt online buchen lassen? 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 17 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **UC02 Eine Farbberatung mit klarem Umfang verbindlich buchen** 

**Bezug:** I03, I07, I09 

**Interviewhinweis:** Die interviewführende Person schlägt Farbberatung vor. Miriam findet dies für ihren größeren Wunsch hilfreich, möchte aber Ablauf, Dauer, Kosten und die Abgrenzung zum Färben wissen. 

**Funktionalität:** Farbberatung als eigene Leistung mit Ort, Dauer, Preis oder Preisart, Ansprechpartner und Zweck darstellen. Deutlich bestätigen, dass an diesem Termin nur beraten wird. 

**Entwicklerhinweis:** Beratungszeit als echte Salonkapazität planen. Beratung als eigene Leistung führen. Soll Beratung mit einem Schnitt kombiniert werden, braucht es ein definiertes Paket oder eine ausdrücklich eingeplante Zusatzleistung. Eine Bemerkung zum Farbwunsch ist keine Kapazitätsbuchung. Ob Beratungskosten später angerechnet werden, ist eine offene Salonentscheidung. 

**Prüfbarer Use Case:** Miriam bucht Beratung. Ansicht und Bestätigung nennen Beratung, Dauer und Preis, ohne eine Färbung zu versprechen. Bei Schnitt plus Beratung zeigt das Tool den vereinbarten Umfang und reserviert die entsprechende Zeit. 

**Priorität für K3:** Kernkandidat; vorgeschlagenes Konzept real prüfen 

**Validierung:** Akzeptieren Kunden einen separaten Besuch und mögliche Kosten? Wie unterscheiden sie Kurzgespräch beim Schnitt und ausführliche Farbberatung? 

### **UC03 Einen planbaren Rückruf zur ersten Orientierung vereinbaren** 

**Bezug:** I04 

**Interviewhinweis:** Auf den Vorschlag eines Rückruftermins reagiert Miriam positiv. Sie erwartet eine Uhrzeit oder ein klares Fenster und akzeptiert, dass später noch ein Vor-Ort-Termin nötig sein kann. 

**Funktionalität:** Rückruf als separat erkennbare Terminart mit Telefonnummer, vereinbarter Zeit oder Zeitfenster und begrenztem Beratungsumfang anbieten. 

**Entwicklerhinweis:** Telefonzeit einer geeigneten Person einplanen, damit Rückrufe nicht zusätzlich zu belegten Behandlungen versprochen werden. Rückrufstatus und eventuell nötigen Vor-Ort-Termin getrennt halten. Ausbleibenden oder verpassten Rückruf mit nachvollziehbarem Folgeschritt behandeln. Ein Foto oder Telefonat garantiert keine Beurteilung der tatsächlichen Umsetzbarkeit. 

**Prüfbarer Use Case:** Miriam wählt einen Rückrufslot. Die Bestätigung sagt, wer wen wann anruft und dass dies der Orientierung dient. Bei notwendiger Vor-Ort-Prüfung kann ein weiterer Termin angeboten werden, ohne automatisch Färbezeit zu buchen. 

**Priorität für K3:** Erweiterung; aktiv vorgeschlagenes Konzept 

**Validierung:** Welche Fragen kann der Salon telefonisch klären? Feste Zeit oder Zeitfenster: Was funktioniert im Salonalltag und für die Kunden? 

### **UC04 Wunschbilder und Fotos der jetzigen Haare optional ergänzen** 

**Bezug:** I02, I04–I06, I11 

**Interviewhinweis:** Miriam möchte Wunschbild und Ist-Zustand zeigen, erklären, was ihr gefällt, und Bilder später ergänzen können. Sie wünscht verständliche Fotoanleitungen. 

**Funktionalität:** Optionale Bilder mit kurzer Erklärung einem Beratungsfall zuordnen. Wunschbild und eigenes Haarfoto unterscheiden. Nach erfolgreicher Terminbuchung Ergänzen oder Ersetzen ermöglichen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 18 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Terminbuchung nicht vom Upload abhängig machen. Erlaubte Formate und Größen erklären, Uploadfehler anzeigen und den Termin erhalten. Vorschaubild und erfolgreichen Eingang anzeigen. Salon kann Hinweise zu Tageslicht, Filtern oder sichtbaren Längen hinterlegen. Wunschbild bleibt Orientierung, kein Ergebnisversprechen. Änderungen nach Vorbereitung sichtbar machen. 

**Prüfbarer Use Case:** Miriam hat bei der Buchung kein Bild. Sie erhält trotzdem einen bestätigten 

Beratungstermin und ergänzt es später. Ein fehlgeschlagener Upload verändert den Terminstatus nicht. Der Salon sieht, welches Bild den Wunsch und welches den Ist-Zustand zeigt. 

**Priorität für K3:** Erweiterung mit eigenem Aufwand für Dateien 

**Validierung:** Verbessern Fotos die Vorbereitung tatsächlich? Welche Fotoanleitung hilft und wann ist ein Upload zu aufwendig? 

### **UC05 Bilder und Beratungsunterlagen im richtigen Salonfall verfügbar halten** 

**Bezug:** I05, I11 

**Interviewhinweis:** Miriam fragt, ob nur der Salon ihre Bilder sieht. Beim Gespräch sollen die Unterlagen vorliegen und bei einer anderen behandelnden Person die Absprache ankommen. 

**Funktionalität:** Geschützte saloninterne Ansicht für Bilder, Kundenwünsche und Beratungsnotizen. Sichtbarkeit und Umgang mit den Dateien verständlich erklären. 

**Entwicklerhinweis:** Dateien einem Salon, Kunden und Beratungsfall eindeutig zuordnen. Zugriff nur für berechtigte Personen im jeweiligen Salon. Keine öffentlichen Bildlinks als Standard. Uploadlinks und Terminverwaltung schützen. Lösch- und Aufbewahrungsprozess festlegen und den Kunden nachvollziehbar darstellen. Zugriffsausfall darf nicht dazu führen, dass ungeprüfte Inhalte als gesehen erscheinen. 

**Prüfbarer Use Case:** Die zuständige Beraterin sieht vor dem Gespräch die zugeordneten Unterlagen. Ein anderer Salon erhält keinen Zugriff. Miriam erkennt, ob ein Bild erfolgreich übermittelt ist. Der erfolgreiche Upload ist keine Bestätigung, dass die Beraterin es bereits geprüft hat. 

**Priorität für K3:** Grundvoraussetzung sobald Uploads umgesetzt werden 

**Validierung:** Wer braucht im Salon Zugriff und wie möchten Kunden Bilder ändern oder entfernen? Welche Aufbewahrung benötigt der tatsächliche Beratungsprozess? 

### **UC06 Relevante Vorinformationen verständlich und mit Unsicherheit erfassen** 

**Bezug:** I01–I02, I07, I11 

**Interviewhinweis:** Miriam hat bereits gefärbte, auch selbst gefärbte Haare. Sie weiß nicht, ob Produktname und Zeitpunkt wichtig sind, und möchte ‚weiß ich nicht‘ auswählen können. 

**Funktionalität:** Kurze salonseitig definierte Fragen zur Ausgangssituation und zum Ziel, ergänzt durch Freitext und Optionen für unbekannte Angaben. 

**Entwicklerhinweis:** Nur Informationen erfragen, die der Salon für Vorbereitung oder Terminwahl benötigt. Unbekannte Werte als unbekannt erhalten statt zu erfinden. Keine technische Freigabe einer Farbveränderung aus unvollständigen Angaben erzeugen. Beim Beratungsfall nachträgliche Ergänzungen ermöglichen. Zuständige Fachperson bewertet Ausgangssituation und Machbarkeit. 

**Prüfbarer Use Case:** Miriam kennt das zuletzt verwendete Farbprodukt nicht. Sie kann dennoch eine Beratung buchen. Die Beraterin sieht die Wissenslücke und kann nachfragen. Die Eingabe führt nicht zu einem angeblich sicheren automatischen Farbplan. 

**Priorität für K3:** Schlanke Fragen Kernkandidat; Umfang salonseitig prüfen 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 19 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Validierung:** Welche Angaben ändern tatsächlich Terminart oder Vorbereitung? Wie viele Fragen akzeptieren Kunden vor der Buchung? 

### **UC07 Nach Beratung Preis Zeit und mögliche Etappen nachvollziehen** 

**Bezug:** I02–I04, I08, I11 

**Interviewhinweis:** Miriam akzeptiert zuerst eine Spanne, möchte vor der Behandlung eine konkretere Einschätzung und wissen, ob Zusatzleistungen oder mehrere Besuche nötig sind. 

**Funktionalität:** Nach Beratung einen verständlichen Vorschlag mit Umfang, Preis beziehungsweise verbleibender Preisspanne, voraussichtlicher Dauer und möglichen Folgeetappen bereitstellen. 

**Entwicklerhinweis:** Beratungsnotiz, Kosteneinschätzung und verbindliche Buchung sind unterschiedliche Dinge. Aktuelle Salonleistungen und Preise verwenden. Enthaltene Schritte sowie noch offene Faktoren nennen. Einen halben Tag als simulierte Kundenvorstellung nicht als Standarddauer übernehmen. Etappen brauchen eigene passende Termine und Kapazitäten. 

**Prüfbarer Use Case:** Die Beraterin empfiehlt mehrere Schritte. Miriam sieht Zeit und Preisart je vorgeschlagener Behandlung sowie den vereinbarten Leistungsumfang. Unklare Kosten erscheinen als offen und werden nicht als Festpreis ausgegeben. 

**Priorität für K3:** Kernkandidat für den Übergang zur Behandlung 

**Validierung:** Welche Preisgenauigkeit kann der Salon nach Beratung leisten und wie planen Kunden mehrere Schritte? 

### **UC08 Behandlung erst nach ausdrücklicher Entscheidung buchen** 

**Bezug:** I03, I09, I11 

**Interviewhinweis:** Miriam möchte nach Beratung direkt buchen können, aber bei höherem Preis oder mehreren Schritten erst überlegen. Die Beratung soll keinen automatischen Farbtermin auslösen. 

**Funktionalität:** Beratungsabschluss mit einem Behandlungsvorschlag und klarer freiwilliger Buchungsentscheidung. Vorschlag, Vormerkung und bestätigten Termin sichtbar unterscheiden. 

**Entwicklerhinweis:** Abschluss der Beratung löst keine verpflichtende Behandlung aus. Ein Vorschlag hält zunächst keine Kapazität, sofern keine ausdrücklich vereinbarte Reservierung vorliegt. Bei späterer Annahme aktuelle Zeit, Person, Preis und Leistung erneut prüfen. Keine kostenpflichtige Reservierung aus K3 ableiten. 

**Prüfbarer Use Case:** Miriam erhält einen teureren mehrstufigen Vorschlag und entscheidet sich zunächst nicht. Es entsteht keine bestätigte Färbebuchung. Nimmt sie später an, wählt und bestätigt sie eine dann verfügbare Behandlung. 

**Priorität für K3:** Kernkandidat 

**Validierung:** Wie viel Bedenkzeit benötigen Kunden und wollen Salons überhaupt Vormerkungen anbieten? 

### **UC09 Beratungsergebnis bei Wechsel der behandelnden Person übergeben** 

**Bezug:** I08, I11 

**Interviewhinweis:** Miriam bevorzugt ihre bekannte Friseurin, ist aber offen für eine fachlich passende Kollegin. Bei einem Wechsel möchte sie nicht alles neu erklären oder widersprüchliche Einschätzungen bekommen. 

**Funktionalität:** Zuständige Person für Beratung und Behandlung getrennt wählen können. Vereinbarte Wünsche, Unterlagen und Behandlungsvorschlag im gemeinsamen Fall bereitstellen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 20 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Salon definiert Kompetenzen und geeignete Personen je Leistung. Beratende und behandelnde Person sowie aktueller Planstand nachvollziehbar führen. Neue fachliche Einschätzung bleibt möglich, erfordert aber Erklärung und aktualisierten Vorschlag an den Kunden. Ein gespeicherter Plan ersetzt keine fachliche Prüfung vor der Behandlung. 

**Prüfbarer Use Case:** Die Kollegin übernimmt die Behandlung und findet die Beratungsabsprache. Ändert sich der vorgeschlagene Umfang, erhält Miriam eine verständliche Rückmeldung und kann vor der neuen Buchung beziehungsweise Änderung entscheiden. 

**Priorität für K3:** Kernkandidat bei mehreren beteiligten Personen 

**Validierung:** Welche Notizen und Übergaben brauchen Salons tatsächlich? Wie sollen Kunden über veränderte Einschätzungen informiert werden? 

### **UC10 Verbundene Termine und Änderungsfolgen eindeutig verwalten** 

**Bezug:** I07, I09–I11 

**Interviewhinweis:** Der Schnitt ist sicher gebucht, die Farbberatung dabei unklar. Miriam möchte bei Verschiebung einer Beratung wissen, was mit einer vorgemerkten Behandlung geschieht. Für lange Termine fragt sie nach Fristen und möglichen Kosten. 

**Funktionalität:** Status und Umfang jedes Termins klar bestätigen. Verknüpfte Beratung und Behandlung sichtbar machen, Auswirkungen einer Änderung erklären und Salonregeln vor Abschluss zeigen. 

**Entwicklerhinweis:** Beratung, Rückruf und Behandlung erhalten eigene Status und Kapazitäten. Die Abhängigkeit darf keine stillschweigende automatische Verschiebung auslösen. Salon legt fest, ob eine Behandlung ohne abgeschlossene Beratung stattfinden darf. Beim Änderungsabschluss alle betroffenen Termine konsistent behandeln. Telefonänderungen aktualisieren denselben Bestand und Bestätigungen. Alte Zeit erst nach erfolgreichem Wechsel freigeben. 

**Prüfbarer Use Case:** Miriam verschiebt die Beratung hinter einen vorgemerkten Behandlungstermin. Das Tool benennt den Konflikt und den nächsten Schritt. Es bestätigt keine unmögliche Terminfolge und ändert die Behandlung nicht unbemerkt. Eine reine Vormerkung erscheint nicht als feste Zusage. 

**Priorität für K3:** Statuslogik Kernkandidat; Verknüpfungen je Salon prüfen 

**Validierung:** Welche Abhängigkeiten braucht der Salon und wann soll die Software warnen, blockieren oder eine Rückfrage auslösen? 

#### **ÜBERGREIFENDE ENTWICKLERHINWEISE** 

1. Kundenwunsch, bestätigte Beratung, Rückruf, Vorschlag, Vormerkung und bestätigte Behandlung getrennt führen. Ein Kommentar zur Farbe an einem Schnitttermin reserviert keine Beratungs- oder Färbezeit. 

2. Beratung und Rückruf benötigen salonseitige Dauer, Qualifikation und freie Kapazität. Kosten, Ort beziehungsweise Anrufablauf und Grenzen der Beratung transparent zeigen. 

3. Bilder optional hochladen und später ergänzen. Wunschbild und Ist-Zustand unterscheiden. Erfolgreicher Upload bestätigt den Eingang, nicht die fachliche Sichtung. Berechtigte Salonpersonen greifen auf denselben Fall zu. 

4. Unbekannte Vorinformationen zulassen. Fachperson bewertet Machbarkeit. Keine sichere Farbplanung, Ergebnisgarantie oder feste Zeit allein aus Bild und Kundenangaben ableiten. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 21 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

5. Nach Beratung Leistungsumfang, Zeit und Preis konkretisieren. Verbleibende Unsicherheit und mögliche Folgeetappen kennzeichnen. Behandlung erst nach ausdrücklicher Kundenentscheidung buchen. Keine automatische Verpflichtung durch Beratung. 

6. Bei Personenwechsel Wünsche und Vereinbarungen übergeben, neue Einschätzung erklären und Planstand aktualisieren. Bei Terminverschiebung Abhängigkeiten sichtbar machen, andere Termine nicht unbemerkt ändern. 

#### **PRIORISIERUNG ALS HYPOTHESE** 

**Kernkandidaten:** verständlicher Beratungseinstieg, Umfang und echte Beratungszeit, getrennte Status, transparente Preis- und Zeitinformation, freiwillige Behandlungsentscheidung und nachvollziehbare Übergabe. Rückruf, Upload und Terminverknüpfungen als Konzepte real prüfen. Normales Nachfärben nicht pauschal mit Beratungspflicht belasten. Die Simulation belegt keine No-show-Gebühr oder verpflichtende Anzahlung. 

#### **NÄCHSTE REALE PRÜFUNG** 

**Kunden mit komplexen Farbwünschen am Prototyp beobachten:** ersten Termin finden, Beratung von Behandlung unterscheiden, Rückruf verstehen, optionale Bilder später ergänzen und nach Vorschlag frei entscheiden. Mit Salons Vorfragen, Beratungszeit, Kompetenzen, Preisgenauigkeit, Dateiablage, Übergabe und Terminabhängigkeiten prüfen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 22 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **K4 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K4_Napkin_Preisbewusster_Neukunde_Daniel.pptx 

#### **NAPKIN K4 – DANIEL** 

#### **METHODIK UND EVIDENZGRENZE** 

**Quelle:** K4_Daniel_Vollstaendiges_Transkript.docx. Absatzreferenzen P000 ff. zählen die Word-Absätze einschließlich leerer Absätze, ab null. Das Interview wurde mit einer anderen KI geführt; es beschreibt eine simulierte Rolle und keine empirisch beobachtete Person. Alter und Preisorientierung sind Rollenmerkmale. Aussagen zu Erlebnissen sind synthetische Schilderungen; Wünsche und Analogien sind Konzeptreaktionen. Die folgenden technischen Regeln sind Entwicklerableitungen, keine wörtlichen Kundenforderungen. Das Transkript nennt keinen Interviewtermin; das Foliendatum bezeichnet die Auswertung. 

#### **KERNAUSSAGE** 

Daniel entscheidet sich für einen unbekannten Salon, wenn Preis, passende Leistung, freie Zeit und Vertrauen früh zusammenkommen. Er sucht nicht zwingend den niedrigsten Preis. Fehlende Klarheit führt eher zu einem anderen Anbieter als zu einem Telefonat. Die letzte Buchung gelingt trotz Restunsicherheit über Leistungsnamen und mögliche Zuschläge. Zwei Minuten sind ein subjektives Wunschziel, kein gemessener Usability-Benchmark. 

#### **EINORDNUNG UND OFFENE PUNKTE** 

**Nicht als Befund ausgeben:** verifizierte Bewertungsqualität, objektive Verknappung, Wirksamkeit von Erinnerungen gegen No-shows oder Zahlungsbereitschaft für ein Premiumangebot. Die Acht-WochenEmpfehlung und Extras sind Ideen, keine universellen Friseurregeln. Angebliche Restaurant-, Arzt- und Hotelabläufe dienen nur als synthetische Analogien. 

#### **USE CASES UND ENTWICKLERHINWEISE** 

### **K4-UC01 Salonvergleich mit früher Verfügbarkeit** 

**Bezug im Quelltranskript:** P002–P003; P012–P020; P097–P105 

**Simulierter Interviewhinweis:** Preis, Bewertungen und passende freie Zeiten bestimmen die Auswahl; Vertrauen fehlt beim ersten Besuch. 

**Abgeleitete Funktionalität:** Leistungen, Preisangaben, Dauer, Standort und nächste freie Zeiten früh sichtbar machen; gepflegte Salon- und Personeninfos. 

**Entwicklerhinweis:** Salonbestätigte Informationen verwenden; Bewertungen nur mit klarer Herkunft. Verfügbarkeit aus dem aktuellen Kalender abrufen, bei Buchung erneut prüfen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Neukunde findet einen Schnitt im gewünschten Zeitfenster und erkennt vor Dateneingabe Umfang, Kostenbasis und Salonadresse. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** An realen Neukunden prüfen, welche Vertrauensinformationen die Entscheidung tatsächlich unterstützen. 

### **K4-UC02 Verständlicher Katalog und Gesamtpreis** 

**Bezug im Quelltranskript:** P023–P034; P037–P047 

**Simulierter Interviewhinweis:** Ähnliche Leistungsnamen und mögliche Zuschläge verunsichern. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 23 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Abgeleitete Funktionalität:** Leistungsbeschreibung mit enthaltenen Schritten, Dauer, Preis oder erklärter Spanne; Extras getrennt ausweisen. 

**Entwicklerhinweis:** Preistreiber wie Haarlänge nur abfragen, wenn sie für diese Leistung relevant sind. Verbleibende Unsicherheit samt Klärungsschritt erklären. Keine genaue Endsumme behaupten, wenn sie noch offen ist. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Kunde wählt den passenden Schnitt und sieht, ob Waschen enthalten ist; ein zusätzlich gewähltes Extra aktualisiert Preis und Dauer. 

#### **Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Verständnis der Begriffe und Preisspannen prüfen; mit Salons tatsächliche Preisregeln klären. 

### **K4-UC03 Gastbuchung mit wenigen Angaben** 

**Bezug im Quelltranskript:** P050–P063 

**Simulierter Interviewhinweis:** Pflichtregistrierung und unnötige Angaben führen bei anderen Versuchen zum Abbruch. 

**Abgeleitete Funktionalität:** Gastbuchung; Kontaktdaten erst nach Leistungs- und Zeitwahl. 

**Entwicklerhinweis:** Nur salonseitig benötigte Kontaktfelder verpflichtend machen. Bestehendes Konto als freiwillige Hilfe anbieten; kein Konto durch bloße E-Mail-Angabe anlegen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Neukunde schließt ohne Registrierung ab und erhält einen geschützten Verwaltungslink. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Abschlussquote und Feldverständnis testen; Kontowert getrennt untersuchen. 

### **K4-UC04 Passende Person ohne Wahlpflicht** 

**Bezug im Quelltranskript:** P037–P047; P097–P105 

**Simulierter Interviewhinweis:** Beim neuen Salon hat Daniel keine Wunschperson, möchte aber wissen, wem er vertraut. 

**Abgeleitete Funktionalität:** Option Keine Präferenz; qualifizierte freie Personen und kurze Profile anzeigen. 

**Entwicklerhinweis:** Nur Personen anbieten, die die gewählte Leistung durchführen dürfen. Zugewiesene Person spätestens in der Zusammenfassung nennen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Ohne Personenpräferenz werden geeignete Zeiten gezeigt; der gebuchte Mitarbeitende steht in der Bestätigung. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Prüfen, ob freie Zuweisung akzeptiert wird und wann Profile nötig sind. 

### **K4-UC05 Eindeutige Bestätigung und Kalendereintrag** 

**Bezug im Quelltranskript:** P006–P009; P050–P063 

**Simulierter Interviewhinweis:** Erfolgsseite und E-Mail bestätigen den Termin; Kalenderübernahme wäre hilfreich. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 24 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Abgeleitete Funktionalität:** Abschlussseite, Bestätigung und Kalenderdatei mit Zeit, Ort, Leistung und Person. 

**Entwicklerhinweis:** Nur nach erfolgreicher Speicherung Bestätigt anzeigen. Doppeltes Absenden erzeugt keinen zweiten Termin. Versandfehler getrennt vom Buchungsstatus behandeln; Änderungslink schützen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach Abschluss existiert genau ein Termin. Bei fehlender E-Mail kann der Kunde die bestätigten Details sehen und die Nachricht erneut anfordern. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Abschlusszustand und Kalenderimport am Smartphone prüfen. 

### **K4-UC06 Sichere Umbuchung und Stornierung** 

**Bezug im Quelltranskript:** P066–P077 

**Simulierter Interviewhinweis:** Eine Änderung per E-Mail-Link gelang; Klarheit über den entfallenen alten Termin ist wichtig. 

**Abgeleitete Funktionalität:** Verwaltungslink, alte und neue Zeit vergleichen, Fristen und gegebenenfalls Kosten vor Abschluss zeigen. 

**Entwicklerhinweis:** Neue Kapazität sichern und Änderung als zusammenhängenden Vorgang speichern. Bei Fehler bleibt die alte Buchung gültig. Stornierung ausdrücklich bestätigen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach erfolgreicher Umbuchung ist nur die neue Zeit gebucht; bei fehlgeschlagener Änderung bleibt die alte Zeit erhalten. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Fristen mit Salons festlegen; Kunden müssen Zustand und Folgen sicher verstehen. 

### **K4-UC07 Erinnerungen nach Kontaktpräferenz** 

**Bezug im Quelltranskript:** P066–P077 

**Simulierter Interviewhinweis:** Daniel schildert einen verpassten Salontermin und wünscht Erinnerungen ein bis zwei Tage vorher. 

**Abgeleitete Funktionalität:** Erinnerung mit Termindaten und direktem Verwaltungslink. 

**Entwicklerhinweis:** Zeitpunkt und Kanal konfigurierbar machen; bei Umbuchung alte Erinnerungen aufheben. Buchung bleibt auch bei fehlgeschlagenem Nachrichtenversand bestehen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach Änderung wird an die neue Zeit erinnert; nach Absage wird keine alte Erinnerung verschickt. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Geeignete Zeitpunkte testen; No-show-Effekt erst mit realen Daten bewerten. 

### **K4-UC08 Alternativen und freiwillige Warteliste** 

**Bezug im Quelltranskript:** P097–P105; P123–P134 

**Simulierter Interviewhinweis:** Bei fehlenden Terminen helfen Alternativen oder eine Nachricht bei früherer Verfügbarkeit. 

**Abgeleitete Funktionalität:** Nahe Zeiten und freiwillige Wartelistenanfrage mit Wunschfenster anbieten. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 25 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Benachrichtigung ist ein Angebot, keine automatische Umbuchung. Annahmefrist erklären und Kapazität bei Annahme erneut sichern. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Ein Kunde behält seinen bestehenden Termin, bis er einen angebotenen früheren Termin ausdrücklich annimmt. 

**Priorität als Hypothese:** Erweiterung 

**Mit realen Kunden / Salons prüfen:** Nachfrage, Reaktionsfenster und Mehrfachangebote mit Salons prüfen. 

### **K4-UC09 Optionale Entscheidungshilfe und Extras** 

**Bezug im Quelltranskript:** P123–P135 

**Simulierter Interviewhinweis:** Daniel schlägt Neukundenempfehlungen und zusätzliche Pflegeoptionen vor. 

**Abgeleitete Funktionalität:** Kurze Fragen zur Orientierung; passende Leistungen erläutern; Extras bewusst auswählbar machen. 

**Entwicklerhinweis:** Empfehlung begründen, Preis und Mehrdauer zeigen. Keine vorausgewählten kostenpflichtigen Extras; Acht-Wochen-Schwelle nicht ohne Salonregel übernehmen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Kunde kann eine Empfehlung ablehnen; ohne aktive Extrawahl entsteht kein Zuschlag. 

**Priorität als Hypothese:** Zu validierende Idee 

**Mit realen Kunden / Salons prüfen:** Prüfen, ob Hilfe Unsicherheit reduziert oder den Prozess verlängert. 

### **K4-UC10 Ehrliche Hinweise auf verfügbare Plätze** 

**Bezug im Quelltranskript:** P123–P134 

**Simulierter Interviewhinweis:** Als Idee nennt Daniel Hinweise auf wenige verbleibende Zeiten. 

**Abgeleitete Funktionalität:** Optional verfügbare Termine im konkreten Fenster zählen. 

**Entwicklerhinweis:** Nur aus aktuellen echten Slots ableiten; keine künstlichen Countdown-Uhren. Zeitfenster und Aktualität nennen; parallel belegte Kapazität berücksichtigen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Ein Hinweis auf letzte freie Zeiten verschwindet oder wird korrigiert, sobald sich die tatsächliche Verfügbarkeit ändert. 

**Priorität als Hypothese:** Nachrangige Idee 

**Mit realen Kunden / Salons prüfen:** Nutzen und wahrgenommenen Buchungsdruck prüfen; keine unbelegte Conversion-Wirkung annehmen. 

#### **ÜBERGREIFENDE PRIORISIERUNG** 

**Priorisierung:** verständlicher Leistungsumfang und Preis, frühe passende Verfügbarkeit, Gastbuchung, sichere Bestätigung und Terminverwaltung zuerst prüfen. Warteliste, Empfehlung und Knappheitshinweis sind Erweiterungshypothesen. Die technische Umsetzung muss Preise, Qualifikationen, freie Kapazitäten und Buchungsstatus aus einer konsistenten Salonkonfiguration beziehen. 

#### **FORSCHUNGSFRAGEN FÜR REALE VALIDIERUNG** 

Verstehen Neukunden Leistungsumfang und Endpreis? Welche Unsicherheiten bleiben vor dem Abschluss? 

Wann akzeptieren Kunden ein Konto? Welche Angaben sind für eine erste Buchung tatsächlich nötig? 

Welche Fotos, Bewertungen und Personeninfos helfen bei der Wahl eines unbekannten Salons? 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 26 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

Wann helfen Alternativen oder Wartelisten? Wie sollen Kunden einen früheren Termin annehmen? 

Erleichtern Empfehlungen die Wahl? Wirken Zusatzangebote und Hinweise auf knappe Zeiten als Druck? 

Diese Folie verdichtet das bereitgestellte KI-Transkript. Die Notizen enthalten umsetzbare Vorschläge und Prüfkriterien; sie belegen weder Markthäufigkeiten noch Nutzerakzeptanz oder technische Wirksamkeit. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 27 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **K5 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K5_Napkin_Familienbuchungen_Sandra.pptx 

#### **NAPKIN K5 – SANDRA** 

#### **METHODIK UND EVIDENZGRENZE** 

**Quelle:** K5_Sandra_Vollstaendiges_Transkript.docx, Absatzreferenzen P000 ff. ab null einschließlich leerer Absätze. Synthetisches Interview mit einer anderen KI, keine empirischen Nutzerbefunde. P000–P025 enthalten Rollenbriefing und Hypothesen; sie werden nicht als unabhängige Interviewaussagen gewertet. Das Briefing legt Familienkoordination bereits nahe und grenzt Sandra von Daniel ab. P068 bewertet die Familienansicht positiv und fragt gezielt nach einem Konto; Zustimmung ist daher eine beeinflusste Konzeptreaktion. Das Datum auf der Folie bezeichnet die Auswertung. 

#### **KERNAUSSAGE** 

Sandra muss mehrere Personen, Zeiten und Zuständigkeiten zusammenführen. Im geschilderten letzten Prozess funktionieren Einzelbuchungen, verursachen aber doppelte Eingabe, eine Lücke und getrennte Bestätigungen. Eine gemeinsame Suche und Übersicht könnten Aufwand reduzieren. Ein Konto ist an echten Wiederverwendungsnutzen geknüpft. Preis spielt mit, ersetzt aber nicht die zeitliche Passung. 

#### **EINORDNUNG UND OFFENE PUNKTE** 

Familienangebote, automatische Kalenderprüfung, Wartelisten und Wiederbuchung sind Wünsche, keine erprobten Funktionen. Das verpasste Beispiel betrifft eine andere Dienstleistung, keinen nachgewiesenen Salon-No-show. Beispielnamen und Beispielzeiten sind keine gesicherten Stammdaten. Parallelbehandlung ist nicht automatisch sinnvoll, wenn das Kind Betreuung braucht. Keine Zahlungsbereitschaft aus der Kontozustimmung ableiten. 

#### **USE CASES UND ENTWICKLERHINWEISE** 

### **K5-UC01 Mehrere Personen in einem Vorgang** 

**Bezug im Quelltranskript:** P046–P066; P103–P133 

**Simulierter Interviewhinweis:** Nach der eigenen Buchung muss Sandra für ihr Kind neu beginnen und Kontaktdaten wiederholen. 

**Abgeleitete Funktionalität:** Weitere Person hinzufügen; je Person Leistung und gegebenenfalls Wunschperson wählen; gemeinsame Kontaktdaten einmal erfassen. 

**Entwicklerhinweis:** Buchende Kontaktperson von behandelten Personen trennen. Alter nur abfragen, wenn für Leistung oder Planung erforderlich. Unnötige Kinderangaben vermeiden. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Sandra stellt zwei Leistungen zusammen und gibt ihre Kontaktangaben einmal ein, bevor sie passende Zeiten sucht. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Reale Häufigkeit und Mindestangaben für Familienbuchungen prüfen. 

### **K5-UC02 Gemeinsame Kapazitätssuche** 

**Bezug im Quelltranskript:** P046–P066; P136–P163 

**Simulierter Interviewhinweis:** Sandra wünscht nacheinander oder parallel liegende Zeiten statt mehrerer Wege. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 28 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Abgeleitete Funktionalität:** Zeitfenster, Reihenfolge und zulässige Überschneidung berücksichtigen; mehrere Kombinationen anbieten. 

**Entwicklerhinweis:** Dauer, Qualifikation, Mitarbeitende und benötigte Ressourcen je Leistung prüfen. Bei betreuungsbedürftigem Kind parallele Elternbehandlung nur nach geklärter Betreuung anbieten. Keine bloße Suche nach gleichen Startzeiten. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Eine gewählte Kombination enthält tatsächlich freie Kapazität für beide Personen und zeigt Lücke sowie Gesamtaufenthalt. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Mit Kunden und Salons Reihenfolge, Betreuungsbedarf und tolerierte Wartezeit testen. 

### **K5-UC03 Familienbuchung vollständig bestätigen** 

**Bezug im Quelltranskript:** P103–P133; P166–P193 

**Simulierter Interviewhinweis:** Getrennte Bestätigungen machen unklar, ob alle gewünschten Personen eingeplant sind. 

**Abgeleitete Funktionalität:** Gemeinsame Zusammenfassung mit Einzelstatus, Leistungen, Personen, Zeiten und Gesamtpreis. 

**Entwicklerhinweis:** Gruppenreservierung kurz sichern und als zusammenhängende Buchung abschließen. Falls ein Teil ausfällt, nicht Familienbuchung bestätigt anzeigen. Teilbuchung nur mit bewusster Zustimmung anbieten. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Fällt ein Slot vor Abschluss weg, erhält Sandra eine verständliche Alternative; ohne Zustimmung entsteht keine unvollständige Familienbuchung. 

**Priorität als Hypothese:** Kernkandidat; technische Ableitung 

**Mit realen Kunden / Salons prüfen:** Verständnis von Gesamt- und Teilstatus sowie reale technische Transaktionsmöglichkeiten prüfen. 

### **K5-UC04 Gastbuchung und freiwilliges Familienkonto** 

**Bezug im Quelltranskript:** P068–P100 

**Simulierter Interviewhinweis:** Ein Konto ist akzeptabel, wenn es Profile und wiederkehrende Eingaben erspart; Einzelbuchung soll als Gast gehen. 

**Abgeleitete Funktionalität:** Nach erfolgreicher Gastbuchung freiwillige Übernahme in ein Konto; Personenprofile und Favoriten verwalten. 

**Entwicklerhinweis:** Keine automatische Kontoanlage. Besitz der Kontaktadresse verifizieren; gespeicherte Profile und Zugriffsrechte klar anzeigen und änderbar machen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Sandra bucht als Gast und kann anschließend vorhandene Eingaben freiwillig übernehmen, ohne den Termin erneut buchen zu müssen. 

**Priorität als Hypothese:** Kernnahe Erweiterung 

**Mit realen Kunden / Salons prüfen:** Konzeptreaktion nicht mit Adoption verwechseln; tatsächlichen Wiederverwendungsnutzen testen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 29 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **K5-UC05 Einzelne oder gemeinsame Umbuchung** 

**Bezug im Quelltranskript:** P166–P193; P196–P241 

**Simulierter Interviewhinweis:** Nach einer Änderung kontrolliert Sandra selbst, ob die anderen Termine bestehen bleiben. 

**Abgeleitete Funktionalität:** Nur dieses Mitglied oder gesamte Gruppe ändern; Auswirkungen vor Abschluss zeigen. 

**Entwicklerhinweis:** Nicht ausgewählte Termine bleiben erhalten. Bei Gruppenänderung neue Kapazität vollständig sichern, bevor alte freigegeben wird. Verknüpfte Reihenfolge erneut prüfen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nur der Kindtermin wird verschoben; die eigene Buchung bleibt unverändert und beide aktuellen Zeiten stehen in der neuen Übersicht. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Auswahl und Auswirkungen mit Familien am Prototyp prüfen. 

### **K5-UC06 Absage mit optionaler Ersatzsuche** 

**Bezug im Quelltranskript:** P196–P241 

**Simulierter Interviewhinweis:** Bei Krankheit wird abgesagt; anschließend muss Sandra Ersatzzeiten neu suchen. 

**Abgeleitete Funktionalität:** Einzelabsage, gemeinsame Absage und freiwilliger Einstieg in Ersatzsuche. 

**Entwicklerhinweis:** Absage und Ersatzbuchung getrennt bestätigen. Eine Suche darf erfolgreiche Absage nicht rückgängig machen; Fristen und Kosten vorher nennen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Kindtermin ist abgesagt, eigener Termin bleibt; eine spätere Ersatzbuchung wird als neuer bestätigter Termin dargestellt. 

#### **Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Krankheitsfälle, knappe Kapazität und salonseitige Absageregeln real klären. 

### **K5-UC07 Gebündelte Erinnerungen und berechtigtes Teilen** 

**Bezug im Quelltranskript:** P196–P241; P300–P306 

**Simulierter Interviewhinweis:** Sandra wünscht Erinnerungen für alle Termine und Weitergabe an eine Begleitperson. 

**Abgeleitete Funktionalität:** Gemeinsame Erinnerung; einzelne Termindetails gezielt mit Begleitperson teilen. 

**Entwicklerhinweis:** Empfänger und Berechtigungen trennen: Information erlaubt nicht automatisch Änderung. Weitergabe bewusst bestätigen; keinen Zugang zum ganzen Haushalt voraussetzen. Aktualisierte oder abgesagte Termine berücksichtigen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Begleitperson erhält den relevanten Kindtermin; sie sieht keine anderen Familienbuchungen und kann ohne entsprechende Berechtigung nichts ändern. 

#### **Priorität als Hypothese:** Kernnahe Erweiterung 

**Mit realen Kunden / Salons prüfen:** Bevorzugte Kanäle, Erinnerungszeitpunkte und Aufgabenverteilung prüfen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 30 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

### **K5-UC08 Planung mit selbst gewählten Zeitfenstern** 

**Bezug im Quelltranskript:** P136–P163; P247–P281 

**Simulierter Interviewhinweis:** Termine müssen zwischen Schule, Arbeit und anderen Verpflichtungen passen. 

**Abgeleitete Funktionalität:** Manuelle freie Fenster als Basiseinstieg; Kalenderabgleich optional. 

**Entwicklerhinweis:** Externer Kalender nur nach ausdrücklicher Verbindung; soweit möglich Verfügbarkeit statt Ereignisinhalte verwenden. Ohne Verbindung bleibt volle Suche möglich. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Sandra nennt einen Nachmittag als freies Fenster und bekommt passende Kombinationen ohne Kalenderzugriff. 

**Priorität als Hypothese:** Zeitfenster Kern; Integration später 

**Mit realen Kunden / Salons prüfen:** Nutzen und Aufwand eines Kalenderabgleichs getrennt von der einfachen Fenstersuche prüfen. 

### **K5-UC09 Warteliste für eine passende Kombination** 

**Bezug im Quelltranskript:** P308–P335 

**Simulierter Interviewhinweis:** Freie Lücken oder Nachrückplätze könnten die Planung erleichtern. 

**Abgeleitete Funktionalität:** Warteliste mit Personen, Leistungen, Zeitfenster und Kombinationswunsch. 

**Entwicklerhinweis:** Nicht einen einzelnen passenden Slot als vollständigen Familienersatz anbieten. Bestehende Buchungen bis zur ausdrücklichen Annahme behalten; Gruppe bei Annahme erneut prüfen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Ein früherer Block wird angeboten; Sandra kann ablehnen und behält alle bisherigen Termine. 

**Priorität als Hypothese:** Erweiterung 

**Mit realen Kunden / Salons prüfen:** Reale Nachfrage und salonseitige Handhabung komplexer Nachrückwünsche prüfen. 

### **K5-UC10 Wiederbuchung als freiwilliger Vorschlag** 

**Bezug im Quelltranskript:** P247–P281; P338–P345 

**Simulierter Interviewhinweis:** Sandra nennt wiederkehrende Termine etwa alle sechs bis acht Wochen und einen Terminassistenten als Idee. 

**Abgeleitete Funktionalität:** Vorherige Personen und Leistungen als Vorschlag laden; neue Zeiten bewusst auswählen. 

**Entwicklerhinweis:** Keinen Termin automatisch erzeugen. Frühere Dauer, Leistung und Preis gegen aktuellen Katalog prüfen; Intervalle einstellbar statt universal festlegen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Sandra übernimmt frühere Leistungen, sieht aktuelle Preise und bestätigt einen neu gewählten Familienblock ausdrücklich. 

**Priorität als Hypothese:** Erweiterung 

**Mit realen Kunden / Salons prüfen:** Erinnerungsintervalle, Akzeptanz und Pflegeaufwand gespeicherter Angaben testen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 31 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

#### **ÜBERGREIFENDE PRIORISIERUNG** 

**Priorisierung:** gemeinsame Eingabe, korrekte Kombinationen, Gesamtübersicht sowie sichere Einzeländerung zuerst validieren. Familienkonto, Teilen, Kalenderintegration und Assistent sind eigene Hypothesen. Gruppierung im Datenmodell ersetzt keine Reservierungslogik: alle Einzeltermine benötigen klare Status, Ressourcen und Änderungsregeln. 

#### **FORSCHUNGSFRAGEN FÜR REALE VALIDIERUNG** 

Wie oft werden mehrere Personen gemeinsam gebucht? Wann sind parallele Termine wegen Betreuung ungeeignet? 

**Welche Kombination ist wichtiger:** kurze Wartezeit, gleiche Person, niedriger Preis oder früher Termin? Welchen konkreten Nutzen bietet ein Familienkonto? Welche Angaben sollen gespeichert werden? 

Wie verstehen Kunden einzelne Änderungen, gemeinsame Buchung und einen nur teilweise verfügbaren Block? 

Wer darf Termine sehen, ändern oder Erinnerungen erhalten? Wie lassen sich Begleitpersonen einfach einbeziehen? 

Diese Folie verdichtet das bereitgestellte KI-Transkript. Die Notizen enthalten umsetzbare Vorschläge und Prüfkriterien; sie belegen weder Markthäufigkeiten noch Nutzerakzeptanz oder technische Wirksamkeit. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 32 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

## **K6 Vollständige Entwicklerhinweise und Use Cases** 

**Quell-PowerPoint** K6_Napkin_Vertraute_Buchungsroutine_Klaus.pptx 

#### **NAPKIN K6 – KLAUS** 

#### **METHODIK UND EVIDENZGRENZE** 

**Quelle:** K6_Klaus_Vollstaendiges_Transkript.docx, Absatzreferenzen P000 ff. ab null einschließlich leerer Absätze. Mit anderer KI geführtes synthetisches Interview; keine empirischen Nutzerbefunde. Rollenprofil in P000–P013 setzt Loyalität und geringe digitale Routine voraus. Diese Merkmale dürfen nicht pauschal aus dem Alter abgeleitet werden. Der UI-Rest in P014 ist kein Interviewbefund. Das Foliendatum ist das Auswertungsdatum. 

#### **KERNAUSSAGE** 

Klaus schätzt, dass der Salon seine gewohnte Leistung und Person kennt und telefonisch nur passende Zeiten zur Auswahl stellt. Ein Onlineprozess müsste diese Orientierung verständlich abbilden. Die letzte erfolgreiche Buchung erfolgte telefonisch. Im Transkript werden frühere abgebrochene Onlineversuche beschrieben; es liegt keine beobachtete erfolgreich abgeschlossene erste Onlinebuchung vor. 

#### **EINORDNUNG UND OFFENE PUNKTE** 

Das Rollenprofil und die später erwähnten Onlineversuche passen nicht vollständig zusammen; ausgewertet wird der berichtete Ablauf. P099 enthält die mehrdeutige Formulierung Das nimmt mir Sicherheit, während der Kontext Vertrautheit als positiv beschreibt; keine eigenständige negative Anforderung daraus ableiten. Beispielnamen sind keine echten Stammdaten. Hypothetische Altersvergleiche und ärztliche oder Einkaufsanalogien sind keine externe Evidenz. Die genannte Buchungsdauer von etwa zwei Minuten ist eine Schilderung, kein getesteter Benchmark. 

#### **USE CASES UND ENTWICKLERHINWEISE** 

### **K6-UC01 Ruhiger und verständlicher Buchungseinstieg** 

**Bezug im Quelltranskript:** P017–P025; P063–P086; P128–P167 

**Simulierter Interviewhinweis:** Klaus verliert bei vielen Schritten und unklarer Reihenfolge die Orientierung. 

**Abgeleitete Funktionalität:** Klar benannte Schritte, gut lesbare Texte und Bedienelemente, wenige relevante Optionen; Zurück ohne Datenverlust. 

**Entwicklerhinweis:** Verständliche Begriffe statt Fachkürzel; sichtbare Auswahl und Fehler direkt am betroffenen Feld. Bedienbarkeit am Smartphone und mit Tastatur prüfen, keine Altersannahmen in die Oberfläche einbauen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Ein Nutzer mit geringer digitaler Routine findet seine Leistung, prüft Daten und erkennt den Abschluss ohne Hilfe. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Aufgabentest mit tatsächlichen unterschiedlichen digitalen Fähigkeiten, nicht bloß Altersgruppen. 

### **K6-UC02 Wunschperson früh auswählen** 

**Bezug im Quelltranskript:** P089–P125 

**Simulierter Interviewhinweis:** Die vertraute Person ist wichtiger als der früheste Termin. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 33 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Abgeleitete Funktionalität:** Person zuerst als möglicher Einstieg; freie Zeiten für deren geeignete Leistungen anzeigen. 

**Entwicklerhinweis:** Personenfilter nicht bei Datumwechsel verlieren. Qualifikation und Ressourcen prüfen. Keine stille Zuweisung einer anderen Person. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Klaus wählt seine gewohnte Person und erhält ausschließlich deren tatsächlich buchbare Zeiten. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Einstiegsreihenfolge und Flexibilität bei Stammkunden testen. 

### **K6-UC03 Gewohnte Buchung geschützt wiederverwenden** 

**Bezug im Quelltranskript:** P224–P266; P293–P316 

**Simulierter Interviewhinweis:** Weniger Neueingabe und wieder dieselbe Leistung würden den Ablauf erleichtern. 

**Abgeleitete Funktionalität:** Vergangene Leistung und Wunschperson als bearbeitbare Vorlage laden. 

**Entwicklerhinweis:** Identität über verifizierten Zugang oder geschützten Link zuordnen, nicht anhand eines eingegebenen Namens. Aktuelle Verfügbarkeit und Katalog prüfen; keine alte Zeit kopieren. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Klaus übernimmt die Vorlage, sieht aktuelle Angaben und wählt einen neuen Termin bewusst aus. 

**Priorität als Hypothese:** Kernnahe Erweiterung 

**Mit realen Kunden / Salons prüfen:** Akzeptanz der Wiedererkennung, Nutzen und verständliche Zugangsmethode prüfen. 

### **K6-UC04 Gastbuchung ohne Kontozwang** 

**Bezug im Quelltranskript:** P028–P047; P128–P167 

**Simulierter Interviewhinweis:** Ein Onlineversuch endete bei Pflichtregistrierung, danach telefonierte Klaus. 

**Abgeleitete Funktionalität:** Kurze Gastbuchung mit notwendigen Kontaktdaten und anschließendem Verwaltungslink. 

**Entwicklerhinweis:** Konto freiwillig; nur erforderliche Angaben verpflichtend. Linkzugriff schützen und bei Problemen persönliche Hilfe ermöglichen. Nicht verifizierten Gästen keine früheren Buchungen offenlegen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Klaus kann ohne Passwort einen Termin bestätigen und später über einen geschützten Link verwalten. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Verständnis des Links und Kontaktanforderungen prüfen. 

### **K6-UC05 Gewohnte Leistung mit aktuellen Angaben** 

**Bezug im Quelltranskript:** P089–P125; P224–P266 

**Simulierter Interviewhinweis:** Gewohnter Schnitt braucht wenig Auswahl; Preis soll trotzdem bekannt sein. 

**Abgeleitete Funktionalität:** Einfache Leistungsbeschreibung mit aktuellem Umfang, Preis und Dauer; optionale Details. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 34 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Salon muss Leistungsvorlagen pflegen. Frühere Preise nicht als gültig übernehmen. Nicht verfügbare Altleistungen erklären; keine zusätzlichen Leistungen vorauswählen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Bei Wiederbuchung erkennt Klaus seine übliche Leistung und eine Preisänderung vor der Bestätigung. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Leistungsnamen, geänderte Angebote und Informationsmenge real testen. 

### **K6-UC06 Zusammenfassung und eindeutiger Abschluss** 

**Bezug im Quelltranskript:** P128–P167 

**Simulierter Interviewhinweis:** Online ist unklar, ob der letzte Schritt bereits einen festen Termin erzeugt. 

**Abgeleitete Funktionalität:** Prüfseite mit Leistung, Person, Datum, Zeit und Ort; eindeutige Abschlussaktion und Erfolgsseite. 

**Entwicklerhinweis:** Bestätigt nur nach Speicherung. Wiederholtes Absenden darf nicht doppelt buchen. Bestätigungskanal auswählen oder klar erklären; Versandproblem vom Terminstatus trennen. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach Abschluss steht genau ein bestätigter Termin; Klaus erkennt Zustand und alle Daten, auch wenn die Nachricht verspätet ankommt. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Statusverständnis anhand echter Aufgaben und absichtlicher Versandstörung prüfen. 

### **K6-UC07 Erinnerung passend zur Vorlaufzeit** 

**Bezug im Quelltranskript:** P063–P086; P170–P218 

**Simulierter Interviewhinweis:** Klaus notiert selbst und hat einmal trotzdem einen Termin vergessen. 

**Abgeleitete Funktionalität:** Gewünschter Kanal und verständliche Erinnerung mit Ort, Zeit, Person und Kontakt zur Änderung. 

**Entwicklerhinweis:** Erinnerungszeit konfigurierbar; bei Änderung alte Nachrichtentermine entfernen. Kein Zwang zu App oder zusätzlichem Konto. Versand überwachen, Erfolg nicht als Anwesenheitsgarantie deuten. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach Umbuchung erhält Klaus nur eine Erinnerung an den gültigen Termin; nach Absage keine. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Kanalpräferenzen und Zeitpunkte ermitteln; tatsächlichen No-show-Effekt getrennt messen. 

### **K6-UC08 Umbuchung mit altem und neuem Termin** 

**Bezug im Quelltranskript:** P170–P218 

**Simulierter Interviewhinweis:** Bei telefonischer Änderung ist wichtig, dass die alte Zeit entfällt und die vertraute Person bleibt. 

**Abgeleitete Funktionalität:** Alte und neue Details gegenüberstellen; Personwechsel hervorheben; Änderung ausdrücklich bestätigen. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 35 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

**Entwicklerhinweis:** Neue Kapazität sichern, dann alte freigeben. Bei Fehler bleibt die alte Buchung gültig. Stornierung und Ersatzsuche getrennt behandeln. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Eine fehlgeschlagene Umbuchung verändert den gültigen Termin nicht; nach Erfolg wird nur der neue Zeitpunkt bestätigt. 

**Priorität als Hypothese:** Kernkandidat 

**Mit realen Kunden / Salons prüfen:** Verständnis von Datenvergleich und Fehlerfall mit wenig geübten Nutzern testen. 

### **K6-UC09 Persönliche Hilfe im gemeinsamen Kalender** 

**Bezug im Quelltranskript:** P017–P025; P128–P167; P170–P218 

**Simulierter Interviewhinweis:** Bei Unsicherheit oder Abbruch ruft Klaus an und erwartet den vertrauten Service. 

**Abgeleitete Funktionalität:** Sichtbare Telefonnummer und Hilfe; Salon kann Buchungen aus jedem Kanal einsehen und ändern. 

**Entwicklerhinweis:** Telefonische und digitale Termine aus derselben Kapazität planen. Offene Versuche nicht als bestätigte Termine behandeln. Kundenzuordnung nur mit geeigneter Prüfung; keine Details öffentlich verraten. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Nach Onlineabbruch kann der Salon helfen, ohne einen zweiten Termin oder widersprüchliche Belegung zu erzeugen. 

**Priorität als Hypothese:** Kernkandidat; technische Ableitung 

**Mit realen Kunden / Salons prüfen:** Salonabläufe bei Hilfsanrufen und Übergabe zwischen Kanälen prüfen. 

### **K6-UC10 Vertretung und nächste Routine bewusst wählen** 

**Bezug im Quelltranskript:** P269–P290 

**Simulierter Interviewhinweis:** Bei Urlaub braucht Klaus Orientierung; Wiederbuchung nach einigen Wochen wäre hilfreich. 

**Abgeleitete Funktionalität:** Nächste Zeit bei Wunschperson und geeignete Vertretung erklären; optional erneute Buchung vorschlagen. 

**Entwicklerhinweis:** Vertretung nur mit salonbestätigter Qualifikation anbieten, keine unbelegte Ähnlichkeit behaupten. Wiederbuchungsintervall als optionalen Vorschlag führen. Kein automatischer Termin und kein stiller Personenwechsel. 

**Prüfbarer Use Case / Akzeptanzkriterium:** Klaus kann auf seine vertraute Person warten, Vertretung wählen oder einen Wiederbuchungsvorschlag ablehnen. 

**Priorität als Hypothese:** Erweiterung 

**Mit realen Kunden / Salons prüfen:** Vertretungsbereitschaft und sinnvolle Intervalle am realen Stammkundenstamm testen. 

#### **ÜBERGREIFENDE PRIORISIERUNG** 

**Priorisierung:** übersichtliche Schritte, Wunschperson, Gastzugang, klare Zusammenfassung und sichere Änderungen zuerst prüfen. Wiedererkennung, Routinevorschläge und Vertretung benötigen eigene Validierung. Online darf den persönlichen Hilfskanal ergänzen; beide müssen dieselben gültigen Termine und Ressourcen verwenden. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 36 

Research & Development   /   Phase 1 Verstehen   /   Buchende K1 bis K6 

#### **FORSCHUNGSFRAGEN FÜR REALE VALIDIERUNG** 

Können Menschen mit wenig digitaler Routine den üblichen Termin ohne persönliche Hilfe buchen? 

**Welche Reihenfolge hilft Stammkunden:** Person, Leistung oder Zeit? Was darf sinnvoll gespeichert werden? Welche Formulierungen machen Abschluss, Bestätigung und Terminänderung eindeutig verständlich? Wann wird eine Vertretung akzeptiert? Wann warten Stammkunden lieber auf ihre vertraute Person? Welche Erinnerungen und Hilfsangebote unterstützen tatsächlich? Wann wird weiterhin das Telefon bevorzugt? 

Diese Folie verdichtet das bereitgestellte KI-Transkript. Die Notizen enthalten umsetzbare Vorschläge und Prüfkriterien; sie belegen weder Markthäufigkeiten noch Nutzerakzeptanz oder technische Wirksamkeit. 

KI-Simulationen · Auswertung 06.10.2026                                          Seite 37 

