export const WALK_IN_DAUER_IN_MS = 2 * 60 * 60 * 1000;

export type WalkInEingabe = {
  gastId: string;
  standortId: string;
  tischId: string;
  personenanzahl: number;
  notiz: string;
};

export type WalkInValidierungsfehler = Partial<
  Record<"gastId" | "standortId" | "tischId" | "personenanzahl", string>
>;

export function validiereWalkIn(eingabe: WalkInEingabe): WalkInValidierungsfehler {
  const fehler: WalkInValidierungsfehler = {};
  if (!eingabe.gastId.trim()) fehler.gastId = "Bitte einen Gast wählen.";
  if (!eingabe.standortId.trim()) fehler.standortId = "Bitte einen Standort wählen.";
  if (!eingabe.tischId.trim()) fehler.tischId = "Bitte einen Tisch wählen.";
  if (!Number.isInteger(eingabe.personenanzahl) || eingabe.personenanzahl <= 0) {
    fehler.personenanzahl = "Die Personenanzahl muss eine positive ganze Zahl sein.";
  }
  return fehler;
}
