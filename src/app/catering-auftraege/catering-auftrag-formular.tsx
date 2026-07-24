"use client";

import { useActionState } from "react";

import {
  formatiereCateringDatum,
  formatierePreiseingabe,
} from "@/lib/catering-auftraege";

import {
  cateringAuftragAnlegen,
  cateringAuftragBearbeiten,
  type CateringAuftragFormularStatus,
} from "./actions";

const initialerStatus: CateringAuftragFormularStatus = { fehler: {} };

type FirmenkontaktOption = {
  id: string;
  firmenname: string;
  ansprechperson: string;
};

type CateringAuftragWerte = {
  id: string;
  firmenkundenkontaktId: string;
  lieferadresse: string;
  datum: Date;
  uhrzeit: string;
  personenanzahl: number;
  menueBeschreibung: string;
  preisGesamtCent: number;
  notiz: string;
  status: string;
};

export function CateringAuftragFormular({
  auftrag,
  kontakte,
}: {
  auftrag?: CateringAuftragWerte;
  kontakte: FirmenkontaktOption[];
}) {
  const [status, formularAktion, ausstehend] = useActionState(
    auftrag ? cateringAuftragBearbeiten : cateringAuftragAnlegen,
    initialerStatus,
  );
  const kennung = auftrag?.id ?? "neu";

  return (
    <form action={formularAktion} className="catering-auftrag-formular">
      {auftrag ? <input name="id" type="hidden" value={auftrag.id} /> : null}

      <label className="formular-breit">
        Firmenkundenkontakt
        <select
          aria-describedby={
            status.fehler.firmenkundenkontaktId
              ? `${kennung}-kontakt-fehler`
              : undefined
          }
          defaultValue={auftrag?.firmenkundenkontaktId ?? ""}
          name="firmenkundenkontaktId"
          required
        >
          <option disabled value="">
            Bitte auswählen
          </option>
          {kontakte.map((kontakt) => (
            <option key={kontakt.id} value={kontakt.id}>
              {kontakt.firmenname} · {kontakt.ansprechperson}
            </option>
          ))}
        </select>
        {status.fehler.firmenkundenkontaktId ? (
          <span className="fehler" id={`${kennung}-kontakt-fehler`}>
            {status.fehler.firmenkundenkontaktId}
          </span>
        ) : null}
      </label>

      <label className="formular-breit">
        Lieferadresse
        <input
          aria-describedby={
            status.fehler.lieferadresse
              ? `${kennung}-lieferadresse-fehler`
              : undefined
          }
          defaultValue={auftrag?.lieferadresse}
          name="lieferadresse"
          required
        />
        {status.fehler.lieferadresse ? (
          <span className="fehler" id={`${kennung}-lieferadresse-fehler`}>
            {status.fehler.lieferadresse}
          </span>
        ) : null}
      </label>

      <label>
        Lieferdatum
        <input
          aria-describedby={
            status.fehler.datum ? `${kennung}-datum-fehler` : undefined
          }
          defaultValue={
            auftrag ? formatiereCateringDatum(auftrag.datum) : undefined
          }
          name="datum"
          required
          type="date"
        />
        {status.fehler.datum ? (
          <span className="fehler" id={`${kennung}-datum-fehler`}>
            {status.fehler.datum}
          </span>
        ) : null}
      </label>

      <label>
        Lieferzeit
        <input
          aria-describedby={
            status.fehler.uhrzeit ? `${kennung}-uhrzeit-fehler` : undefined
          }
          defaultValue={auftrag?.uhrzeit}
          name="uhrzeit"
          required
          type="time"
        />
        {status.fehler.uhrzeit ? (
          <span className="fehler" id={`${kennung}-uhrzeit-fehler`}>
            {status.fehler.uhrzeit}
          </span>
        ) : null}
      </label>

      <label>
        Personenzahl
        <input
          aria-describedby={
            status.fehler.personenanzahl
              ? `${kennung}-personenanzahl-fehler`
              : undefined
          }
          defaultValue={auftrag?.personenanzahl}
          min={1}
          name="personenanzahl"
          required
          step={1}
          type="number"
        />
        {status.fehler.personenanzahl ? (
          <span className="fehler" id={`${kennung}-personenanzahl-fehler`}>
            {status.fehler.personenanzahl}
          </span>
        ) : null}
      </label>

      <label>
        Vereinbarter Gesamtpreis (€)
        <input
          aria-describedby={
            status.fehler.preisGesamtCent
              ? `${kennung}-preis-fehler`
              : undefined
          }
          defaultValue={
            auftrag
              ? formatierePreiseingabe(auftrag.preisGesamtCent)
              : undefined
          }
          inputMode="decimal"
          name="preisGesamt"
          pattern="[0-9]+(,[0-9]{1,2})?"
          placeholder="250,00"
          required
          type="text"
        />
        {status.fehler.preisGesamtCent ? (
          <span className="fehler" id={`${kennung}-preis-fehler`}>
            {status.fehler.preisGesamtCent}
          </span>
        ) : null}
      </label>

      <label className="formular-breit">
        Menü / Menübeschreibung
        <textarea
          aria-describedby={
            status.fehler.menueBeschreibung
              ? `${kennung}-menue-fehler`
              : undefined
          }
          defaultValue={auftrag?.menueBeschreibung}
          name="menueBeschreibung"
          required
          rows={4}
        />
        {status.fehler.menueBeschreibung ? (
          <span className="fehler" id={`${kennung}-menue-fehler`}>
            {status.fehler.menueBeschreibung}
          </span>
        ) : null}
      </label>

      <label className="formular-breit">
        Notiz (optional)
        <textarea defaultValue={auftrag?.notiz} name="notiz" rows={3} />
      </label>

      <p className="formular-breit sekundaer">
        Status: <strong>{auftrag?.status ?? "angefragt"}</strong>
      </p>

      <div className="formular-abschluss">
        <button disabled={ausstehend} type="submit">
          {ausstehend
            ? "Wird gespeichert …"
            : auftrag
              ? "Änderungen speichern"
              : "Catering-Auftrag anlegen"}
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
