import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { TischFormular } from "./tisch-formular";
import { TischKombinationFormular } from "./tischkombination-formular";
import { tischKombinationEntfernen } from "./actions";

export const dynamic = "force-dynamic";

export default async function TischeSeite() {
  const [standorte, tische, kombinationen] = await Promise.all([
    prisma.standort.findMany({ orderBy: { name: "asc" } }),
    prisma.tisch.findMany({
      include: { standort: { select: { name: true } } },
      orderBy: [{ standort: { name: "asc" } }, { nummer: "asc" }],
    }),
    prisma.tischKombination.findMany({
      include: {
        standort: { select: { name: true } },
        tische: { include: { tisch: { select: { nummer: true } } } },
      },
      orderBy: [{ standort: { name: "asc" } }, { schluessel: "asc" }],
    }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-002</p>
        <h1>Tische verwalten</h1>
        <p>Tische pro Standort mit Kapazität, Bereich und Aktivstatus pflegen.</p>
      </header>

      <section className="karte">
        <h2>Neuen Tisch anlegen</h2>
        {standorte.length === 0 ? (
          <p className="leerzustand">
            Zuerst muss ein <Link href="/standorte">Standort angelegt</Link> werden.
          </p>
        ) : (
          <TischFormular standorte={standorte} />
        )}
      </section>

      <section className="standortliste">
        <h2>Erlaubte Tischkombinationen</h2>
        <article className="karte">
          {standorte.filter((standort) => standort.aktiv).length === 0 ? (
            <p className="leerzustand">Kein aktiver Standort vorhanden.</p>
          ) : (
            <TischKombinationFormular
              standorte={standorte.filter((standort) => standort.aktiv)}
              tische={tische.filter((tisch) => tisch.aktiv && tisch.kombinierbar)}
            />
          )}
        </article>
        {kombinationen.length === 0 ? (
          <p className="leerzustand">Noch keine Tischkombination konfiguriert.</p>
        ) : (
          kombinationen.map((kombination) => (
            <article className="karte kombinationskarte" key={kombination.id}>
              <div>
                <h3>{kombination.tische.map(({ tisch }) => `Tisch ${tisch.nummer}`).join(" + ")}</h3>
                <p className="sekundaer">{kombination.standort.name}</p>
              </div>
              <form action={tischKombinationEntfernen}>
                <input name="id" type="hidden" value={kombination.id} />
                <button type="submit">Kombination entfernen</button>
              </form>
            </article>
          ))
        )}
      </section>

      <section className="standortliste">
        <h2>Vorhandene Tische</h2>
        {tische.length === 0 ? (
          <p className="leerzustand">Noch keine Tische angelegt.</p>
        ) : (
          tische.map((tisch) => (
            <article className="karte" key={tisch.id}>
              <div className="kartenkopf">
                <div>
                  <h3>Tisch {tisch.nummer}</h3>
                  <p className="sekundaer">{tisch.standort.name}</p>
                </div>
                <span className={tisch.aktiv ? "status aktiv" : "status inaktiv"}>
                  {tisch.aktiv ? "aktiv" : "inaktiv"}
                </span>
              </div>
              <TischFormular standorte={standorte} tisch={tisch} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
