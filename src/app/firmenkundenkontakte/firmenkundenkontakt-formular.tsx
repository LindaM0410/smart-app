"use client";

import { useActionState } from "react";

import {
  firmenkundenkontaktAnlegen,
  firmenkundenkontaktBearbeiten,
  type FirmenkundenkontaktFormularStatus,
} from "./actions";

const initialerStatus: FirmenkundenkontaktFormularStatus = { fehler: {} };

type FirmenkundenkontaktWerte = {
  id: string;
  firmenname: string;
  ansprechperson: string;
  kontaktdaten: string;
  notiz: string;
  aktiv: boolean;
};

export function FirmenkundenkontaktFormular({
  kontakt,
}: {
  kontakt?: FirmenkundenkontaktWerte;
}) {
  const aktion = kontakt
    ? firmenkundenkontaktBearbeiten
    : firmenkundenkontaktAnlegen;
  const [status, formularAktion, ausstehend] = useActionState(
    aktion,
    initialerStatus,
  );
  const kennung = kontakt?.id ?? "neu";

  return (
    <form action={formularAktion} className="firmenkundenkontakt-formular">
      {kontakt ? <input name="id" type="hidden" value={kontakt.id} /> : null}

      <label>
        Firmenname
        <input
          aria-describedby={
            status.fehler.firmenname
              ? `${kennung}-firmenname-fehler`
              : undefined
          }
          defaultValue={kontakt?.firmenname}
          name="firmenname"
          required
        />
        {status.fehler.firmenname ? (
          <span className="fehler" id={`${kennung}-firmenname-fehler`}>
            {status.fehler.firmenname}
          </span>
        ) : null}
      </label>

      <label>
        Ansprechperson
        <input
          aria-describedby={
            status.fehler.ansprechperson
              ? `${kennung}-ansprechperson-fehler`
              : undefined
          }
          defaultValue={kontakt?.ansprechperson}
          name="ansprechperson"
          required
        />
        {status.fehler.ansprechperson ? (
          <span className="fehler" id={`${kennung}-ansprechperson-fehler`}>
            {status.fehler.ansprechperson}
          </span>
        ) : null}
      </label>

      <label className="formular-breit">
        Kontaktdaten
        <input
          aria-describedby={
            status.fehler.kontaktdaten
              ? `${kennung}-kontaktdaten-fehler`
              : undefined
          }
          defaultValue={kontakt?.kontaktdaten}
          name="kontaktdaten"
          placeholder="Telefon oder E-Mail"
          required
        />
        {status.fehler.kontaktdaten ? (
          <span className="fehler" id={`${kennung}-kontaktdaten-fehler`}>
            {status.fehler.kontaktdaten}
          </span>
        ) : null}
      </label>

      <label className="formular-breit">
        Notiz
        <textarea defaultValue={kontakt?.notiz} name="notiz" rows={3} />
      </label>

      <label className="kontrollfeld">
        <input
          defaultChecked={kontakt?.aktiv ?? true}
          name="aktiv"
          type="checkbox"
        />
        Firmenkundenkontakt aktiv
      </label>

      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">
          {ausstehend
            ? "Wird gespeichert …"
            : kontakt
              ? "Änderungen speichern"
              : "Firmenkundenkontakt anlegen"}
        </button>
        {status.meldung ? (
          <p
            className={status.erfolgreich ? "erfolg" : "fehler"}
            role="status"
          >
            {status.meldung}
          </p>
        ) : null}
      </div>
    </form>
  );
}
