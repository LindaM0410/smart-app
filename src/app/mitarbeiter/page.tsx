import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { MitarbeiterFormular } from "./mitarbeiter-formular";

export const dynamic = "force-dynamic";

const rollenNamen: Record<string, string> = {
  inhaber: "Inhaber",
  manager: "Manager",
  bedienung: "Bedienung",
  kueche: "Küche",
};

export default async function MitarbeiterSeite() {
  const [mitarbeiter, aktiveStandorte] = await Promise.all([
    prisma.mitarbeiter.findMany({
      include: { hauptstandort: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.standort.findMany({
      where: { aktiv: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-026</p>
        <h1>Mitarbeiter verwalten</h1>
        <p>Stammdaten, Rolle, Hauptstandort und Aktivstatus pflegen.</p>
      </header>

      <section className="karte">
        <h2>Neuen Mitarbeiter anlegen</h2>
        {aktiveStandorte.length === 0 ? <p className="leerzustand">Zum Anlegen wird ein aktiver Standort benötigt.</p> : null}
        <MitarbeiterFormular standorte={aktiveStandorte} />
      </section>

      <section className="standortliste">
        <h2>Vorhandene Mitarbeiter</h2>
        {mitarbeiter.length === 0 ? (
          <p className="leerzustand">Noch keine Mitarbeiter angelegt.</p>
        ) : (
          mitarbeiter.map((person) => (
            <article className="karte" key={person.id}>
              <div className="kartenkopf">
                <div>
                  <h3>{person.name}</h3>
                  <p className="sekundaer">{rollenNamen[person.rolle] ?? person.rolle} · {person.hauptstandort.name}</p>
                </div>
                <span className={person.aktiv ? "status aktiv" : "status inaktiv"}>{person.aktiv ? "aktiv" : "inaktiv"}</span>
              </div>
              <MitarbeiterFormular mitarbeiter={person} standorte={aktiveStandorte} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
