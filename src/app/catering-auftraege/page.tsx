import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  formatiereCateringDatum,
  formatierePreis,
} from "@/lib/catering-auftraege";
import { prisma } from "@/lib/prisma";

import { CateringAuftragFormular } from "./catering-auftrag-formular";

export const dynamic = "force-dynamic";

export default async function CateringAuftraegeSeite() {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const [auftraege, aktiveKontakte] = await Promise.all([
    prisma.cateringAuftrag.findMany({
      include: { firmenkundenkontakt: true },
      orderBy: [{ datum: "asc" }, { uhrzeit: "asc" }],
    }),
    prisma.firmenkundenkontakt.findMany({
      where: { aktiv: true },
      orderBy: [{ firmenname: "asc" }, { ansprechperson: "asc" }],
      select: { id: true, firmenname: true, ansprechperson: true },
    }),
  ]);

  return (
    <main>
      <Link className="zurueck" href="/?bereich=administratives">
        ← Administratives
      </Link>
      <header className="seitenkopf">
        <p className="kennung">BV-023</p>
        <h1>Catering-Aufträge verwalten</h1>
        <p>Einfache Catering-Aufträge erfassen und bearbeiten.</p>
      </header>

      <section className="karte">
        <h2>Neuen Catering-Auftrag anlegen</h2>
        {aktiveKontakte.length === 0 ? (
          <p className="leerzustand">
            Für einen neuen Auftrag wird zuerst ein aktiver
            Firmenkundenkontakt benötigt.
          </p>
        ) : (
          <CateringAuftragFormular kontakte={aktiveKontakte} />
        )}
      </section>

      <section className="standortliste">
        <h2>Vorhandene Catering-Aufträge</h2>
        {auftraege.length === 0 ? (
          <p className="leerzustand">Noch keine Catering-Aufträge angelegt.</p>
        ) : (
          auftraege.map((auftrag) => {
            const kontakte = aktiveKontakte.some(
              (kontakt) => kontakt.id === auftrag.firmenkundenkontaktId,
            )
              ? aktiveKontakte
              : [
                  ...aktiveKontakte,
                  {
                    id: auftrag.firmenkundenkontakt.id,
                    firmenname: auftrag.firmenkundenkontakt.firmenname,
                    ansprechperson:
                      auftrag.firmenkundenkontakt.ansprechperson,
                  },
                ];
            return (
              <article className="karte" key={auftrag.id}>
                <div className="kartenkopf">
                  <div>
                    <h3>{auftrag.firmenkundenkontakt.firmenname}</h3>
                    <p className="sekundaer">
                      {formatiereCateringDatum(auftrag.datum)} ·{" "}
                      {auftrag.uhrzeit} Uhr · {auftrag.personenanzahl} Personen ·{" "}
                      {formatierePreis(auftrag.preisGesamtCent)}
                    </p>
                  </div>
                  <span className="status aktiv">{auftrag.status}</span>
                </div>
                <CateringAuftragFormular
                  auftrag={auftrag}
                  kontakte={kontakte}
                />
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
