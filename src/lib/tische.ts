export const tischbereiche = ["innen", "außen", "fenster", "bar"] as const;

export type Tischbereich = (typeof tischbereiche)[number];

export type TischEingabe = {
  standortId: string;
  nummer: string;
  kapazitaet: number;
  bereich: string;
  kombinierbar: boolean;
  aktiv: boolean;
};

export type TischValidierungsfehler = Partial<
  Record<"standortId" | "nummer" | "kapazitaet" | "bereich", string>
>;

export function istTischbereich(wert: string): wert is Tischbereich {
  return (tischbereiche as readonly string[]).includes(wert);
}

export function validiereTisch(eingabe: TischEingabe): TischValidierungsfehler {
  const fehler: TischValidierungsfehler = {};

  if (eingabe.standortId.trim().length === 0) {
    fehler.standortId = "Bitte einen Standort auswählen.";
  }

  if (eingabe.nummer.trim().length === 0) {
    fehler.nummer = "Bitte eine Tischnummer angeben.";
  }

  if (!Number.isInteger(eingabe.kapazitaet) || eingabe.kapazitaet <= 0) {
    fehler.kapazitaet = "Die Kapazität muss eine positive ganze Zahl sein.";
  }

  if (!istTischbereich(eingabe.bereich)) {
    fehler.bereich = "Bitte einen gültigen Bereich auswählen.";
  }

  return fehler;
}

export function hatTischValidierungsfehler(
  fehler: TischValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
