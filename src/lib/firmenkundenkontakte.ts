export type FirmenkundenkontaktEingabe = {
  firmenname: string;
  ansprechperson: string;
  kontaktdaten: string;
  notiz: string;
  aktiv: boolean;
};

export type FirmenkundenkontaktValidierungsfehler = Partial<
  Record<"firmenname" | "ansprechperson" | "kontaktdaten", string>
>;

export function validiereFirmenkundenkontakt(
  eingabe: FirmenkundenkontaktEingabe,
): FirmenkundenkontaktValidierungsfehler {
  const fehler: FirmenkundenkontaktValidierungsfehler = {};

  if (eingabe.firmenname.trim().length === 0) {
    fehler.firmenname = "Bitte einen Firmennamen angeben.";
  }
  if (eingabe.ansprechperson.trim().length === 0) {
    fehler.ansprechperson = "Bitte eine Ansprechperson angeben.";
  }
  if (eingabe.kontaktdaten.trim().length === 0) {
    fehler.kontaktdaten = "Bitte Kontaktdaten angeben.";
  }

  return fehler;
}

export function hatFirmenkundenkontaktValidierungsfehler(
  fehler: FirmenkundenkontaktValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
