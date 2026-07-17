import Link from "next/link";

import { ladeBestellungenFuerStandort } from "@/lib/bestellung-persistenz";
import { prisma } from "@/lib/prisma";
import { waehleAktivenStandort } from "@/lib/standortfilter";

import { BestellungFormular } from "./bestellung-formular";

export const dynamic = "force-dynamic";

export default async function BestellungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ standortId?: string }>;
}) {
  const parameter = await searchParams;
  const standorte = await prisma.standort.findMany({
    where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true },
  });
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const [tische, reservierungen, mitarbeiter, bestellungen] = standort ? await Promise.all([
    prisma.tisch.findMany({ where: { standortId: standort.id, aktiv: true }, orderBy: { nummer: "asc" }, select: { id: true, nummer: true } }),
    prisma.reservierung.findMany({ where: { standortId: standort.id }, orderBy: { beginn: "desc" }, select: { id: true, beginn: true, gast: { select: { name: true } } } }),
    prisma.mitarbeiter.findMany({ where: { hauptstandortId: standort.id, aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ladeBestellungenFuerStandort(prisma, standort.id),
  ]) : [[], [], [], []];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-014</p>
        <h1>Bestellungen pro Tisch</h1>
        <p>Leere Bestellungen standortbezogen eröffnen und ihre Zuordnung pflegen.</p>
      </header>

      <form className="karte uebersicht-filter" method="get">
        <label>Standort
          <select defaultValue={standort?.id ?? ""} name="standortId" required>
            <option disabled value="">Bitte wählen</option>
            {standorte.map((eintrag) => <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>)}
          </select>
        </label>
        <button type="submit">Bestellungen anzeigen</button>
      </form>

      <section className="karte">
        <h2>Bestellung eröffnen</h2>
        {standort ? (
          <BestellungFormular standortId={standort.id} tische={tische} reservierungen={reservierungen} mitarbeiter={mitarbeiter} />
        ) : <p className="leerzustand">Kein aktiver Standort ausgewählt.</p>}
      </section>

      <section className="standortliste">
        <h2>Offene Bestellungen</h2>
        {bestellungen.length === 0 ? <p className="leerzustand">Noch keine Bestellung eröffnet.</p> : bestellungen.map((bestellung) => (
          <article className="karte" key={bestellung.id}>
            <div className="kartenkopf">
              <div>
                <h3>Tisch {bestellung.tisch.nummer}</h3>
                <p className="sekundaer">{bestellung.aufgenommenVonMitarbeiter.name}{bestellung.reservierung ? ` · ${bestellung.reservierung.gast.name}` : " · ohne Reservierung"}</p>
              </div>
              <span className="status aktiv">offen</span>
            </div>
            <BestellungFormular
              standortId={bestellung.standortId}
              tische={tische}
              reservierungen={reservierungen}
              mitarbeiter={mitarbeiter}
              bestellung={bestellung}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
