import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { reservierungPlatzieren, tischFreigeben } from "./actions";

export const dynamic = "force-dynamic";

type Eigenschaften = {
  searchParams: Promise<{ erfolg?: string; fehler?: string }>;
};

export default async function BelegungenSeite({ searchParams }: Eigenschaften) {
  const [parameter, offeneBelegungen, zuordnungen] = await Promise.all([
    searchParams,
    prisma.belegung.findMany({
      where: { ende: null },
      include: {
        tisch: { include: { standort: { select: { name: true } } } },
        reservierung: { include: { gast: { select: { name: true } } } },
      },
      orderBy: { beginn: "asc" },
    }),
    prisma.reservierungTisch.findMany({
      where: { tisch: { aktiv: true, belegungen: { none: { ende: null } } } },
      include: {
        tisch: { include: { standort: { select: { name: true } } } },
        reservierung: { include: { gast: { select: { name: true } } } },
      },
      orderBy: [{ reservierung: { beginn: "asc" } }, { tisch: { nummer: "asc" } }],
    }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-028</p>
        <h1>Reale Tischbelegung</h1>
        <p>Reservierte Tische ausdrücklich platzieren und später wieder freigeben.</p>
      </header>

      {parameter.erfolg ? <p className="erfolg karte">{parameter.erfolg}</p> : null}
      {parameter.fehler ? <p className="fehler karte">{parameter.fehler}</p> : null}

      <section className="standortliste">
        <h2>Aktuell laufende Belegungen</h2>
        {offeneBelegungen.length === 0 ? <p className="leerzustand">Kein Tisch ist derzeit real belegt.</p> :
          offeneBelegungen.map((belegung) => (
            <article className="karte" key={belegung.id}>
              <div className="kartenkopf">
                <div>
                  <h3>Tisch {belegung.tisch.nummer} · {belegung.tisch.standort.name}</h3>
                  <p className="sekundaer">{belegung.reservierung.gast.name} · platziert um {belegung.beginn.toLocaleString("de-DE")}</p>
                </div>
                <form action={tischFreigeben}>
                  <input name="belegungId" type="hidden" value={belegung.id} />
                  <button type="submit">Tisch freigeben</button>
                </form>
              </div>
            </article>
          ))}
      </section>

      <section className="standortliste">
        <h2>Zugeordnete Tische platzieren</h2>
        {zuordnungen.length === 0 ? <p className="leerzustand">Keine unbelegten Tischzuordnungen vorhanden.</p> :
          zuordnungen.map(({ reservierung, tisch }) => (
            <article className="karte" key={`${reservierung.id}-${tisch.id}`}>
              <div className="kartenkopf">
                <div>
                  <h3>{reservierung.gast.name}</h3>
                  <p className="sekundaer">Tisch {tisch.nummer} · {tisch.standort.name} · Reservierung {reservierung.beginn.toLocaleString("de-DE")}</p>
                </div>
                <form action={reservierungPlatzieren}>
                  <input name="reservierungId" type="hidden" value={reservierung.id} />
                  <input name="tischId" type="hidden" value={tisch.id} />
                  <button type="submit">Jetzt platzieren</button>
                </form>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
