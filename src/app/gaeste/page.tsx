import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { GastFormular } from "./gast-formular";

export const dynamic = "force-dynamic";

export default async function GaesteSeite() {
  const gaeste = await prisma.gast.findMany({ orderBy: { name: "asc" } });

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-004</p>
        <h1>Gäste verwalten</h1>
        <p>Kontaktdaten, Stammgaststatus und Bella-Card pflegen.</p>
      </header>

      <section className="karte">
        <h2>Neuen Gast anlegen</h2>
        <GastFormular />
      </section>

      <section className="standortliste">
        <h2>Vorhandene Gäste</h2>
        {gaeste.length === 0 ? (
          <p className="leerzustand">Noch keine Gäste angelegt.</p>
        ) : (
          gaeste.map((gast) => (
            <article className="karte" key={gast.id}>
              <div className="kartenkopf">
                <div>
                  <h3>{gast.name}</h3>
                  <p className="sekundaer">
                    {gast.istStammgast ? "Stammgast" : "Gast"}
                    {gast.hatBellaCard ? " · Bella-Card" : ""}
                  </p>
                </div>
                <span className={gast.aktiv ? "status aktiv" : "status inaktiv"}>
                  {gast.aktiv ? "aktiv" : "inaktiv"}
                </span>
              </div>
              <GastFormular gast={gast} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
