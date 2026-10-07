import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "./api";

const STAND = "6. Oktober 2026";

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
        Beim Zurücksetzen des Passworts schickt der Anmeldedienst eine E-Mail mit einem einmaligen Link. Der darin enthaltene Zugriffsschlüssel wird im Sitzungsspeicher des Browsers unter dem Schlüssel <code>flh-recovery</code> gehalten, bis das neue Passwort gespeichert ist, eine Anmeldung oder Abmeldung im selben Tab erfolgt oder der Tab geschlossen wird.
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
        Verantwortlich für diese Daten gegenüber Mitarbeitern und Gästen sind Sie. Wir verarbeiten sie nur in Ihrem Auftrag und nach Ihrer Weisung, um Kalender, Buchungsmaske und die dazugehörigen E-Mails bereitzustellen (Art. 28 DSGVO).
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
        Den Prüfwert des Buchungscodes löschen wir, sobald der Gast den Termin bestätigt. Läuft der Code nach 15 Minuten ab, wird der Termin storniert. Der Prüfwert kann am stornierten Eintrag stehen bleiben und ist dann ungültig.
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
        Diese Hinweise gelten für die Buchung eines Termins bei {tenantName}. Sie gelten für Sie als Gast.
        Die Erklärung des Software-Kontos des Betriebs ist eine andere Seite und betrifft Sie nicht.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        Verantwortlich für Ihre Termindaten ist {tenantName} (im Folgenden „der Betrieb“).
        Die Kontaktdaten stehen im Impressum der Website, in die dieses Buchungsfenster eingebunden ist.
        Dort finden Sie auch die Datenschutzerklärung der Website selbst. Was diese Website außerhalb der Buchung verarbeitet, etwa eigene Statistik, richtet sich nach deren Erklärung.
      </p>
      <p>
        Die FLH GmbH, Carl-Zeiss-Ring 17, 85737 Ismaning, Telefon +49 89 4111 901 10, E-Mail mail@flh-mediadigital.de, betreibt nur die Technik (Auftragsverarbeiter nach Art. 28 DSGVO).
        Rufen Sie diese Seite ohne die Website des Betriebs auf oder finden Sie dort keine Kontaktangabe, schicken Sie Ihr Begehren an diese Adresse.
        FLH GmbH leitet Auskunft, Berichtigung und Löschung an den Betrieb weiter und setzt dessen Weisung um. Ein Datenschutzbeauftragter der FLH GmbH ist nicht benannt.
      </p>

      <h2>Welche Daten</h2>
      <p>Wenn Sie einen Termin buchen, verarbeitet der Betrieb über dieses Fenster:</p>
      <ul>
        <li>Name und E-Mail-Adresse, beides Pflicht, sonst kann der Code nicht zugestellt und der Termin nicht geführt werden</li>
        <li>Telefon und Notiz, nur wenn Sie sie eintragen</li>
        <li>gewählte Leistung, gewünschte Person, Beginn und Ende</li>
        <li>eine Buchungsnummer und den Status (offen, bestätigt oder storniert)</li>
      </ul>
      <p>
        Namen und Fotos der auswählbaren Personen legt der Betrieb an. Das sind Angaben zu seinen Mitarbeitern, nicht zu Ihnen.
      </p>
      <p>
        Zweck ist die Terminanfrage und, nach Eingabe des Codes, die Terminvereinbarung mit dem Betrieb, einschließlich der Bestätigungsmail und der Kalenderdatei.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, auch für Telefon und Notiz, soweit Sie sie zur Buchung mitgeben.
      </p>

      <h2>Code und E-Mail</h2>
      <p>
        Vor der Bestätigung erzeugt das Fenster einen sechsstelligen Code und schickt ihn an Ihre E-Mail. Gespeichert wird nur ein Prüfwert, nicht der Code selbst.
        Der Code gilt 15 Minuten. Danach wird der offene Termin storniert. Mit der Bestätigung wird der Prüfwert gelöscht.
        Die Bestätigung enthält Ihren Namen, die Leistung, gegebenenfalls die Person, die Uhrzeit und den Namen des Betriebs, dazu eine Kalenderdatei (termin.ics) mit denselben Angaben.
      </p>
      <p>
        Den Versand übernimmt im Live-Betrieb Mittwald CM Service GmbH &amp; Co. KG, Espelkamp, über den Mailserver der FLH GmbH.
        Ein Mailarchiv legt die Anwendung nicht an.
      </p>

      <h2>Schutz vor Missbrauch</h2>
      <p>
        Für 15 Minuten zählt der Server im Arbeitsspeicher, wie oft eine IP-Adresse Buchungen anstößt und wie oft ein Code für eine bestimmte Buchung probiert wird.
        Dieselbe Grenze gilt für wiederholte Buchungen derselben E-Mail-Adresse bei diesem Betrieb. Die IP-Adresse landet nicht in Ihrem Termineintrag.
        Der Zähler endet nach 15 Minuten oder mit dem Neustart des Prozesses.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse des Betriebs und der FLH GmbH ist, die Buchung vor automatisierten Anfragen und vor dem Ausprobieren von Codes zu schützen.
        Sie können nach Art. 21 DSGVO widersprechen. Ohne diesen Zähler können wir die Buchung in dem Moment nicht offen halten.
      </p>

      <h2>Aufruf der Seite</h2>
      <p>
        Beim Laden prüft die Seite, ob in diesem Browser schon eine Anmeldung für das Werkzeug besteht. Als Gast wird dabei kein Konto angelegt und nichts zugeordnet.
        Der Hoster kann Verbindungsdaten (IP-Adresse, Zeitpunkt, aufgerufene Adresse) in technischen Protokollen verarbeiten. Die Buchungsanwendung speichert diese Protokolle nicht.
        Wie lange der Hoster sie behält, bestimmt er.
      </p>
      <p>
        Ein Hinweis am unteren Rand erklärt, dass keine Werbe-Cookies gesetzt werden. Wenn Sie ihn schließen, merkt sich der Browser das lokal unter dem Schlüssel <code>flh-book-ok</code>, damit der Hinweis nicht bei jedem Aufruf wieder kommt.
        Dieser Eintrag enthält keine Buchungsdaten und wird nicht an uns gesendet. Für dieses Speichern brauchen wir keine Einwilligung, es ist nötig, um den Hinweis nicht erneut einzublenden (§ 25 Abs. 2 Nr. 2 TDDDG).
        Ein Anmelde-Cookie setzen wir für Gäste nicht.
      </p>

      <h2>Empfänger</h2>
      <p>Ihre Termindaten sieht der Betrieb in seinem Kalender. Technisch verarbeiten sie außerdem:</p>
      <ul>
        <li>FLH GmbH, Ismaning, als Auftragsverarbeiter</li>
        <li>Supabase Inc., USA: Datenbank und, falls der Betrieb ein Logo oder Mitarbeiterfoto hinterlegt, der öffentliche Bildspeicher</li>
        <li>Vercel Inc., USA: Hosting</li>
        <li>Mittwald CM Service GmbH &amp; Co. KG, Espelkamp: Zustellung von Code und Bestätigung</li>
      </ul>
      <p>
        Soweit Supabase oder Vercel Daten in den USA verarbeiten, geschieht das auf Grundlage eines Angemessenheitsbeschlusses, soweit der Empfänger darunter fällt, sonst auf Grundlage von Standardvertragsklauseln nach Art. 46 DSGVO.
        Mittwald verarbeitet in Deutschland. Eine Weitergabe zu Werbezwecken findet nicht statt.
      </p>

      <h2>Speicherdauer</h2>
      <p>
        Der Termin bleibt gespeichert, solange der Betrieb ihn im Kalender führt. In diesem Fenster gibt es keine Löschfunktion für Gäste.
        Stornierte Termine behalten Name, E-Mail, Telefon und Notiz, nur der Status wechselt auf storniert. Eine automatische Löschfrist ist nicht eingerichtet.
        Löschung verlangen Sie beim Betrieb. Der Code-Prüfwert wird bei Bestätigung gelöscht und ist nach Ablauf der 15 Minuten ungültig.
      </p>

      <h2>Rechte</h2>
      <p>
        Gegenüber dem Betrieb haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit (Art. 15 bis 20 DSGVO).
        Soweit die Verarbeitung auf dem berechtigten Interesse beruht, können Sie widersprechen (Art. 21 DSGVO).
        Für die Buchung stützen wir uns auf den Termin, nicht auf eine Einwilligung. Die Datenschutzerklärung müssen Sie dafür nicht gesondert akzeptieren.
      </p>
      <p>
        Es gibt keine automatisierte Entscheidung und kein Profiling nach Art. 22 DSGVO.
        Beschwerde können Sie bei einer Aufsichtsbehörde einlegen, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des mutmaßlichen Verstoßes (Art. 77 DSGVO).
        Für die FLH GmbH als Auftragsverarbeiter ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach, zuständig.
      </p>
      <p className="note">Stand: {STAND}</p>
    </>
  );
}

export function GuestPrivacyPage() {
  const { slug = "" } = useParams();
  const [name, setName] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let on = true;
    api.pub(slug).then(
      (d) => { if (on) setName(d.tenant.name); },
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
    <div className="book-page">
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
