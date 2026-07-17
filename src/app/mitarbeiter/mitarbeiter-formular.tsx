"use client";

import { useActionState } from "react";

import { MITARBEITER_ROLLEN } from "@/lib/mitarbeiter";

import { mitarbeiterAnlegen, mitarbeiterBearbeiten } from "./actions";
import type { MitarbeiterFormularStatus } from "./actions";

const initialerStatus: MitarbeiterFormularStatus = { fehler: {} };

const rollenNamen = {
  inhaber: "Inhaber",
  manager: "Manager",
  bedienung: "Bedienung",
  kueche: "Küche",
};

type MitarbeiterWerte = {
  id: string;
  name: string;
  benutzername: string;
  rolle: string;
  hauptstandortId: string;
  aktiv: boolean;
};

type StandortWerte = { id: string; name: string };

export function MitarbeiterFormular({
  mitarbeiter,
  standorte,
}: {
  mitarbeiter?: MitarbeiterWerte;
  standorte: StandortWerte[];
}) {
  const aktion = mitarbeiter ? mitarbeiterBearbeiten : mitarbeiterAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(aktion, initialerStatus);
  const kennung = mitarbeiter?.id ?? "neu";

  return (
    <form action={formularAktion} className="mitarbeiter-formular">
      {mitarbeiter ? <input name="id" type="hidden" value={mitarbeiter.id} /> : null}

      <label>
        Name
        <input
          aria-describedby={status.fehler.name ? `${kennung}-name-fehler` : undefined}
          defaultValue={mitarbeiter?.name}
          name="name"
          required
        />
        {status.fehler.name ? <span className="fehler" id={`${kennung}-name-fehler`}>{status.fehler.name}</span> : null}
      </label>

      <label>
        Benutzername
        <input
          aria-describedby={status.fehler.benutzername ? `${kennung}-benutzername-fehler` : undefined}
          autoCapitalize="none"
          autoComplete="off"
          defaultValue={mitarbeiter?.benutzername}
          name="benutzername"
          required
        />
        {status.fehler.benutzername ? <span className="fehler" id={`${kennung}-benutzername-fehler`}>{status.fehler.benutzername}</span> : null}
      </label>

      <label>
        Rolle
        <select
          aria-describedby={status.fehler.rolle ? `${kennung}-rolle-fehler` : undefined}
          defaultValue={mitarbeiter?.rolle ?? ""}
          name="rolle"
          required
        >
          <option disabled value="">Rolle auswählen</option>
          {MITARBEITER_ROLLEN.map((rolle) => <option key={rolle} value={rolle}>{rollenNamen[rolle]}</option>)}
        </select>
        {status.fehler.rolle ? <span className="fehler" id={`${kennung}-rolle-fehler`}>{status.fehler.rolle}</span> : null}
      </label>

      <label>
        Hauptstandort
        <select
          aria-describedby={status.fehler.hauptstandortId ? `${kennung}-standort-fehler` : undefined}
          defaultValue={mitarbeiter?.hauptstandortId ?? ""}
          name="hauptstandortId"
          required
        >
          <option disabled value="">Standort auswählen</option>
          {standorte.map((standort) => <option key={standort.id} value={standort.id}>{standort.name}</option>)}
        </select>
        {status.fehler.hauptstandortId ? <span className="fehler" id={`${kennung}-standort-fehler`}>{status.fehler.hauptstandortId}</span> : null}
      </label>

      <div className="auswahlgruppe">
        <label className="kontrollfeld">
          <input defaultChecked={mitarbeiter?.aktiv ?? true} name="aktiv" type="checkbox" />
          Mitarbeiter aktiv
        </label>
      </div>

      <div className="formular-abschluss">
        <button disabled={ausstehend || standorte.length === 0} type="submit">
          {ausstehend ? "Wird gespeichert …" : mitarbeiter ? "Änderungen speichern" : "Mitarbeiter anlegen"}
        </button>
        {status.meldung ? <p className={status.erfolgreich ? "erfolg" : "fehler"} role="status">{status.meldung}</p> : null}
      </div>
    </form>
  );
}
