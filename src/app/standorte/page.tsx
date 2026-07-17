import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";

import { StandortFormular } from "./standort-formular";

export const dynamic = "force-dynamic";

export default async function StandorteSeite() {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const standorte = await prisma.standort.findMany({ orderBy: { name: "asc" } });

  return (
    <main>
      <Link className="zurueck" href="/">
        ← Startseite
      </Link>
      <header className="seitenkopf">
        <p className="kennung">BV-001</p>
        <h1>Standorte verwalten</h1>
        <p>Restaurantdaten für Kreuzberg und Spandau anlegen und aktuell halten.</p>
      </header>

      <section className="karte">
        <h2>Neuen Standort anlegen</h2>
        <StandortFormular />
      </section>

      <section className="standortliste">
        <h2>Vorhandene Standorte</h2>
        {standorte.length === 0 ? (
          <p className="leerzustand">Noch keine Standorte angelegt.</p>
        ) : (
          standorte.map((standort) => (
            <article className="karte" key={standort.id}>
              <div className="kartenkopf">
                <h3>{standort.name}</h3>
                <span className={standort.aktiv ? "status aktiv" : "status inaktiv"}>
                  {standort.aktiv ? "aktiv" : "inaktiv"}
                </span>
              </div>
              <StandortFormular standort={standort} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
