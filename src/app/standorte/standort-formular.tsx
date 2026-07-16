"use client";

import { useActionState } from "react";

import {
  initialerStandortFormularStatus,
  standortAnlegen,
  standortBearbeiten,
} from "./actions";

type StandortWerte = {
  id: string;
  name: string;
  adresse: string;
  sitzplaetze: number;
  hatTerrasse: boolean;
  hatGrill: boolean;
  aktiv: boolean;
};

export function StandortFormular({ standort }: { standort?: StandortWerte }) {
  const aktion = standort ? standortBearbeiten : standortAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(
    aktion,
    initialerStandortFormularStatus,
  );

  return (
    <form action={formularAktion} className="standort-formular">
      {standort ? <input name="id" type="hidden" value={standort.id} /> : null}

      <label>
        Name
        <input
          aria-describedby={status.fehler.name ? `${standort?.id ?? "neu"}-name-fehler` : undefined}
          defaultValue={standort?.name}
          name="name"
          required
        />
        {status.fehler.name ? (
          <span className="fehler" id={`${standort?.id ?? "neu"}-name-fehler`}>
            {status.fehler.name}
          </span>
        ) : null}
      </label>

      <label>
        Adresse
        <input
          aria-describedby={status.fehler.adresse ? `${standort?.id ?? "neu"}-adresse-fehler` : undefined}
          defaultValue={standort?.adresse}
          name="adresse"
          required
        />
        {status.fehler.adresse ? (
          <span className="fehler" id={`${standort?.id ?? "neu"}-adresse-fehler`}>
            {status.fehler.adresse}
          </span>
        ) : null}
      </label>

      <label>
        Sitzplätze
        <input
          aria-describedby={status.fehler.sitzplaetze ? `${standort?.id ?? "neu"}-sitzplaetze-fehler` : undefined}
          defaultValue={standort?.sitzplaetze}
          min="1"
          name="sitzplaetze"
          required
          step="1"
          type="number"
        />
        {status.fehler.sitzplaetze ? (
          <span className="fehler" id={`${standort?.id ?? "neu"}-sitzplaetze-fehler`}>
            {status.fehler.sitzplaetze}
          </span>
        ) : null}
      </label>

      <div className="auswahlgruppe">
        <label className="kontrollfeld">
          <input defaultChecked={standort?.hatTerrasse} name="hatTerrasse" type="checkbox" />
          Terrasse vorhanden
        </label>
        <label className="kontrollfeld">
          <input defaultChecked={standort?.hatGrill} name="hatGrill" type="checkbox" />
          Grill vorhanden
        </label>
        <label className="kontrollfeld">
          <input defaultChecked={standort?.aktiv ?? true} name="aktiv" type="checkbox" />
          Standort aktiv
        </label>
      </div>

      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">
          {ausstehend ? "Wird gespeichert …" : standort ? "Änderungen speichern" : "Standort anlegen"}
        </button>
        {status.meldung ? (
          <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">
            {status.meldung}
          </p>
        ) : null}
      </div>
    </form>
  );
}
