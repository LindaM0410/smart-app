import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";

import { FirmenkundenkontaktFormular } from "./firmenkundenkontakt-formular";

export const dynamic = "force-dynamic";

export default async function FirmenkundenkontakteSeite() {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const kontakte = await prisma.firmenkundenkontakt.findMany({
    orderBy: [{ firmenname: "asc" }, { ansprechperson: "asc" }],
  });

  return (
    <main>
      <Link className="zurueck" href="/?bereich=administratives">
        ← Administratives
      </Link>
      <header className="seitenkopf">
        <p className="kennung">BV-022</p>
        <h1>Firmenkundenkontakte verwalten</h1>
        <p>Kontakte als Grundlage für spätere Catering-Aufträge pflegen.</p>
      </header>

      <section className="karte">
        <h2>Neuen Firmenkundenkontakt anlegen</h2>
        <FirmenkundenkontaktFormular />
      </section>

      <section className="standortliste">
        <h2>Vorhandene Firmenkundenkontakte</h2>
        {kontakte.length === 0 ? (
          <p className="leerzustand">
            Noch keine Firmenkundenkontakte angelegt.
          </p>
        ) : (
          kontakte.map((kontakt) => (
            <article className="karte" key={kontakt.id}>
              <div className="kartenkopf">
                <div>
                  <h3>{kontakt.firmenname}</h3>
                  <p className="sekundaer">{kontakt.ansprechperson}</p>
                </div>
                <span
                  className={kontakt.aktiv ? "status aktiv" : "status inaktiv"}
                >
                  {kontakt.aktiv ? "aktiv" : "inaktiv"}
                </span>
              </div>
              <FirmenkundenkontaktFormular kontakt={kontakt} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
