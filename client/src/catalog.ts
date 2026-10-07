export type Tpl = { group: string; name: string; min: number; buffer: number };

function rows(group: string, items: [string, number, number][]): Tpl[] {
  return items.map(([name, min, buffer]) => ({ group, name, min, buffer }));
}

// Dauer aus veröffentlichten Buchungszeiten, Stand 02.10.2026. Puffer ist eine Schätzung, 5–15 Minuten.
export const CATALOG: Tpl[] = [
  ...rows("Schnitt und Styling", [
    ["Waschen, Schneiden & Föhnen – kurz", 45, 10],
    ["Waschen, Schneiden & Föhnen – mittel", 60, 10],
    ["Waschen, Schneiden & Föhnen – lang", 90, 15],
    ["Waschen & Schneiden ohne Föhnen – kurz", 30, 10],
    ["Waschen & Schneiden ohne Föhnen – mittel", 40, 10],
    ["Waschen & Schneiden ohne Föhnen – lang", 40, 10],
    ["Trockenhaarschnitt", 30, 5],
    ["Klassischer Herrenhaarschnitt mit Waschen und Styling", 35, 10],
    ["Aufwendiger Schnitt, z. B. Fade / Mullet, mit Waschen und Finish", 45, 15],
    ["Maschinenhaarschnitt – eine Länge", 20, 5],
    ["Pony schneiden", 15, 5],
    ["Kinderhaarschnitt – einfacher Schnitt", 30, 5],
    ["Kinderhaarschnitt mit Waschen & Föhnen", 45, 10],
    ["Waschen & Föhnen – kurz", 30, 10],
    ["Waschen & Föhnen – mittel", 45, 10],
    ["Waschen & Föhnen – lang", 45, 15],
    ["Waschen & Legen – kurz", 45, 10],
    ["Waschen & Legen – mittel / lang", 60, 15],
    ["Föhnen plus Glätten / Lockeneisen", 40, 10],
    ["Hochsteckfrisur – mittellang", 60, 10],
    ["Hochsteckfrisur – lang", 75, 15],
    ["Brautfrisur – mittellang, ohne Make-up", 60, 15],
    ["Brautfrisur – lang, ohne Make-up", 120, 15],
  ]),
  ...rows("Farbe und Strähnen", [
    ["Ansatzfarbe, separat", 90, 15],
    ["Ansatzfarbe mit Waschen, Schnitt & Föhnen – kurz", 120, 15],
    ["Ansatzfarbe mit Waschen, Schnitt & Föhnen – mittel", 120, 15],
    ["Ansatzfarbe mit Waschen, Schnitt & Föhnen – lang", 120, 15],
    ["Komplettfarbe, separat – kurz / mittel", 90, 15],
    ["Komplettfarbe, separat – lang", 90, 15],
    ["Farbe mit Glossing, Kur, Schnitt & Styling", 150, 15],
    ["Tönung, separat", 90, 15],
    ["Glossing / Abmattierung, separat", 35, 10],
    ["Ansatzblondierung bis 2 cm, separat", 90, 15],
    ["Foliensträhnen – Oberkopf, separat", 90, 15],
    ["Foliensträhnen – halber Kopf, separat", 120, 15],
    ["Foliensträhnen – ganzer Kopf, separat", 165, 15],
    ["Strähnen / Babylights – halber Kopf mit Kur, Schnitt & Styling", 180, 15],
    ["Balayage mit Glossing & Föhnen", 180, 15],
    ["Balayage mit Glossing, Schnitt & Föhnen", 180, 15],
  ]),
  ...rows("Dauerwelle und Umformung", [
    ["Dauerwelle – kurz, separat", 75, 15],
    ["Dauerwelle – mittel, separat", 90, 15],
    ["Dauerwelle – lang, separat", 105, 15],
    ["Dauerwelle mit Föhnen & Intensivkur – kurz", 90, 15],
    ["Dauerwelle mit Föhnen & Intensivkur – mittel", 105, 15],
    ["Dauerwelle mit Föhnen & Intensivkur – lang", 150, 15],
    ["Dauerwelle mit Schnitt & Föhnen / Legen – kurz", 120, 15],
    ["Dauerwelle mit Schnitt & Föhnen / Legen – mittel", 150, 15],
    ["Dauerwelle mit Schnitt & Föhnen / Legen – lang", 180, 15],
    ["Volumenwelle mit Föhnen & Intensivkur – kurz / mittel", 90, 15],
    ["Keratinbehandlung / Proteinbehandlung", 135, 15],
  ]),
  ...rows("Pflege, Bart und Zusatz", [
    ["Haarkur als Zusatzleistung", 10, 5],
    ["Intensivpflege als Zusatzleistung", 15, 5],
    ["Kopfhautbehandlung – klein", 10, 5],
    ["Kopfhautbehandlung – mittel", 15, 5],
    ["Kopfhautbehandlung – groß", 20, 10],
    ["Bart schneiden / trimmen", 15, 5],
    ["Bart trimmen plus Konturen rasieren", 20, 10],
    ["Haarschnitt mit Waschen, Bart & Styling", 45, 10],
    ["Augenbrauen zupfen / Fadentechnik", 10, 5],
    ["Augenbrauen färben", 15, 5],
    ["Wimpern färben", 20, 5],
    ["Tages-Make-up", 45, 10],
    ["Abend-Make-up", 60, 15],
    ["Beratung für Extensions", 20, 5],
  ]),
];

function fold(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function matchTpl(q: string) {
  const words = fold(q).split(/\s+/).filter((w) => w.length > 0);
  if (!words.length) return [];
  const hit = CATALOG.filter((t) => words.every((w) => fold(`${t.group} ${t.name}`).includes(w)));
  const score = (t: Tpl) => {
    const parts = fold(t.name).split(/[^a-z0-9]+/);
    if (words.every((w) => parts[0]?.startsWith(w))) return 0;
    if (words.every((w) => parts.some((part) => part.startsWith(w)))) return 1;
    return 2;
  };
  return hit.sort((a, b) => score(a) - score(b)).slice(0, 8);
}
