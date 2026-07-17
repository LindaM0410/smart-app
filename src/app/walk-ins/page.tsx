import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { ladeWalkInTischeFuerStandort, waehleAktivenStandort } from "@/lib/standortfilter";

import { walkInPlatzieren } from "./actions";

export const dynamic = "force-dynamic";

type Eigenschaften = {
  searchParams: Promise<{ erfolg?: string; fehler?: string; standortId?: string }>;
};

export default async function WalkInsSeite({ searchParams }: Eigenschaften) {
  const [parameter, standorte, gaeste] = await Promise.all([
    searchParams,
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" } }),
    prisma.gast.findMany({ where: { aktiv: true }, orderBy: { name: "asc" } }),
  ]);
  const standort = waehleAktivenStandort(standorte, parameter.standortId);
  const tische = standort ? await ladeWalkInTischeFuerStandort(prisma, standort.id) : [];
  const kannErfassen = Boolean(standort && gaeste.length > 0 && tische.length > 0);

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-009</p>
        <h1>Walk-in platzieren</h1>
        <p>Spontane Gäste nur bei einem freien zweistündigen Tischzeitfenster platzieren.</p>
      </header>

      {parameter.erfolg ? <p className="erfolg karte">{parameter.erfolg}</p> : null}
      {parameter.fehler ? <p className="fehler karte">{parameter.fehler}</p> : null}

      <form className="karte uebersicht-filter" method="get">
        <label>Standort
          <select defaultValue={standort?.id ?? ""} name="standortId" required>
            <option disabled value="">Bitte wählen</option>
            {standorte.map((eintrag) => <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>)}
          </select>
        </label>
        <button type="submit">Walk-in-Erfassung anzeigen</button>
      </form>
      {!standort && standorte.length > 0 ? <p className="fehler karte">Bitte einen gültigen aktiven Standort wählen.</p> : null}

      <section className="karte">
        <h2>Walk-in erfassen</h2>
        {!kannErfassen ? (
          <p className="leerzustand">Für einen Walk-in werden ein aktiver Standort, Gast und Tisch benötigt.</p>
        ) : (
          <form action={walkInPlatzieren} className="walk-in-formular">
            <label>Standort
              <input name="standortId" type="hidden" value={standort!.id} />
              <span>{standort!.name}</span>
            </label>
            <label>Gast
              <select name="gastId" required>
                {gaeste.map((gast) => <option key={gast.id} value={gast.id}>{gast.name}</option>)}
              </select>
            </label>
            <label>Tisch
              <select name="tischId" required>
                {tische.map((tisch) => (
                  <option key={tisch.id} value={tisch.id}>
                    Tisch {tisch.nummer} · {tisch.kapazitaet} Plätze
                  </option>
                ))}
              </select>
            </label>
            <label>Personenanzahl
              <input min="1" name="personenanzahl" required step="1" type="number" />
            </label>
            <label className="formular-breit">Notiz
              <textarea name="notiz" rows={3} />
            </label>
            <div className="formular-abschluss">
              <button type="submit">Jetzt platzieren</button>
              <span className="sekundaer">Das Planungsfenster beträgt zwei Stunden.</span>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
