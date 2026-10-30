import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { guestVars } from "../../server/brand.ts";
import { api } from "./api";

const STAND = "21. Oktober 2026";

export function MandantPrivacy() {
  return (
    <>
      <p>
        Diese Hinweise gelten für das Buchungswerkzeug Kalendaa (FLH DIGITAL), also für Anmeldung, Mandantenkonto und Kalender.
        Sie gelten für Sie als Mandant. Was Ihre Gäste im Buchungsfenster erfahren, steht in einer eigenen Erklärung auf der Buchungsseite.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich für Ihre Kontodaten ist die FLH GmbH, Carl-Zeiss-Ring 17, 85737 Ismaning, Telefon +49 89 4111 901 10,
        E-Mail mail@flh-mediadigital.de. Geschäftsführer sind Frough Hamid und Leon Hamid. Ein Datenschutzbeauftragter ist nicht benannt.
      </p>

      <h2>Kontodaten</h2>
      <p>Wenn wir Ihr Mandantenkonto anlegen und Sie sich anmelden, verarbeiten wir:</p>
      <ul>
        <li>Name und E-Mail-Adresse der anmeldeberechtigten Person</li>
        <li>das Passwort, ausschließlich als Prüfwert beim Anmeldedienst, nie im Klartext</li>
        <li>Ihre Rolle (Mandant) und die Zuordnung zu Ihrem Betrieb</li>
        <li>den Namen des Betriebs, Zeitzone, Leistungen, Preise, Kategorien und Öffnungszeiten</li>
      </ul>
      <p>
        Zweck ist der Vertrag über die Bereitstellung des Werkzeugs: Konto einrichten, Anmeldung prüfen, Kalender und Buchungsmaske betreiben.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Name, E-Mail und Passwort sind dafür erforderlich. Ohne diese Angaben gibt es kein Konto.
      </p>

      <h2>Anmeldung und Sitzung</h2>
      <p>
        Die Anmeldung läuft über Supabase Auth. Nach erfolgreicher Anmeldung setzen wir ein Sitzungs-Cookie mit dem Namen <code>sid</code>.
        Es enthält einen zufälligen Sitzungsschlüssel, ist nur über HTTP lesbar (httpOnly), im Live-Betrieb nur über eine verschlüsselte Verbindung gültig (secure) und auf SameSite=Lax gesetzt.
        In der Datenbank liegt nur ein Prüfwert dieses Schlüssels, zusammen mit der Ablaufzeit. Die Sitzung gilt sieben Tage, bis zur Abmeldung oder bis das Passwort neu gesetzt wird.
      </p>
      <p>
        Beim Zurücksetzen des Passworts schicken wir eine E-Mail mit einem einmaligen Link des Anmeldedienstes. Der darin enthaltene Zugriffsschlüssel wird im Sitzungsspeicher des Browsers unter dem Schlüssel <code>flh-recovery</code> gehalten, bis das neue Passwort gespeichert ist, eine Anmeldung oder Abmeldung im selben Tab erfolgt oder der Tab geschlossen wird.
      </p>
      <p>
        Zum Schutz vor Fehlversuchen merken wir uns für 15 Minuten im Arbeitsspeicher des Servers, wie oft eine IP-Adresse Anmeldung, Passwort-Mail oder Passwort-Setzen aufgerufen hat.
        Die IP-Adresse wird dafür nicht in die Datenbank geschrieben und nicht mit Ihrem Konto verknüpft. Nach 15 Minuten oder mit dem Neustart des Prozesses ist der Zähler weg.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse ist, Anmeldungen vor Ausprobieren von Passwörtern zu schützen.
        Sie können dieser Verarbeitung nach Art. 21 DSGVO widersprechen. Weil der Schutz ohne diesen Zähler nicht funktioniert, können wir die Anmeldung dann vorübergehend sperren.
      </p>

      <h2>Daten, die Sie für Ihren Betrieb eintragen</h2>
      <p>
        Namen und Fotos Ihrer Mitarbeiter, Ihr Logo, Sperrzeiten und die Termine Ihrer Gäste (Name, E-Mail, Telefon, Notiz, Leistung, Zeitpunkt, Status) speichern wir, weil Sie das im Kalender so anlegen oder weil ein Gast sie im Buchungsfenster einträgt.
        Verantwortlich für diese Daten gegenüber Mitarbeitern und Gästen sind Sie. Wir verarbeiten sie nur in Ihrem Auftrag und nach Ihrer Weisung, um Kalender, Buchungsmaske und die dazugehörigen E-Mails und SMS bereitzustellen (Art. 28 DSGVO).
        Fotos und Logo liegen in einem öffentlich abrufbaren Speicher, weil das Buchungsfenster sie anzeigt.
      </p>
      <p>
        Sie sind dafür zuständig, Ihre Mitarbeiter über Namen und Foto im Buchungsfenster zu informieren und Ihren Gästen die Erklärung im Buchungsfenster zur Verfügung zu stellen. Die Erklärung der Gäste nennt Ihren Betrieb als Verantwortlichen.
      </p>

      <h2>E-Mail</h2>
      <p>
        Passwort-Links versendet der Anmeldedienst Supabase. Buchungscodes und Bestätigungen an Gäste versendet im Live-Betrieb der SMTP-Dienst Mittwald CM Service GmbH &amp; Co. KG, Espelkamp.
        Die Anwendung selbst legt kein Mailarchiv an. Der Versanddienst verarbeitet Empfänger, Betreff und Inhalt, soweit das für die Zustellung nötig ist.
      </p>

      <h2>Empfänger</h2>
      <p>Wir geben Ihre Daten nicht weiter, außer an die Dienstleister, die den Betrieb technisch tragen:</p>
      <ul>
        <li>Supabase Inc., USA: Datenbank, Anmeldung und Bildspeicher</li>
        <li>Vercel Inc., USA: Hosting der Anwendung. Beim Aufruf können dort Verbindungsdaten anfallen (IP-Adresse, Zeitpunkt, aufgerufene Adresse). Die Anwendung speichert diese Protokolle nicht</li>
        <li>Mittwald CM Service GmbH &amp; Co. KG, Espelkamp: Versand der Buchungsmails</li>
      </ul>
      <p>
        Supabase und Vercel sitzen in den USA. Ob ein konkretes Projekt in der EU oder in den USA liegt, hängt von dessen Region ab.
        Soweit personenbezogene Daten in die USA übermittelt werden, geschieht das auf Grundlage eines Angemessenheitsbeschlusses, soweit der Empfänger darunter fällt, sonst auf Grundlage von Standardvertragsklauseln nach Art. 46 DSGVO.
        Mittwald verarbeitet in Deutschland.
      </p>

      <h2>Speicherdauer</h2>
      <p>
        Kontodaten speichern wir für die Dauer des Vertrags über das Werkzeug. Sitzungen enden nach sieben Tagen oder mit der Abmeldung.
        Der Zähler zur Anmeldebegrenzung liegt 15 Minuten im Arbeitsspeicher. Termine, Mitarbeiter und Bilder bleiben gespeichert, bis Sie sie ändern oder löschen oder das Mandantenkonto endet.
        Stornierte Termine bleiben mit den Gastangaben gespeichert, nur der Status wechselt. Eine automatische Löschfrist ist nicht eingerichtet.
        Neue Buchungen brauchen keinen Code. Ein älterer offener Code verfällt nach 15 Minuten, der Termin wird dann storniert. Der Prüfwert kann am stornierten Eintrag stehen bleiben und ist dann ungültig.
      </p>

      <h2>Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit (Art. 15 bis 20 DSGVO) sowie, soweit wir uns auf ein berechtigtes Interesse stützen, das Recht auf Widerspruch nach Art. 21 DSGVO.
        Eine Einwilligung holen wir für diese Verarbeitungen nicht ein. Ein Widerruf einer Einwilligung ist deshalb hier nicht der passende Weg.
        Es gibt keine automatisierte Entscheidung und kein Profiling nach Art. 22 DSGVO.
      </p>
      <p>
        Für die Daten Ihrer Gäste und Mitarbeiter nehmen Sie die Betroffenenrechte als Verantwortlicher selbst wahr. Wir unterstützen Sie dabei im Rahmen der Auftragsverarbeitung.
      </p>
      <p>
        Beschwerde können Sie bei einer Aufsichtsbehörde einlegen, insbesondere beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.
      </p>

      <h2>Cookies im Mandantenbereich</h2>
      <p>
        Das Cookie <code>sid</code> ist für die Anmeldung erforderlich. Dafür brauchen wir keine Einwilligung (§ 25 Abs. 2 Nr. 2 TDDDG).
        Werbung, Reichweitenmessung und Cookies Dritter setzen wir nicht.
      </p>
      <p className="note">Stand: {STAND}</p>
    </>
  );
}

