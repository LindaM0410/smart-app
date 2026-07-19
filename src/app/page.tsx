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
      <nav aria-label="Funktionen" className="funktionsliste">
        {darfStammdatenPflegen ? <>
        <Link className="funktionskarte" href="/standorte">
          <strong>Standorte verwalten</strong>
          <span>Adresse, Kapazität und Ausstattung pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/tische">
          <strong>Tische verwalten</strong>
          <span>Standort, Kapazität und Bereich pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/mitarbeiter">
          <strong>Mitarbeiter verwalten</strong>
          <span>Stammdaten, Rolle und Hauptstandort pflegen</span>
        </Link>
        <Link className="funktionskarte" href="/artikelangebot">
          <strong>Artikelangebot anzeigen</strong>
          <span>Gültige Artikel pro Standort einsehen</span>
        </Link>
        <Link className="funktionskarte" href="/speisekarte">
          <strong>Speisekarte verwalten</strong>
          <span>Artikel, Preise und Standortfreigaben pflegen</span>
        </Link>
        </> : null}
        {darfOperativArbeiten ? <>
        <Link className="funktionskarte" href="/gaeste">
          <strong>Gäste verwalten</strong>
          <span>Kontaktdaten, Stammgaststatus und Bella-Card pflegen</span>
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
        <Link className="funktionskarte" href="/bestellungen">
          <strong>Bestellungen pro Tisch</strong>
          <span>Offene Bestellungen und ihre Positionen aufnehmen</span>
        </Link>
        </> : null}
        {darfKuechenstatusPflegen ? (
          <Link className="funktionskarte" href="/kueche">
            <strong>Küchenansicht</strong>
            <span>Offene Positionen zubereiten und als serviert markieren</span>
          </Link>
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
