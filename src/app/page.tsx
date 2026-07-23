import Link from "next/link";
import { redirect } from "next/navigation";

import { aktuellerMitarbeiter } from "@/lib/aktuelle-sitzung";
import { FAEHIGKEITEN, hatFaehigkeit } from "@/lib/autorisierung";
import { abmeldenAction } from "./abmeldung/actions";

export default async function Startseite({
  searchParams,
}: {
  searchParams: Promise<{ zugriff?: string }>;
}) {
  const parameter = await searchParams;
  const mitarbeiter = await aktuellerMitarbeiter();
  if (!mitarbeiter) redirect("/anmeldung");
  const darfStammdatenPflegen = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.stammdatenPflegen);
  const darfOperativArbeiten = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.operativeAblaeufeNutzen);
  const darfKuechenstatusPflegen = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.kuechenstatusPflegen);
  const darfStornosFreigeben = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.bestellpositionStornieren);
  return (
    <main>
      <header className="seitenkopf">
        <p className="kennung">Interne Restaurant-App</p>
        <h1>Bella Vista</h1>
        <p>Verwaltung für die Standorte Kreuzberg und Spandau.</p>
        <div className="angemeldet"><span>Angemeldet als <strong>{mitarbeiter.name}</strong> · {mitarbeiter.rolle}</span><form action={abmeldenAction}><button type="submit">Abmelden</button></form></div>
      </header>
      {parameter.zugriff === "verweigert" ? (
        <p className="fehler karte" role="alert">Für diese Funktion fehlt die erforderliche Berechtigung.</p>
      ) : null}
      <nav aria-label="Arbeitsbereiche" className="arbeitsbereiche">
        {darfStammdatenPflegen ? (
          <section className="arbeitsbereich" aria-labelledby="bereich-administratives">
            <div className="bereichskopf">
              <h2 id="bereich-administratives">Administratives</h2>
              <p>Grundlagen für Standorte, Team und Angebot pflegen.</p>
            </div>
            <div className="funktionsliste">
              <Link className="funktionskarte" href="/standorte">
                <strong>Standorte</strong>
                <span>Adresse, Kapazität und Ausstattung pflegen</span>
              </Link>
              <Link className="funktionskarte" href="/tische">
                <strong>Tische und Tischkombinationen</strong>
                <span>Tische, Kapazitäten, Bereiche und erlaubte Kombinationen pflegen</span>
              </Link>
              <Link className="funktionskarte" href="/mitarbeiter">
                <strong>Mitarbeitende</strong>
                <span>Stammdaten, Rolle und Hauptstandort pflegen</span>
              </Link>
              <Link className="funktionskarte" href="/speisekarte">
                <strong>Speisekarte</strong>
                <span>Artikel, Preise und Standortfreigaben pflegen</span>
              </Link>
              <Link className="funktionskarte" href="/artikelangebot">
                <strong>Artikelangebot</strong>
                <span>Gültige Artikel pro Standort einsehen</span>
              </Link>
            </div>
          </section>
        ) : null}
        {darfOperativArbeiten ? (
          <>
            <section className="arbeitsbereich" aria-labelledby="bereich-alltagsgeschaeft">
              <div className="bereichskopf">
                <h2 id="bereich-alltagsgeschaeft">Alltagsgeschäft</h2>
                <p>Gäste vom Reservieren bis zur Bestellung am Tisch begleiten.</p>
              </div>
              <div className="funktionsliste">
                <Link className="funktionskarte" href="/gaeste">
                  <strong>Gäste</strong>
                  <span>Kontaktdaten und Stammgaststatus pflegen</span>
                </Link>
                <Link className="funktionskarte" href="/reservierungen">
                  <strong>Reservierungen</strong>
                  <span>Gäste, Zeitraum und Reservierungsstatus pflegen</span>
                </Link>
                <Link className="funktionskarte" href="/tischuebersicht">
                  <strong>Tischübersicht</strong>
                  <span>Freie, bald reservierte und belegte Tische sehen</span>
                </Link>
                <Link className="funktionskarte" href="/belegungen">
                  <strong>Tischbelegung</strong>
                  <span>Reservierte Tische platzieren und ausdrücklich freigeben</span>
                </Link>
                <Link className="funktionskarte" href="/walk-ins">
                  <strong>Walk-ins</strong>
                  <span>Spontane Gäste in einem freien Zeitfenster platzieren</span>
                </Link>
                <Link className="funktionskarte" href="/bestellungen">
                  <strong>Bestellungen pro Tisch</strong>
                  <span>Offene Bestellungen und ihre Positionen aufnehmen</span>
                </Link>
              </div>
            </section>
            <section className="arbeitsbereich" aria-labelledby="bereich-abrechnung">
              <div className="bereichskopf">
                <h2 id="bereich-abrechnung">Abrechnung/Freigaben</h2>
                <p>Abrechnung und bestehende Freigaben bleiben Teil der Bestellansicht.</p>
              </div>
              <div className="funktionsliste">
                <Link className="funktionskarte" href="/bestellungen">
                  <strong>Rechnungen und Zahlungen</strong>
                  <span>Bestellungen pro Tisch abrechnen, Rechnungen erzeugen und Zahlungen erfassen</span>
                </Link>
              </div>
              {darfStornosFreigeben ? (
                <p className="bereichshinweis">
                  Stornos und kritische Freigaben werden ebenfalls in „Bestellungen pro Tisch“ bearbeitet.
                </p>
              ) : null}
            </section>
          </>
        ) : null}
        {darfKuechenstatusPflegen ? (
          <section className="arbeitsbereich" aria-labelledby="bereich-kueche">
            <div className="bereichskopf">
              <h2 id="bereich-kueche">Küche</h2>
              <p>Offene Bestellpositionen für die Zubereitung bearbeiten.</p>
            </div>
            <div className="funktionsliste">
              <Link className="funktionskarte" href="/kueche">
                <strong>Küchenansicht</strong>
                <span>Offene Positionen zubereiten und als serviert markieren</span>
              </Link>
            </div>
          </section>
        ) : null}
      </nav>
      {!darfStammdatenPflegen && !darfOperativArbeiten && !darfKuechenstatusPflegen ? (
        <section className="karte">
          <h2>Eingeschränkter Zugang</h2>
          <p>Für diese Rolle ist keine Arbeitsansicht vorhanden.</p>
        </section>
      ) : null}
    </main>
  );
}