export function GuestPrivacy({ tenantName }: { tenantName: string }) {
  return (
    <>
      <p>
        Diese Hinweise gelten für die Buchung eines Termins bei {tenantName} in diesem Fenster.
        Sie gelten für Sie als Gast. Die Erklärung des Software-Kontos des Betriebs ist eine andere Seite und betrifft Sie nicht.
        Was die Website außerhalb der Buchung verarbeitet, etwa eigene Statistik, richtet sich nach deren Datenschutzerklärung.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich für Ihre Termindaten ist {tenantName} (im Folgenden „der Betrieb“).
        Die Kontaktdaten stehen im Impressum der Website, in die dieses Fenster eingebunden ist.
      </p>
      <p>
        Die FLH GmbH, Carl-Zeiss-Ring 17, 85737 Ismaning, Telefon +49 89 4111 901 10, E-Mail mail@flh-mediadigital.de, betreibt nur die Technik (Auftragsverarbeiter nach Art. 28 DSGVO).
        Geschäftsführer sind Frough Hamid und Leon Hamid. Ein Datenschutzbeauftragter ist nicht benannt.
        Rufen Sie diese Seite ohne die Website des Betriebs auf oder finden Sie dort keine Kontaktangabe, schicken Sie Ihr Begehren an die genannte Adresse.
        FLH GmbH leitet Auskunft, Berichtigung und Löschung an den Betrieb weiter und setzt dessen Weisung um.
      </p>

      <h2>Welche Daten</h2>
      <p>Wenn Sie einen Termin buchen, verarbeitet der Betrieb über dieses Fenster:</p>
      <ul>
        <li>Ihren Namen und Ihre Telefonnummer. Beides ist nötig, sonst kann der Termin nicht geführt und die Bestätigung nicht zugestellt werden</li>
        <li>Ihre E-Mail-Adresse, wenn Sie sie eintragen</li>
        <li>eine Notiz, wenn Sie sie eintragen</li>
        <li>die gewählte Leistung, die gewünschte Person, Beginn und Ende</li>
        <li>eine Buchungsnummer, einen zufälligen Link zum Verschieben oder Absagen und den Status (bestätigt oder storniert)</li>
      </ul>
      <p>
        Namen und Fotos der auswählbaren Personen legt der Betrieb an. Das sind Angaben zu seinen Mitarbeitern, nicht zu Ihnen.
        Logo und Fotos liegen in einem öffentlich abrufbaren Speicher, weil dieses Fenster sie anzeigt.
      </p>
      <p>
        Zweck ist die Terminvereinbarung: den Termin speichern, ihn bestätigen, daran erinnern und das Verschieben oder Absagen ermöglichen.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, auch für E-Mail und Notiz, soweit Sie sie zur Buchung mitgeben.
      </p>

      <h2>E-Mail</h2>
      <p>
        Tragen Sie eine E-Mail ein, geht die Bestätigung sofort dorthin. Sie enthält Ihren Namen, die Leistung, gegebenenfalls die Person, die Uhrzeit und den Namen des Betriebs,
        einen Link zum Verschieben oder Absagen und eine Kalenderdatei (termin.ics) mit denselben Angaben.
        Zusätzlich geht dieselbe Bestätigung als SMS an Ihre Telefonnummer.
      </p>
      <p>
        Wurde der Termin mehr als 24 Stunden im Voraus gebucht, geht 24 Stunden vorher eine Erinnerung an diese E-Mail.
        Verschieben oder absagen Sie den Termin über den Link, und ist eine E-Mail hinterlegt, geht dazu eine Info-Mail.
      </p>
      <p>
        Den Versand übernimmt Mittwald CM Service GmbH &amp; Co. KG, Espelkamp, über den Mailserver der FLH GmbH.
        Die Anwendung legt kein Mailarchiv an. Der Versanddienst verarbeitet Empfänger, Betreff und Inhalt, soweit das für die Zustellung nötig ist.
      </p>

      <h2>SMS</h2>
      <p>
        Ohne E-Mail geht die Bestätigung nur als SMS an Ihre Telefonnummer. Mit E-Mail geht sie zusätzlich zur Mail.
        Die SMS nennt die Leistung, gegebenenfalls die Person, die Uhrzeit und den Link zum Verschieben oder Absagen.
      </p>
      <p>
        Wurde der Termin mehr als 24 Stunden im Voraus gebucht, geht 24 Stunden vorher immer eine Erinnerungs-SMS, auch wenn eine E-Mail hinterlegt ist.
        Ein SMS-Archiv legt die Anwendung nicht an.
      </p>
      <p>
        Den Versand übernimmt seven communications GmbH &amp; Co. KG, Willestr. 4–6, 24103 Kiel (seven.io). Die Verarbeitung findet in Deutschland statt.
      </p>

      <h2>Verschieben und Absagen</h2>
      <p>
        Der Link in der E-Mail und in der SMS öffnet eine Seite nur für diesen Termin. Der Schlüssel in der Adresse ist zufällig.
        Dort können Sie den Termin verschieben oder absagen. Die Seite zeigt die Kontaktdaten, die der Betrieb hinterlegt hat.
      </p>

      <h2>Kalender des Betriebs</h2>
      <p>
        Hat der Betrieb seinen Kalender mit Google verbunden, wird der Termin dorthin übernommen: Ihr Name, Telefon, E-Mail, Notiz, die Leistung, die Person und die Uhrzeit.
        Empfänger ist dann Google Ireland Limited, Irland. Ohne diese Verbindung bleibt der Termin im Kalender des Betriebs.
      </p>

      <h2>Schutz vor Missbrauch</h2>
      <p>
        Vor dem Absenden rechnet Ihr Browser eine kurze Aufgabe. Das Ergebnis prüfen wir auf unserem Server.
        Dabei wird kein Konto angelegt und nichts an einen anderen Anbieter geschickt.
      </p>
      <p>
        Für 15 Minuten zählt der Server im Arbeitsspeicher, wie oft eine IP-Adresse Buchungen anstößt.
        Dieselbe Grenze gilt für wiederholte Buchungen derselben Telefonnummer oder E-Mail-Adresse bei diesem Betrieb.
        Die IP-Adresse landet nicht in Ihrem Termineintrag. Der Zähler endet nach 15 Minuten oder mit dem Neustart des Prozesses.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse des Betriebs und der FLH GmbH ist, die Buchung vor automatisierten Anfragen zu schützen.
        Sie können nach Art. 21 DSGVO widersprechen. Ohne diesen Zähler können wir die Buchung vor massenhaften Anfragen nicht schützen.
      </p>

      <h2>Aufruf der Seite</h2>
      <p>
        Beim Laden prüft die Seite, ob in diesem Browser schon eine Anmeldung für das Werkzeug besteht. Als Gast wird dabei kein Konto angelegt und nichts zugeordnet.
        Ein Anmelde-Cookie setzen wir für Gäste nicht.
      </p>
      <p>
        Der Hoster kann Verbindungsdaten (IP-Adresse, Zeitpunkt, aufgerufene Adresse) in technischen Protokollen verarbeiten. Die Buchungsanwendung speichert diese Protokolle nicht.
        Wie lange der Hoster sie behält, bestimmt er.
      </p>
      <p>
        Ein Hinweis am unteren Rand erklärt, dass keine Werbe-Cookies gesetzt werden. Wenn Sie ihn schließen, merkt sich der Browser das lokal unter dem Schlüssel <code>flh-book-ok</code>, damit der Hinweis nicht bei jedem Aufruf wieder kommt.
        Dieser Eintrag enthält keine Buchungsdaten und wird nicht an uns gesendet. Für dieses Speichern brauchen wir keine Einwilligung, es ist nötig, um den Hinweis nicht erneut einzublenden (§ 25 Abs. 2 Nr. 2 TDDDG).
      </p>

      <h2>Empfänger</h2>
      <p>Ihre Termindaten sieht der Betrieb in seinem Kalender. Technisch verarbeiten sie außerdem:</p>
      <ul>
        <li>FLH GmbH, Ismaning, als Auftragsverarbeiter</li>
        <li>Supabase Inc., USA: Datenbank und, falls der Betrieb ein Logo oder Mitarbeiterfoto hinterlegt, der öffentliche Bildspeicher</li>
        <li>Vercel Inc., USA: Hosting der Anwendung</li>
        <li>Mittwald CM Service GmbH &amp; Co. KG, Espelkamp: E-Mail, wenn Sie eine Adresse angegeben haben</li>
        <li>seven communications GmbH &amp; Co. KG, Kiel: SMS an Ihre Telefonnummer</li>
        <li>Google Ireland Limited, Irland: nur wenn der Betrieb seinen Kalender mit Google verbunden hat</li>
      </ul>
      <p>
        Soweit Supabase oder Vercel Daten in den USA verarbeiten, geschieht das auf Grundlage eines Angemessenheitsbeschlusses, soweit der Empfänger darunter fällt, sonst auf Grundlage von Standardvertragsklauseln nach Art. 46 DSGVO.
        Mittwald und seven verarbeiten in Deutschland. Eine Weitergabe zu Werbezwecken findet nicht statt.
      </p>

      <h2>Speicherdauer</h2>
      <p>
        Der Termin bleibt gespeichert, solange der Betrieb ihn im Kalender führt. In diesem Fenster gibt es keine Löschfunktion für Gäste.
        Stornierte Termine behalten Name, E-Mail, Telefon und Notiz, nur der Status wechselt auf storniert. Eine automatische Löschfrist ist nicht eingerichtet.
        Löschung verlangen Sie beim Betrieb.
      </p>

      <h2>Rechte</h2>
      <p>
        Gegenüber dem Betrieb haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit (Art. 15 bis 20 DSGVO).
        Soweit die Verarbeitung auf dem berechtigten Interesse beruht, können Sie widersprechen (Art. 21 DSGVO).
        Die Buchung stützt sich auf den Termin, nicht auf eine Einwilligung. Im Formular bestätigen Sie, dass Sie diese Erklärung gelesen haben.
      </p>
      <p>
        Es gibt keine automatisierte Entscheidung und kein Profiling nach Art. 22 DSGVO.
        Beschwerde können Sie bei einer Aufsichtsbehörde einlegen, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes (Art. 77 DSGVO).
        Für die FLH GmbH als Auftragsverarbeiter ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach, zuständig.
      </p>
      <p className="note">Stand: 27. Oktober 2026</p>
    </>
  );
}

export function GuestPrivacyPage() {
  const { slug = "" } = useParams();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let on = true;
    api.pub(slug).then(
      (d) => { if (on) { setName(d.tenant.name); setBrand(d.tenant.brand ?? ""); } },
      () => { if (on) setMissing(true); },
    );
    return () => { on = false; };
  }, [slug]);

  useEffect(() => {
    const prev = document.title;
    document.title = name ? `Datenschutz · ${name}` : "Datenschutz";
    return () => { document.title = prev; };
  }, [name]);

  return (
    <div className={"book-page" + (brand ? " guest" : "")} style={guestVars(brand) as CSSProperties}>
      <article className="book legal-doc">
        <h1>Datenschutzerklärung</h1>
        {missing ? <p>Diese Buchung gibt es nicht.</p> : name ? <GuestPrivacy tenantName={name} /> : (
          <div className="skel-stack" role="status" aria-label="Laden">
            <span className="bone bone-line" />
            <span className="bone bone-line" />
            <span className="bone bone-line" />
          </div>
        )}
        <p><Link to={`/b/${slug}`}>Zurück zur Buchung</Link></p>
      </article>
    </div>
  );
}
