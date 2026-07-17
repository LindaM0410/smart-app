import Link from "next/link";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";
import { ladeTischuebersicht } from "@/lib/tischuebersicht-persistenz";
import { berlinZeitpunkt, folgetag } from "@/lib/tischuebersicht";

export const dynamic = "force-dynamic";

type Eigenschaften = {
  searchParams: Promise<{ standortId?: string; datum?: string; uhrzeit?: string }>;
};

const statusdarstellung = {
  frei: { text: "Frei", klasse: "frei" },
  baldReserviert: { text: "Bald reserviert", klasse: "bald-reserviert" },
  belegt: { text: "Belegt", klasse: "belegt" },
} as const;

function heutigeBerlinZeit() {
  const teile = Object.fromEntries(new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map((teil) => [teil.type, teil.value]));
  return { datum: `${teile.year}-${teile.month}-${teile.day}`, uhrzeit: `${teile.hour}:${teile.minute}` };
}

export default async function TischuebersichtSeite({ searchParams }: Eigenschaften) {
  await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const [parameter, standorte] = await Promise.all([
    searchParams,
    prisma.standort.findMany({ where: { aktiv: true }, orderBy: { name: "asc" } }),
  ]);
  const jetzt = heutigeBerlinZeit();
  const standortId = parameter.standortId ?? standorte[0]?.id ?? "";
  const datum = parameter.datum ?? jetzt.datum;
  const uhrzeit = parameter.uhrzeit ?? jetzt.uhrzeit;
  const referenzzeit = berlinZeitpunkt(datum, uhrzeit);
  const tagesende = berlinZeitpunkt(folgetag(datum), "00:00");
  const standort = standorte.find(({ id }) => id === standortId);
  const auswahlGueltig = Boolean(standort && referenzzeit && tagesende && referenzzeit < tagesende);
  const tische = auswahlGueltig
    ? await ladeTischuebersicht(prisma, standortId, referenzzeit!, tagesende!)
    : [];

  return (
    <main>
      <Link className="zurueck" href="/">← Startseite</Link>
      <header className="seitenkopf">
        <p className="kennung">BV-008</p>
        <h1>Tischübersicht</h1>
        <p>Freie, bald reservierte und real belegte Tische pro Standort und Tag.</p>
      </header>

      <form className="karte uebersicht-filter" method="get">
        <label>Standort
          <select name="standortId" defaultValue={standortId} required>
            {standorte.map((eintrag) => <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>)}
          </select>
        </label>
        <label>Datum
          <input name="datum" type="date" defaultValue={datum} required />
        </label>
        <label>Uhrzeit
          <input name="uhrzeit" type="time" defaultValue={uhrzeit} required />
        </label>
        <button type="submit">Übersicht anzeigen</button>
      </form>

      {!auswahlGueltig && standorte.length > 0 ? (
        <p className="fehler karte">Bitte Standort, Datum und Uhrzeit gültig auswählen.</p>
      ) : null}
      {standorte.length === 0 ? <p className="leerzustand">Kein aktiver Standort vorhanden.</p> : null}

      {auswahlGueltig ? (
        <section className="standortliste" aria-live="polite">
          <h2>{standort?.name} · {referenzzeit!.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })} um {uhrzeit} Uhr</h2>
          <div className="statuslegende" aria-label="Legende">
            {Object.values(statusdarstellung).map(({ text, klasse }) => (
              <span className={`tischstatus ${klasse}`} key={klasse}>{text}</span>
            ))}
          </div>
          {tische.length === 0 ? <p className="leerzustand">Keine aktiven Tische an diesem Standort.</p> : (
            <div className="tischraster">
              {tische.map((tisch) => {
                const darstellung = statusdarstellung[tisch.status];
                return (
                  <article className={`karte tischkarte ${darstellung.klasse}`} key={tisch.id}>
                    <div>
                      <h3>Tisch {tisch.nummer}</h3>
                      <p className="sekundaer">{tisch.kapazitaet} Plätze · {tisch.bereich}</p>
                    </div>
                    <span className={`tischstatus ${darstellung.klasse}`}>{darstellung.text}</span>
                    {tisch.status === "baldReserviert" && tisch.naechsteReservierung ? (
                      <p className="sekundaer">Reserviert ab {tisch.naechsteReservierung.toLocaleTimeString("de-DE", {
                        timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit",
                      })} Uhr</p>
                    ) : null}
                    {tisch.warntVorFolgereservierung && tisch.naechsteReservierung ? (
                      <p className="folgereservierungswarnung" role="status">
                        Achtung: Folgereservierung um {tisch.naechsteReservierung.toLocaleTimeString("de-DE", {
                          timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit",
                        })} Uhr. Tisch ist noch belegt.
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
