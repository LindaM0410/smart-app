import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";
import { ladeReservierungenFuerStandort, waehleAktivenStandort } from "@/lib/standortfilter";

import { ReservierungFormular } from "./reservierung-formular";
import { reservierungAlsNoShowMarkieren } from "./actions";

export const dynamic = "force-dynamic";

function alsLokalesFormularDatum(datum: Date) {
  const versatz = datum.getTimezoneOffset() * 60_000;
  return new Date(datum.getTime() - versatz).toISOString().slice(0, 16);
}

export default async function ReservierungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ erfolg?: string; fehler?: string; standortId?: string }>;
}) {
  await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const parameter = await searchParams;
  const [gaeste, standorte] = await Promise.all([
    prisma.gast.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const [tische, reservierungen] = standort ? await Promise.all([
    prisma.tisch.findMany({
      where: { standortId: standort.id, aktiv: true },
      orderBy: { nummer: "asc" },
      select: { id: true, nummer: true, standortId: true },
    }),
    ladeReservierungenFuerStandort(prisma, standort.id),
  ]) : [[], []];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-006</p>
        <h1>Tische Reservierungen zuordnen</h1>
        <p>Reservierungsdaten pflegen und aktive Tische desselben Standorts zuordnen.</p>
      </header>

      {parameter.erfolg ? <p className="erfolg karte" role="status">{parameter.erfolg}</p> : null}
      {parameter.fehler ? <p className="fehler karte" role="status">{parameter.fehler}</p> : null}

      <form className="karte uebersicht-filter" method="get">
        <label>Standort
          <select defaultValue={standort?.id ?? ""} name="standortId" required>
            <option disabled value="">Bitte wählen</option>
            {standorte.map((eintrag) => <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>)}
          </select>
        </label>
        <button type="submit">Reservierungen anzeigen</button>
      </form>
      {!standort && standorte.length > 0 ? <p className="fehler karte">Bitte einen gültigen aktiven Standort wählen.</p> : null}

      <section className="karte">
        <h2>Neue Reservierung anlegen</h2>
        {standort ? <ReservierungFormular gaeste={gaeste} standorte={[standort]} tische={tische} /> : <p className="leerzustand">Kein aktiver Standort ausgewählt.</p>}
      </section>

      <section className="standortliste">
        <h2>Vorhandene Reservierungen</h2>
        {reservierungen.length === 0 ? <p className="leerzustand">Noch keine Reservierungen angelegt.</p> : (
          reservierungen.map((reservierung) => (
            <article className="karte" key={reservierung.id}>
              <div className="kartenkopf">
                <div>
                  <h3>{reservierung.gast.name}</h3>
                  <p className="sekundaer">
                    {reservierung.standort.name} · {reservierung.personenanzahl} Personen
                    {reservierung.istGruppe ? " · Gruppe" : ""}
                    {reservierung.tische.length > 0
                      ? ` · ${reservierung.tische.map(({ tisch }) => `Tisch ${tisch.nummer}`).join(", ")}`
                      : " · Noch kein Tisch"}
                  </p>
                </div>
                <span className="status inaktiv">{reservierung.status}</span>
              </div>
              <ReservierungFormular
                gaeste={gaeste}
                standorte={[standort!]}
                tische={tische}
                reservierung={{
                  ...reservierung,
                  beginn: alsLokalesFormularDatum(reservierung.beginn),
                  ende: alsLokalesFormularDatum(reservierung.ende),
                  tischIds: reservierung.tische.map(({ tischId }) => tischId),
                }}
              />
              {reservierung.status === "bestaetigt" ? (
                <form action={reservierungAlsNoShowMarkieren}>
                  <input name="id" type="hidden" value={reservierung.id} />
                  <input name="standortId" type="hidden" value={standort!.id} />
                  <button type="submit">Als No-Show markieren</button>
                  <p className="sekundaer">Frühestens 15 Minuten nach geplantem Beginn.</p>
                </form>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
