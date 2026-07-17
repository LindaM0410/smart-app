"use client";

import { useActionState } from "react";

import { formatierePreiseingabe } from "@/lib/artikel";

import { artikelAnlegen, artikelBearbeiten, type ArtikelFormularStatus } from "./actions";

const initialerStatus: ArtikelFormularStatus = { fehler: {} };

type StandortOption = { id: string; name: string; hatGrill: boolean };
type ArtikelWerte = {
  id: string;
  name: string;
  kategorie: string;
  preisCent: number;
  benoetigtGrill: boolean;
  aktiv: boolean;
  standortIds: string[];
};

export function ArtikelFormular({ artikel, standorte }: { artikel?: ArtikelWerte; standorte: StandortOption[] }) {
  const [status, formularAktion, ausstehend] = useActionState(
    artikel ? artikelBearbeiten : artikelAnlegen,
    initialerStatus,
  );
  const kennung = artikel?.id ?? "neu";

  return (
    <form action={formularAktion} className="artikel-formular">
      {artikel ? <input name="id" type="hidden" value={artikel.id} /> : null}
      <label>
        Name
        <input aria-describedby={status.fehler.name ? `${kennung}-name-fehler` : undefined} defaultValue={artikel?.name} name="name" required />
        {status.fehler.name ? <span className="fehler" id={`${kennung}-name-fehler`}>{status.fehler.name}</span> : null}
      </label>
      <label>
        Kategorie
        <input aria-describedby={status.fehler.kategorie ? `${kennung}-kategorie-fehler` : undefined} defaultValue={artikel?.kategorie} name="kategorie" required />
        {status.fehler.kategorie ? <span className="fehler" id={`${kennung}-kategorie-fehler`}>{status.fehler.kategorie}</span> : null}
      </label>
      <label>
        Preis in Euro (€)
        <input
          aria-describedby={status.fehler.preisCent ? `${kennung}-preis-fehler` : undefined}
          defaultValue={artikel ? formatierePreiseingabe(artikel.preisCent) : ""}
          inputMode="decimal"
          name="preis"
          pattern="[0-9]+(,[0-9]{1,2})?"
          placeholder="12,50"
          required
          type="text"
        />
        {status.fehler.preisCent ? <span className="fehler" id={`${kennung}-preis-fehler`}>{status.fehler.preisCent}</span> : null}
      </label>
      <div className="auswahlgruppe">
        <label className="kontrollfeld"><input defaultChecked={artikel?.benoetigtGrill} name="benoetigtGrill" type="checkbox" />Benötigt Grill</label>
        <label className="kontrollfeld"><input defaultChecked={artikel?.aktiv ?? true} name="aktiv" type="checkbox" />Artikel aktiv</label>
      </div>
      <fieldset className="tischauswahl formular-breit" aria-describedby={status.fehler.standortIds ? `${kennung}-standorte-fehler` : undefined}>
        <legend>Standortfreigaben</legend>
        {standorte.map((standort) => (
          <label className="kontrollfeld" key={standort.id}>
            <input defaultChecked={artikel?.standortIds.includes(standort.id)} name="standortIds" type="checkbox" value={standort.id} />
            {standort.name}{standort.hatGrill ? " · mit Grill" : " · ohne Grill"}
          </label>
        ))}
        {status.fehler.standortIds ? <span className="fehler" id={`${kennung}-standorte-fehler`}>{status.fehler.standortIds}</span> : null}
      </fieldset>
      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">{ausstehend ? "Wird gespeichert …" : artikel ? "Änderungen speichern" : "Artikel anlegen"}</button>
        {status.meldung ? <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p> : null}
      </div>
    </form>
  );
}
