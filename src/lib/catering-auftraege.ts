import {
  formatierePreis,
  formatierePreiseingabe,
  parsePreisCent,
} from "./artikel.ts";

export const CATERING_STARTSTATUS = "angefragt";

export type CateringAuftragEingabe = {
  firmenkundenkontaktId: string;
  lieferadresse: string;
  datum: Date;
  uhrzeit: string;
  personenanzahl: number;
  menueBeschreibung: string;
  preisGesamtCent: number;
  notiz: string;
};

export type CateringAuftragValidierungsfehler = Partial<
  Record<
    | "firmenkundenkontaktId"
    | "lieferadresse"
    | "datum"
    | "uhrzeit"
    | "personenanzahl"
    | "menueBeschreibung"
    | "preisGesamtCent",
    string
  >
>;

export function parseCateringDatum(wert: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return new Date(Number.NaN);
  const datum = new Date(`${wert}T00:00:00.000Z`);
  return !Number.isNaN(datum.getTime()) &&
    datum.toISOString().slice(0, 10) === wert
    ? datum
    : new Date(Number.NaN);
}

export function formatiereCateringDatum(datum: Date): string {
  return datum.toISOString().slice(0, 10);
}

export function validiereCateringAuftrag(
  eingabe: CateringAuftragEingabe,
): CateringAuftragValidierungsfehler {
  const fehler: CateringAuftragValidierungsfehler = {};

  if (eingabe.firmenkundenkontaktId.trim().length === 0) {
    fehler.firmenkundenkontaktId =
      "Bitte einen Firmenkundenkontakt auswählen.";
  }
  if (eingabe.lieferadresse.trim().length === 0) {
    fehler.lieferadresse = "Bitte eine Lieferadresse angeben.";
  }
  if (Number.isNaN(eingabe.datum.getTime())) {
    fehler.datum = "Bitte ein gültiges Lieferdatum angeben.";
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eingabe.uhrzeit)) {
    fehler.uhrzeit = "Bitte eine gültige Lieferzeit angeben.";
  }
  if (
    !Number.isSafeInteger(eingabe.personenanzahl) ||
    eingabe.personenanzahl <= 0
  ) {
    fehler.personenanzahl = "Bitte eine positive ganze Personenzahl angeben.";
  }
  if (eingabe.menueBeschreibung.trim().length === 0) {
    fehler.menueBeschreibung = "Bitte das vereinbarte Menü beschreiben.";
  }
  if (
    !Number.isSafeInteger(eingabe.preisGesamtCent) ||
    eingabe.preisGesamtCent < 0
  ) {
    fehler.preisGesamtCent =
      "Bitte einen nicht negativen Preis mit höchstens zwei Nachkommastellen angeben (z. B. 250,00).";
  }

  return fehler;
}

export function hatCateringAuftragValidierungsfehler(
  fehler: CateringAuftragValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}

export { formatierePreis, formatierePreiseingabe, parsePreisCent };
