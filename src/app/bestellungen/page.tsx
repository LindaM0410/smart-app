import Link from "next/link";

import { FAEHIGKEITEN, hatFaehigkeit, verlangeFaehigkeit } from "@/lib/autorisierung";
import { formatierePreis } from "@/lib/artikel";
import { ladeGueltigesArtikelangebot } from "@/lib/artikelangebot-persistenz";
import { berechneBruttobetragCent } from "@/lib/bestellbetrag";
import { ladeBestellungenFuerStandort } from "@/lib/bestellung-persistenz";
import { prisma } from "@/lib/prisma";
import { waehleAktivenStandort } from "@/lib/standortfilter";

import { BestellungFormular } from "./bestellung-formular";
import { BestellpositionFormular } from "./bestellposition-formular";
import { bestellpositionStornieren } from "./actions";

export const dynamic = "force-dynamic";

export default async function BestellungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ standortId?: string }>;
}) {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const darfStornieren = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.bestellpositionStornieren);
  const parameter = await searchParams;
  const standorte = await prisma.standort.findMany({
    where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true },
  });
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const [tische, reservierungen, bestellungen, artikel] = standort ? await Promise.all([
    prisma.tisch.findMany({ where: { standortId: standort.id, aktiv: true }, orderBy: { nummer: "asc" }, select: { id: true, nummer: true } }),
    prisma.reservierung.findMany({ where: { standortId: standort.id }, orderBy: { beginn: "desc" }, select: { id: true, beginn: true, gast: { select: { name: true } } } }),
    ladeBestellungenFuerStandort(prisma, standort.id),
    ladeGueltigesArtikelangebot(prisma, standort.id),
  ]) : [[], [], [], []];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-015</p>
        <h1>Bestellungen pro Tisch</h1>
        <p>Offene Bestellungen pflegen und Positionen aus dem gültigen Standortangebot aufnehmen.</p>
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
          <BestellungFormular standortId={standort.id} tische={tische} reservierungen={reservierungen} />
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
              bestellung={bestellung}
            />
            <div className="positionsbereich">
              <div className="kartenkopf">
                <h4>Positionen</h4>
                <strong>Zwischensumme: {formatierePreis(berechneBruttobetragCent(bestellung.positionen))}</strong>
              </div>
              {bestellung.positionen.length === 0 ? <p className="leerzustand">Noch keine Position aufgenommen.</p> : bestellung.positionen.map((position) => (
                <div className="positionszeile" key={position.id}>
                  <div className="positionspreis">
                    <span>{position.menge} × {formatierePreis(position.einzelpreisCent)}</span>
                    <span className={`status ${position.status === "storniert" ? "inaktiv" : "aktiv"}`}>
                      {position.status === "inZubereitung" ? "in Zubereitung" : position.status}
                    </span>
                  </div>
                  {position.status === "offen" ? (
                    <BestellpositionFormular bestellungId={bestellung.id} artikel={artikel} position={position} />
                  ) : (
                    <div>
                      <strong>{position.artikel.name}</strong>
                      <p className="sekundaer">Sonderwunsch: {position.sonderwunsch || "—"}</p>
                    </div>
                  )}
                  {darfStornieren && ["offen", "inZubereitung"].includes(position.status) ? (
                    <form action={bestellpositionStornieren}>
                      <input name="positionId" type="hidden" value={position.id} />
                      <button type="submit">Position stornieren</button>
                    </form>
                  ) : null}
                  {position.status === "storniert" && position.storniertAm ? (
                    <p className="sekundaer">
                      Storniert am {position.storniertAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
                      {position.storniertVonMitarbeiter ? ` durch ${position.storniertVonMitarbeiter.name}` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
              <h4>Position hinzufügen</h4>
              {artikel.length > 0 ? <BestellpositionFormular bestellungId={bestellung.id} artikel={artikel} /> : <p className="leerzustand">Für diesen Standort ist kein aktiver Artikel verfügbar.</p>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
