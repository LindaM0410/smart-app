import Link from "next/link";

import { formatierePreis } from "@/lib/artikel";
import { prisma } from "@/lib/prisma";

import { ArtikelFormular } from "./artikel-formular";

export const dynamic = "force-dynamic";

export default async function SpeisekarteSeite() {
  const [artikel, standorte] = await Promise.all([
    prisma.artikel.findMany({ include: { standortAngebote: true }, orderBy: [{ kategorie: "asc" }, { name: "asc" }] }),
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" }, select: { id: true, name: true, hatGrill: true } }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-020</p>
        <h1>Speisekarte verwalten</h1>
        <p>Artikel, Preise in Euro und Cent sowie Standortfreigaben pflegen.</p>
      </header>
      <section className="karte">
        <h2>Neuen Artikel anlegen</h2>
        <ArtikelFormular standorte={standorte} />
      </section>
      <section className="standortliste">
        <h2>Vorhandene Artikel</h2>
        {artikel.length === 0 ? <p className="leerzustand">Noch keine Artikel angelegt.</p> : artikel.map((eintrag) => (
          <article className="karte" key={eintrag.id}>
            <div className="kartenkopf">
              <div><h3>{eintrag.name}</h3><p className="sekundaer">{eintrag.kategorie} · {formatierePreis(eintrag.preisCent)}</p></div>
              <span className={eintrag.aktiv ? "status aktiv" : "status inaktiv"}>{eintrag.aktiv ? "aktiv" : "inaktiv"}</span>
            </div>
            <ArtikelFormular artikel={{ ...eintrag, standortIds: eintrag.standortAngebote.map(({ standortId }) => standortId) }} standorte={standorte} />
          </article>
        ))}
      </section>
    </main>
  );
}
