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
import { bellaCardRabattAnwenden, bestellpositionStornieren, rechnungAlsBezahltMarkieren, rechnungErzeugen, rechnungszahlerWaehlen } from "./actions";

export const dynamic = "force-dynamic";

export default async function BestellungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ standortId?: string }>;
}) {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const darfStornieren = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.bestellpositionStornieren);
  const darfBellaCardRabattAnwenden = hatFaehigkeit(mitarbeiter, FAEHIGKEITEN.bellaCardRabattAnwenden);
  const parameter = await searchParams;
  const standorte = await prisma.standort.findMany({
    where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true },
  });
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const [tische, reservierungen, bestellungen, artikel, gaeste] = standort ? await Promise.all([
    prisma.tisch.findMany({ where: { standortId: standort.id, aktiv: true }, orderBy: { nummer: "asc" }, select: { id: true, nummer: true } }),
    prisma.reservierung.findMany({ where: { standortId: standort.id }, orderBy: { beginn: "desc" }, select: { id: true, beginn: true, gast: { select: { name: true } } } }),
    ladeBestellungenFuerStandort(prisma, standort.id),
    ladeGueltigesArtikelangebot(prisma, standort.id),
    darfBellaCardRabattAnwenden
      ? prisma.gast.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]) : [[], [], [], [], []];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-035</p>
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
            <div className="positionsbereich">
              <h4>Rechnung</h4>
              {bestellung.rechnung ? (
                <div>
                  <div className="kartenkopf">
                    <strong>Bruttobetrag: {formatierePreis(bestellung.rechnung.bruttobetragCent)}</strong>
                    <span className="status aktiv">{bestellung.rechnung.status}</span>
                  </div>
                  <p className="sekundaer">
                    Zahler: {bestellung.rechnung.zahler?.name ?? "nicht ausgewählt"}
                  </p>
                  {bestellung.rechnung.rabattFreigegebenVonMitarbeiterId ? (
                    <p className="sekundaer">
                      Bella-Card-Rabatt (15 %): −{formatierePreis(bestellung.rechnung.rabattbetragCent)}
                    </p>
                  ) : null}
                  <p><strong>Finaler Betrag: {formatierePreis(bestellung.rechnung.endbetragCent)}</strong></p>
                  {darfBellaCardRabattAnwenden
                    && bestellung.rechnung.status === "offen"
                    && !bestellung.rechnung.zahlerGastId ? (
                    <form action={rechnungszahlerWaehlen} className="zahlungsformular">
                      <input name="rechnungId" type="hidden" value={bestellung.rechnung.id} />
                      <label>
                        Zahlenden Gast auswählen
                        <select name="zahlerGastId" required>
                          <option value="">Bitte wählen</option>
                          {gaeste.map((gast) => <option key={gast.id} value={gast.id}>{gast.name}</option>)}
                        </select>
                      </label>
                      <button type="submit">Zahler auswählen</button>
                    </form>
                  ) : null}
                  {darfBellaCardRabattAnwenden
                    && bestellung.rechnung.status === "offen"
                    && bestellung.rechnung.zahlerGastId
                    && !bestellung.rechnung.rabattFreigegebenVonMitarbeiterId ? (
                    <form action={bellaCardRabattAnwenden}>
                      <input name="rechnungId" type="hidden" value={bestellung.rechnung.id} />
                      <button type="submit">15 % Bella-Card-Rabatt anwenden</button>
                    </form>
                  ) : null}
                  {bestellung.rechnung.status === "bezahlt" ? (
                    <p className="sekundaer">
                      Zahlungsart: {bestellung.rechnung.zahlungsart === "bar" ? "Bar" : "Karte"}
                      {bestellung.rechnung.bezahltAm
                        ? ` · Bezahlt am ${bestellung.rechnung.bezahltAm.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`
                        : ""}
                    </p>
                  ) : (
                    <form action={rechnungAlsBezahltMarkieren} className="zahlungsformular">
                      <input name="rechnungId" type="hidden" value={bestellung.rechnung.id} />
                      <label>
                        Zahlungsart
                        <select name="zahlungsart" required>
                          <option value="bar">Bar</option>
                          <option value="karte">Karte</option>
                        </select>
                      </label>
                      <button type="submit">Als bezahlt markieren</button>
                    </form>
                  )}
                </div>
              ) : bestellung.positionen.some((position) => position.status !== "storniert") ? (
                <form action={rechnungErzeugen}>
                  <input name="bestellungId" type="hidden" value={bestellung.id} />
                  <button type="submit">Rechnung erzeugen</button>
                </form>
              ) : (
                <p className="leerzustand">Für eine Rechnung ist mindestens eine berechenbare Position erforderlich.</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
