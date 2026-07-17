export type TischKombinationEingabe = {
  standortId: string;
  tischIds: string[];
};

export type TischKombinationValidierungsfehler = Partial<
  Record<"standortId" | "tischIds", string>
>;

export function normalisiereTischIds(tischIds: string[]): string[] {
  return [...new Set(tischIds.map((id) => id.trim()).filter(Boolean))].sort();
}

export function validiereTischKombination(
  eingabe: TischKombinationEingabe,
): TischKombinationValidierungsfehler {
  const fehler: TischKombinationValidierungsfehler = {};

  if (eingabe.standortId.trim().length === 0) {
    fehler.standortId = "Bitte einen Standort auswählen.";
  }

  if (normalisiereTischIds(eingabe.tischIds).length < 2) {
    fehler.tischIds = "Bitte mindestens zwei unterschiedliche Tische auswählen.";
  }

  return fehler;
}

export function tischKombinationsSchluessel(tischIds: string[]): string {
  return normalisiereTischIds(tischIds).join("|");
}
