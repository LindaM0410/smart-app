import Link from "next/link";

import { formatierePreis } from "@/lib/artikel";
import { ladeGueltigesArtikelangebot } from "@/lib/artikelangebot-persistenz";
import { prisma } from "@/lib/prisma";
import { waehleAktivenStandort } from "@/lib/standortfilter";

export const dynamic = "force-dynamic";

export default async function ArtikelangebotSeite({
  searchParams,
}: {
  searchParams: Promise<{ standortId?: string }>;
}) {
  const parameter = await searchParams;
  const standorte = await prisma.standort.findMany({
    where: { aktiv: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const artikel = standort
    ? await ladeGueltigesArtikelangebot(prisma, standort.id)
    : [];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-021</p>
        <h1>Artikelangebot pro Standort</h1>
        <p>Aktive Artikel anzeigen, die am gewählten Standort angeboten werden dürfen.</p>
      </header>

      <form className="karte uebersicht-filter" method="get">
        <label>
          Standort
          <select defaultValue={standort?.id ?? ""} name="standortId" required>
            <option disabled value="">Bitte wählen</option>
            {standorte.map((eintrag) => (
              <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>
            ))}
          </select>
        </label>
        <button type="submit">Angebot anzeigen</button>
      </form>

      {!standort && standorte.length > 0 ? (
        <p className="fehler karte">Bitte einen gültigen aktiven Standort wählen.</p>
      ) : null}

      <section className="standortliste" aria-label="Gültiges Artikelangebot">
        {standort && artikel.length === 0 ? (
          <p className="leerzustand">Für {standort.name} ist noch kein Artikel freigegeben.</p>
        ) : (
          artikel.map((eintrag) => (
            <article className="karte kartenkopf" key={eintrag.id}>
              <div>
                <h2>{eintrag.name}</h2>
                {eintrag.benoetigtGrill ? <p className="sekundaer">Grillartikel</p> : null}
              </div>
              <strong>{formatierePreis(eintrag.preisCent)}</strong>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
