import Link from "next/link";

import { FAEHIGKEITEN, hatFaehigkeit, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";
import {
  erlaubteReservierungsstatusWechsel,
  istReservierungsstatus,
  type Reservierungsstatus,
} from "@/lib/reservierungen";
import { ladeReservierungenFuerStandort, waehleAktivenStandort } from "@/lib/standortfilter";

import { ReservierungFormular } from "./reservierung-formular";
import {
  reservierungAlsNoShowMarkieren,
  reservierungsstatusWechseln,
} from "./actions";

export const dynamic = "force-dynamic";

function alsLokalesFormularDatum(datum: Date) {
  const versatz = datum.getTimezoneOffset() * 60_000;
  return new Date(datum.getTime() - versatz).toISOString().slice(0, 16);
}

const statusBezeichnungen: Record<Reservierungsstatus, string> = {
  angefragt: "Angefragt",
  bestaetigt: "Bestätigt",
  storniert: "Storniert",
  noShow: "No-Show",
  abgeschlossen: "Abgeschlossen",
};

const aktionsBezeichnungen: Partial<Record<Reservierungsstatus, string>> = {
  bestaetigt: "Bestätigen",
  storniert: "Stornieren",
  abgeschlossen: "Abschließen",
};

export default async function ReservierungenSeite({
  searchParams,
}: {
  searchParams: Promise<{ erfolg?: string; fehler?: string; standortId?: string }>;
}) {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const darfGruppenPlanen = hatFaehigkeit(
    mitarbeiter,
    FAEHIGKEITEN.gruppenreservierungenPlanen,
  );
  const parameter = await searchParams;
  const [gaeste, standorte] = await Promise.all([
    prisma.gast.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const [tische, reservierungen, gruppenKombinationen] = standort ? await Promise.all([
    prisma.tisch.findMany({
      where: { standortId: standort.id, aktiv: true },
      orderBy: { nummer: "asc" },
      select: { id: true, nummer: true, standortId: true },
    }),
    ladeReservierungenFuerStandort(prisma, standort.id),
    prisma.tischKombination.findMany({
      where: { standortId: standort.id },
      select: { tische: { select: { tischId: true } } },
      orderBy: { schluessel: "asc" },
    }),
  ]) : [[], [], []];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">Reservierungen</p>
        <h1>Reservierungen verwalten</h1>
        <p>Reservierungsdaten, Tischzuordnung und erlaubte Statusaktionen verwalten.</p>
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
        {standort ? (
          <ReservierungFormular
            darfGruppenPlanen={darfGruppenPlanen}
            gaeste={gaeste}
            gruppenKombinationen={gruppenKombinationen.map(({ tische: kombinationsTische }) =>
              kombinationsTische.map(({ tischId }) => tischId)
            )}
            standorte={[standort]}
            tische={tische}
          />
        ) : <p className="leerzustand">Kein aktiver Standort ausgewählt.</p>}
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
                <span className="status inaktiv">
                  {istReservierungsstatus(reservierung.status)
                    ? statusBezeichnungen[reservierung.status]
                    : reservierung.status}
                </span>
              </div>
              {reservierung.istGruppe && !darfGruppenPlanen ? (
                <p className="sekundaer">
                  Gruppenreservierungen dürfen nur durch Inhaber oder Manager geplant werden.
                </p>
              ) : (
                <ReservierungFormular
                  darfGruppenPlanen={darfGruppenPlanen}
                  gaeste={gaeste}
                  gruppenKombinationen={gruppenKombinationen.map(({ tische: kombinationsTische }) =>
                    kombinationsTische.map(({ tischId }) => tischId)
                  )}
                  standorte={[standort!]}
                  tische={tische}
                  reservierung={{
                    ...reservierung,
                    beginn: alsLokalesFormularDatum(reservierung.beginn),
                    ende: alsLokalesFormularDatum(reservierung.ende),
                    tischIds: reservierung.tische.map(({ tischId }) => tischId),
                  }}
                />
              )}
              {istReservierungsstatus(reservierung.status) ? (
                <div className="formular-abschluss">
                  {erlaubteReservierungsstatusWechsel(reservierung.status)
                    .filter((zielstatus) => zielstatus !== "noShow")
                    .map((zielstatus) => (
                      <form action={reservierungsstatusWechseln} key={zielstatus}>
                        <input name="id" type="hidden" value={reservierung.id} />
                        <input name="standortId" type="hidden" value={standort!.id} />
                        <input name="zielstatus" type="hidden" value={zielstatus} />
                        <button type="submit">{aktionsBezeichnungen[zielstatus]}</button>
                      </form>
                    ))}
                  {reservierung.status === "bestaetigt" ? (
                    <form action={reservierungAlsNoShowMarkieren}>
                      <input name="id" type="hidden" value={reservierung.id} />
                      <input name="standortId" type="hidden" value={standort!.id} />
                      <button type="submit">Als No-Show markieren</button>
                      <p className="sekundaer">Frühestens 15 Minuten nach geplantem Beginn.</p>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
