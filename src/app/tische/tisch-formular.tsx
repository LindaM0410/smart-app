"use client";

import { useActionState } from "react";

import { tischbereiche } from "@/lib/tische";

import { tischAnlegen, tischBearbeiten } from "./actions";
import type { TischFormularStatus } from "./actions";

const initialerStatus: TischFormularStatus = { fehler: {} };

type TischWerte = {
  id: string;
  standortId: string;
  nummer: string;
  kapazitaet: number;
  bereich: string;
  kombinierbar: boolean;
  aktiv: boolean;
};

type StandortAuswahl = { id: string; name: string; aktiv: boolean };

export function TischFormular({
  tisch,
  standorte,
}: {
  tisch?: TischWerte;
  standorte: StandortAuswahl[];
}) {
  const aktion = tisch ? tischBearbeiten : tischAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);
  const kennung = tisch?.id ?? "neu";

  return (
    <form action={formularAktion} className="tisch-formular">
      {tisch ? <input name="id" type="hidden" value={tisch.id} /> : null}

      <label>
        Standort
        <select
          aria-describedby={status.fehler.standortId ? `${kennung}-standort-fehler` : undefined}
          defaultValue={tisch?.standortId ?? ""}
          name="standortId"
          required
        >
          <option disabled value="">Standort auswählen</option>
          {standorte.map((standort) => (
            <option key={standort.id} value={standort.id}>
              {standort.name}{standort.aktiv ? "" : " (inaktiv)"}
            </option>
          ))}
        </select>
        {status.fehler.standortId ? (
          <span className="fehler" id={`${kennung}-standort-fehler`}>
            {status.fehler.standortId}
          </span>
        ) : null}
      </label>

      <label>
        Tischnummer
        <input
          aria-describedby={status.fehler.nummer ? `${kennung}-nummer-fehler` : undefined}
          defaultValue={tisch?.nummer}
          name="nummer"
          required
        />
        {status.fehler.nummer ? (
          <span className="fehler" id={`${kennung}-nummer-fehler`}>
            {status.fehler.nummer}
          </span>
        ) : null}
      </label>

      <label>
        Kapazität
        <input
          aria-describedby={status.fehler.kapazitaet ? `${kennung}-kapazitaet-fehler` : undefined}
          defaultValue={tisch?.kapazitaet}
          min="1"
          name="kapazitaet"
          required
          step="1"
          type="number"
        />
        {status.fehler.kapazitaet ? (
          <span className="fehler" id={`${kennung}-kapazitaet-fehler`}>
            {status.fehler.kapazitaet}
          </span>
        ) : null}
      </label>

      <label>
        Bereich
        <select
          aria-describedby={status.fehler.bereich ? `${kennung}-bereich-fehler` : undefined}
          defaultValue={tisch?.bereich ?? "innen"}
          name="bereich"
          required
        >
          {tischbereiche.map((bereich) => (
            <option key={bereich} value={bereich}>{bereich}</option>
          ))}
        </select>
        {status.fehler.bereich ? (
          <span className="fehler" id={`${kennung}-bereich-fehler`}>
            {status.fehler.bereich}
          </span>
        ) : null}
      </label>

      <div className="auswahlgruppe">
        <label className="kontrollfeld">
          <input defaultChecked={tisch?.kombinierbar} name="kombinierbar" type="checkbox" />
          Mit anderen Tischen kombinierbar
        </label>
        <label className="kontrollfeld">
          <input defaultChecked={tisch?.aktiv ?? true} name="aktiv" type="checkbox" />
          Tisch aktiv
        </label>
      </div>

      <div className="formular-abschluss">
        <button disabled={ausstehend || standorte.length === 0} type="submit">
          {ausstehend ? "Wird gespeichert …" : tisch ? "Änderungen speichern" : "Tisch anlegen"}
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
