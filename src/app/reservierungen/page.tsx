import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { ReservierungFormular } from "./reservierung-formular";

export const dynamic = "force-dynamic";

function alsLokalesFormularDatum(datum: Date) {
  const versatz = datum.getTimezoneOffset() * 60_000;
  return new Date(datum.getTime() - versatz).toISOString().slice(0, 16);
}

export default async function ReservierungenSeite() {
  const [gaeste, standorte, tische, reservierungen] = await Promise.all([
    prisma.gast.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tisch.findMany({
      where: { aktiv: true, standort: { aktiv: true } },
      orderBy: [{ standortId: "asc" }, { nummer: "asc" }],
      select: { id: true, nummer: true, standortId: true },
    }),
    prisma.reservierung.findMany({
      include: {
        gast: { select: { name: true } },
        standort: { select: { name: true } },
        tische: { include: { tisch: { select: { nummer: true } } } },
      },
      orderBy: { beginn: "asc" },
    }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-006</p>
        <h1>Tische Reservierungen zuordnen</h1>
        <p>Reservierungsdaten pflegen und aktive Tische desselben Standorts zuordnen.</p>
      </header>

      <section className="karte">
        <h2>Neue Reservierung anlegen</h2>
        <ReservierungFormular gaeste={gaeste} standorte={standorte} tische={tische} />
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
                standorte={standorte}
                tische={tische}
                reservierung={{
                  ...reservierung,
                  beginn: alsLokalesFormularDatum(reservierung.beginn),
                  ende: alsLokalesFormularDatum(reservierung.ende),
                  tischIds: reservierung.tische.map(({ tischId }) => tischId),
                }}
              />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
