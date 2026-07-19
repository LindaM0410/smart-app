"use client";

import { useActionState } from "react";

import { formatierePreis } from "@/lib/artikel";

import {
  bestellpositionAnlegen,
  bestellpositionBearbeiten,
  type BestellpositionFormularStatus,
} from "./actions";

const initialerStatus: BestellpositionFormularStatus = { fehler: {} };

type ArtikelAuswahl = { id: string; name: string; kategorie: string; preisCent: number };
type PositionWerte = {
  id: string;
  menge: number;
  sonderwunsch: string;
  artikel: { name: string; kategorie: string };
};

export function BestellpositionFormular({
  bestellungId,
  artikel,
  position,
}: {
  bestellungId: string;
  artikel: ArtikelAuswahl[];
  position?: PositionWerte;
}) {
  const aktion = position ? bestellpositionBearbeiten : bestellpositionAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);
  const kennung = position?.id ?? `neu-${bestellungId}`;

  return (
    <form action={formularAktion} className="bestellposition-formular">
      {position ? <input name="id" type="hidden" value={position.id} /> : <input name="bestellungId" type="hidden" value={bestellungId} />}
      {position ? (
        <div className="positionsartikel">
          <strong>{position.artikel.name}</strong>
          <span className="sekundaer">{position.artikel.kategorie}</span>
        </div>
      ) : (
        <label>Artikel
          <select name="artikelId" required>
            <option value="">Bitte wählen</option>
            {artikel.map((eintrag) => (
              <option key={eintrag.id} value={eintrag.id}>{eintrag.name} · {formatierePreis(eintrag.preisCent)}</option>
            ))}
          </select>
        </label>
      )}
      <label>Menge
        <input aria-describedby={status.fehler.menge ? `${kennung}-menge-fehler` : undefined} defaultValue={position?.menge ?? 1} min="1" name="menge" required step="1" type="number" />
        {status.fehler.menge ? <span className="fehler" id={`${kennung}-menge-fehler`}>{status.fehler.menge}</span> : null}
      </label>
      <label>Sonderwunsch <span className="sekundaer">(optional)</span>
        <input defaultValue={position?.sonderwunsch ?? ""} name="sonderwunsch" type="text" />
      </label>
      <div className="formular-abschluss">
        <button disabled={ausstehend || (!position && artikel.length === 0)} type="submit">
          {ausstehend ? "Wird gespeichert …" : position ? "Position speichern" : "Position hinzufügen"}
        </button>
        {status.meldung ? <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p> : null}
      </div>
    </form>
  );
}
