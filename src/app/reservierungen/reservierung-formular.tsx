"use client";

import { useActionState, useState } from "react";

import { RESERVIERUNGSSTATUS } from "@/lib/reservierungen";

import { reservierungAnlegen, reservierungBearbeiten } from "./actions";
import type { ReservierungFormularStatus } from "./actions";

const initialerStatus: ReservierungFormularStatus = { fehler: {} };

const statusBezeichnungen: Record<(typeof RESERVIERUNGSSTATUS)[number], string> = {
  angefragt: "Angefragt",
  bestaetigt: "Bestätigt",
  storniert: "Storniert",
  noShow: "No-Show",
  abgeschlossen: "Abgeschlossen",
};

type Auswahl = { id: string; name: string };
type TischAuswahl = { id: string; nummer: string; standortId: string };
type ReservierungWerte = {
  id: string;
  gastId: string;
  standortId: string;
  beginn: string;
  ende: string;
  personenanzahl: number;
  status: string;
  notiz: string;
  tischIds: string[];
};

export function ReservierungFormular({
  gaeste,
  standorte,
  tische,
  reservierung,
}: {
  gaeste: Auswahl[];
  standorte: Auswahl[];
  tische: TischAuswahl[];
  reservierung?: ReservierungWerte;
}) {
  const aktion = reservierung ? reservierungBearbeiten : reservierungAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);
  const kennung = reservierung?.id ?? "neu";
  const [standortId, setStandortId] = useState(reservierung?.standortId ?? "");
  const verfuegbareTische = tische.filter((tisch) => tisch.standortId === standortId);
  const waehlbareStatus = RESERVIERUNGSSTATUS.filter(
    (wert) => wert !== "noShow" || reservierung?.status === "noShow",
  );

  return (
    <form action={formularAktion} className="reservierung-formular">
      {reservierung ? <input name="id" type="hidden" value={reservierung.id} /> : null}

      <label>
        Gast
        <select defaultValue={reservierung?.gastId ?? ""} name="gastId" required>
          <option value="">Bitte wählen</option>
          {gaeste.map((gast) => <option key={gast.id} value={gast.id}>{gast.name}</option>)}
        </select>
        {status.fehler.gastId ? <span className="fehler">{status.fehler.gastId}</span> : null}
      </label>

      <label>
        Standort
        <select
          defaultValue={reservierung?.standortId ?? ""}
          name="standortId"
          onChange={(ereignis) => setStandortId(ereignis.target.value)}
          required
        >
          <option value="">Bitte wählen</option>
          {standorte.map((standort) => (
            <option key={standort.id} value={standort.id}>{standort.name}</option>
          ))}
        </select>
        {status.fehler.standortId ? <span className="fehler">{status.fehler.standortId}</span> : null}
      </label>

      <fieldset className="formular-breit tischauswahl">
        <legend>Tische <span className="sekundaer">(optional)</span></legend>
        {standortId.length === 0 ? (
          <p className="sekundaer">Bitte zuerst einen Standort wählen.</p>
        ) : verfuegbareTische.length === 0 ? (
          <p className="sekundaer">An diesem Standort sind keine aktiven Tische verfügbar.</p>
        ) : (
          <div className="auswahlgruppe">
            {verfuegbareTische.map((tisch) => (
              <label className="kontrollfeld" key={`${kennung}-${tisch.id}`}>
                <input
                  defaultChecked={reservierung?.tischIds.includes(tisch.id)}
                  name="tischIds"
                  type="checkbox"
                  value={tisch.id}
                />
                Tisch {tisch.nummer}
              </label>
            ))}
          </div>
        )}
        {status.fehler.tischIds ? <span className="fehler">{status.fehler.tischIds}</span> : null}
      </fieldset>

      <label>
        Beginn
        <input defaultValue={reservierung?.beginn} name="beginn" required type="datetime-local" />
        {status.fehler.beginn ? <span className="fehler">{status.fehler.beginn}</span> : null}
      </label>

      <label>
        Ende <span className="sekundaer">(leer = zwei Stunden)</span>
        <input defaultValue={reservierung?.ende} name="ende" type="datetime-local" />
        {status.fehler.ende ? <span className="fehler">{status.fehler.ende}</span> : null}
      </label>

      <label>
        Personenanzahl
        <input defaultValue={reservierung?.personenanzahl ?? 2} min="1" name="personenanzahl" required step="1" type="number" />
        {status.fehler.personenanzahl ? <span className="fehler">{status.fehler.personenanzahl}</span> : null}
      </label>

      <label>
        Status
        <select defaultValue={reservierung?.status ?? "angefragt"} name="status" required>
          {waehlbareStatus.map((wert) => (
            <option key={wert} value={wert}>{statusBezeichnungen[wert]}</option>
          ))}
        </select>
        {status.fehler.status ? <span className="fehler">{status.fehler.status}</span> : null}
      </label>

      <label className="formular-breit">
        Notiz
        <textarea defaultValue={reservierung?.notiz} name="notiz" rows={3} />
      </label>

      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">
          {ausstehend ? "Wird gespeichert …" : reservierung ? "Änderungen speichern" : "Reservierung anlegen"}
        </button>
        {status.meldung ? (
          <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p>
        ) : null}
      </div>
    </form>
  );
}
