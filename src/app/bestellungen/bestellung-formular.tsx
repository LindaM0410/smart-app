"use client";

import { useActionState } from "react";

import { bestellungAnlegen, bestellungBearbeiten, type BestellungFormularStatus } from "./actions";

const initialerStatus: BestellungFormularStatus = {};

type TischAuswahl = { id: string; nummer: string };
type ReservierungAuswahl = { id: string; gast: { name: string }; beginn: Date };
type BestellungWerte = {
  id: string;
  standortId: string;
  tischId: string;
  reservierungId: string | null;
  aufgenommenVonMitarbeiterId: string;
};

export function BestellungFormular({
  standortId,
  tische,
  reservierungen,
  bestellung,
}: {
  standortId: string;
  tische: TischAuswahl[];
  reservierungen: ReservierungAuswahl[];
  bestellung?: BestellungWerte;
}) {
  const aktion = bestellung ? bestellungBearbeiten : bestellungAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);

  return (
    <form action={formularAktion} className="bestellung-formular">
      <input name="standortId" type="hidden" value={standortId} />
      {bestellung ? <input name="id" type="hidden" value={bestellung.id} /> : null}

      <label>Tisch
        <select defaultValue={bestellung?.tischId ?? ""} name="tischId" required>
          <option value="">Bitte wählen</option>
          {tische.map((tisch) => <option key={tisch.id} value={tisch.id}>Tisch {tisch.nummer}</option>)}
        </select>
      </label>

      <label className="formular-breit">Reservierung <span className="sekundaer">(optional)</span>
        <select defaultValue={bestellung?.reservierungId ?? ""} name="reservierungId">
          <option value="">Ohne Reservierung</option>
          {reservierungen.map((reservierung) => (
            <option key={reservierung.id} value={reservierung.id}>
              {reservierung.gast.name} · {reservierung.beginn.toLocaleString("de-DE")}
            </option>
          ))}
        </select>
      </label>

      <div className="formular-abschluss">
        <button disabled={ausstehend || tische.length === 0} type="submit">
          {ausstehend ? "Wird gespeichert …" : bestellung ? "Änderungen speichern" : "Bestellung eröffnen"}
        </button>
        {status.meldung ? <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p> : null}
      </div>
    </form>
  );
}
