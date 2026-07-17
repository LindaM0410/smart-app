"use client";

import { useActionState, useState } from "react";

import { tischKombinationAnlegen, type TischKombinationFormularStatus } from "./actions";

const initialerStatus: TischKombinationFormularStatus = { fehler: {} };

type StandortAuswahl = { id: string; name: string };
type TischAuswahl = { id: string; standortId: string; nummer: string };

export function TischKombinationFormular({
  standorte,
  tische,
}: {
  standorte: StandortAuswahl[];
  tische: TischAuswahl[];
}) {
  const [status, formularAktion, ausstehend] = useActionState(
    tischKombinationAnlegen,
    initialerStatus,
  );
  const [standortId, setStandortId] = useState(standorte[0]?.id ?? "");
  const passendeTische = tische.filter((tisch) => tisch.standortId === standortId);

  return (
    <form action={formularAktion} className="tischkombination-formular">
      <label>
        Standort
        <select name="standortId" onChange={(event) => setStandortId(event.target.value)} value={standortId}>
          {standorte.map((standort) => (
            <option key={standort.id} value={standort.id}>{standort.name}</option>
          ))}
        </select>
        {status.fehler.standortId ? <span className="fehler">{status.fehler.standortId}</span> : null}
      </label>

      <fieldset className="tischauswahl">
        <legend>Kombinierbare Tische</legend>
        {passendeTische.length < 2 ? (
          <p className="sekundaer">An diesem Standort sind weniger als zwei aktive, kombinierbare Tische vorhanden.</p>
        ) : (
          passendeTische.map((tisch) => (
            <label className="kontrollfeld" key={tisch.id}>
              <input name="tischIds" type="checkbox" value={tisch.id} />
              Tisch {tisch.nummer}
            </label>
          ))
        )}
        {status.fehler.tischIds ? <span className="fehler">{status.fehler.tischIds}</span> : null}
      </fieldset>

      <div className="formular-abschluss">
        <button disabled={ausstehend || passendeTische.length < 2} type="submit">
          {ausstehend ? "Wird gespeichert …" : "Kombination anlegen"}
        </button>
        {status.meldung ? (
          <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p>
        ) : null}
      </div>
    </form>
  );
}
