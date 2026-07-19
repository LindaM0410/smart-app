export type BestellpositionEingabe = {
  menge: number;
  sonderwunsch: string;
};

export type BestellpositionValidierungsfehler = Partial<Record<"menge", string>>;

export function validiereBestellposition(eingabe: BestellpositionEingabe): BestellpositionValidierungsfehler {
  if (!Number.isSafeInteger(eingabe.menge) || eingabe.menge <= 0) {
    return { menge: "Bitte eine positive ganze Menge angeben." };
  }
  return {};
}

export function hatBestellpositionValidierungsfehler(fehler: BestellpositionValidierungsfehler) {
  return Object.keys(fehler).length > 0;
}
