"use client";

import { useActionState } from "react";

import { gastAnlegen, gastBearbeiten } from "./actions";
import type { GastFormularStatus } from "./actions";

const initialerStatus: GastFormularStatus = { fehler: {} };

type GastWerte = {
  id: string;
  name: string;
  telefon: string;
  notiz: string;
  istStammgast: boolean;
  hatBellaCard: boolean;
  besuchsanzahl: number;
  aktiv: boolean;
};

export function GastFormular({ gast }: { gast?: GastWerte }) {
  const aktion = gast ? gastBearbeiten : gastAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);
  const kennung = gast?.id ?? "neu";

  return (
    <form action={formularAktion} className="gast-formular">
      {gast ? <input name="id" type="hidden" value={gast.id} /> : null}

      <label>
        Name
        <input
          aria-describedby={status.fehler.name ? `${kennung}-name-fehler` : undefined}
          defaultValue={gast?.name}
          name="name"
          required
        />
        {status.fehler.name ? (
          <span className="fehler" id={`${kennung}-name-fehler`}>
            {status.fehler.name}
          </span>
        ) : null}
      </label>

      <label>
        Telefon
        <input defaultValue={gast?.telefon} name="telefon" type="tel" />
      </label>

      <label className="formular-breit">
        Notiz
        <textarea defaultValue={gast?.notiz} name="notiz" rows={3} />
      </label>

      <label>
        Besuchsanzahl
        <input
          aria-describedby={status.fehler.besuchsanzahl ? `${kennung}-besuche-fehler` : undefined}
          defaultValue={gast?.besuchsanzahl ?? 0}
          min="0"
          name="besuchsanzahl"
          required
          step="1"
          type="number"
        />
        {status.fehler.besuchsanzahl ? (
          <span className="fehler" id={`${kennung}-besuche-fehler`}>
            {status.fehler.besuchsanzahl}
          </span>
        ) : null}
      </label>

      <div className="auswahlgruppe">
        <label className="kontrollfeld">
          <input defaultChecked={gast?.istStammgast} name="istStammgast" type="checkbox" />
          Stammgast
        </label>
        <label className="kontrollfeld">
          <input defaultChecked={gast?.hatBellaCard} name="hatBellaCard" type="checkbox" />
          Aktive Bella-Card
        </label>
        <label className="kontrollfeld">
          <input defaultChecked={gast?.aktiv ?? true} name="aktiv" type="checkbox" />
          Gast aktiv
        </label>
      </div>

      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">
          {ausstehend ? "Wird gespeichert …" : gast ? "Änderungen speichern" : "Gast anlegen"}
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
