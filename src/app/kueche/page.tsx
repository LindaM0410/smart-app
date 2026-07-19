import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { ladeKuechenpositionen } from "@/lib/kuechenstatus-persistenz";
import { prisma } from "@/lib/prisma";

import { kuechenstatusAktualisieren } from "./actions";

export const dynamic = "force-dynamic";

export default async function KuechenSeite() {
  await verlangeFaehigkeit(FAEHIGKEITEN.kuechenstatusPflegen);
  const positionen = await ladeKuechenpositionen(prisma);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-016</p>
        <h1>Küchenansicht</h1>
        <p>Offene Bestellpositionen zubereiten und als serviert markieren.</p>
      </header>

      <section className="standortliste" aria-label="Zubereitungsrelevante Bestellpositionen">
        {positionen.length === 0 ? (
          <p className="leerzustand">Aktuell sind keine Positionen zuzubereiten.</p>
        ) : positionen.map((position) => {
          const zielstatus = position.status === "offen" ? "inZubereitung" : "serviert";
          const aktionsText = position.status === "offen" ? "Zubereitung beginnen" : "Als serviert markieren";
          return (
            <article className="karte kuechenposition" key={position.id}>
              <div className="kartenkopf">
                <div>
                  <p className="sekundaer">{position.bestellung.standort.name} · Tisch {position.bestellung.tisch.nummer}</p>
                  <h2>{position.menge} × {position.artikel.name}</h2>
                </div>
                <span className={`status ${position.status === "offen" ? "inaktiv" : "aktiv"}`}>
                  {position.status === "offen" ? "offen" : "in Zubereitung"}
                </span>
              </div>
              <p><strong>Sonderwunsch:</strong> {position.sonderwunsch || "—"}</p>
              <form action={kuechenstatusAktualisieren}>
                <input name="positionId" type="hidden" value={position.id} />
                <input name="zielstatus" type="hidden" value={zielstatus} />
                <button type="submit">{aktionsText}</button>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
