export type GastEingabe = {
  name: string;
  telefon: string;
  notiz: string;
  istStammgast: boolean;
  hatBellaCard: boolean;
  besuchsanzahl: number;
  aktiv: boolean;
};

export type GastValidierungsfehler = Partial<
  Record<"name" | "besuchsanzahl", string>
>;

export function validiereGast(eingabe: GastEingabe): GastValidierungsfehler {
  const fehler: GastValidierungsfehler = {};

  if (eingabe.name.trim().length === 0) {
    fehler.name = "Bitte einen Namen angeben.";
  }

  if (!Number.isInteger(eingabe.besuchsanzahl) || eingabe.besuchsanzahl < 0) {
    fehler.besuchsanzahl =
      "Die Besuchsanzahl muss eine nicht negative ganze Zahl sein.";
  }

  return fehler;
}

export function hatGastValidierungsfehler(
  fehler: GastValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
