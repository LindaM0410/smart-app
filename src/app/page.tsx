import Link from "next/link";

export default function Startseite() {
  return (
    <main>
      <header className="seitenkopf">
        <p className="kennung">Interne Restaurant-App</p>
        <h1>Bella Vista</h1>
        <p>Verwaltung für die Standorte Kreuzberg und Spandau.</p>
      </header>
      <nav aria-label="Funktionen" className="funktionsliste">
        <Link className="funktionskarte" href="/standorte">
          <strong>Standorte verwalten</strong>
          <span>Adresse, Kapazität und Ausstattung pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/tische">
          <strong>Tische verwalten</strong>
          <span>Standort, Kapazität und Bereich pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/gaeste">
          <strong>Gäste verwalten</strong>
          <span>Kontaktdaten, Stammgaststatus und Bella-Card pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/mitarbeiter">
          <strong>Mitarbeiter verwalten</strong>
          <span>Stammdaten, Rolle und Hauptstandort pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/reservierungen">
          <strong>Reservierungen erfassen</strong>
          <span>Gäste, Zeitraum und Reservierungsstatus pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/belegungen">
          <strong>Reale Tischbelegung führen</strong>
          <span>Reservierte Tische platzieren und ausdrücklich freigeben</span>
        </Link>
        <Link className="funktionskarte" href="/tischuebersicht">
          <strong>Tischübersicht anzeigen</strong>
          <span>Freie, bald reservierte und belegte Tische sehen</span>
        </Link>
        <Link className="funktionskarte" href="/walk-ins">
          <strong>Walk-in platzieren</strong>
          <span>Spontane Gäste in einem freien Zeitfenster platzieren</span>
        </Link>
        <Link className="funktionskarte" href="/artikelangebot">
          <strong>Artikelangebot anzeigen</strong>
          <span>Gültige Artikel pro Standort einsehen</span>
        </Link>
        <Link className="funktionskarte" href="/speisekarte">
          <strong>Speisekarte verwalten</strong>
          <span>Artikel, Preise und Standortfreigaben pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/bestellungen">
          <strong>Bestellungen pro Tisch</strong>
          <span>Leere Bestellungen eröffnen und ihre Zuordnung pflegen</span>
        </Link>
      </nav>
    </main>
  );
}
