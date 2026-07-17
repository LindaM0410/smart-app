export const MITARBEITER_ROLLEN = [
  "inhaber",
  "manager",
  "bedienung",
  "kueche",
] as const;

export type MitarbeiterRolle = (typeof MITARBEITER_ROLLEN)[number];

export type MitarbeiterEingabe = {
  name: string;
  benutzername: string;
  rolle: string;
  hauptstandortId: string;
  aktiv: boolean;
};

export type MitarbeiterValidierungsfehler = Partial<
  Record<"name" | "benutzername" | "rolle" | "hauptstandortId", string>
>;

export function istMitarbeiterRolle(rolle: string): rolle is MitarbeiterRolle {
  return MITARBEITER_ROLLEN.includes(rolle as MitarbeiterRolle);
}

export function validiereMitarbeiter(
  eingabe: MitarbeiterEingabe,
): MitarbeiterValidierungsfehler {
  const fehler: MitarbeiterValidierungsfehler = {};

  if (eingabe.name.trim().length === 0) {
    fehler.name = "Bitte einen Namen angeben.";
  }
  if (eingabe.benutzername.trim().length === 0) {
    fehler.benutzername = "Bitte einen Benutzernamen angeben.";
  }
  if (!istMitarbeiterRolle(eingabe.rolle)) {
    fehler.rolle = "Bitte eine gültige Rolle auswählen.";
  }
  if (eingabe.hauptstandortId.trim().length === 0) {
    fehler.hauptstandortId = "Bitte einen Hauptstandort auswählen.";
  }

  return fehler;
}

export function hatMitarbeiterValidierungsfehler(
  fehler: MitarbeiterValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
