export type StandortEingabe = {
  name: string;
  adresse: string;
  sitzplaetze: number;
  hatTerrasse: boolean;
  hatGrill: boolean;
  aktiv: boolean;
};

export type StandortValidierungsfehler = Partial<
  Record<"name" | "adresse" | "sitzplaetze", string>
>;

export function validiereStandort(
  eingabe: StandortEingabe,
): StandortValidierungsfehler {
  const fehler: StandortValidierungsfehler = {};

  if (eingabe.name.trim().length === 0) {
    fehler.name = "Bitte einen Namen angeben.";
  }

  if (eingabe.adresse.trim().length === 0) {
    fehler.adresse = "Bitte eine Adresse angeben.";
  }

  if (!Number.isInteger(eingabe.sitzplaetze) || eingabe.sitzplaetze <= 0) {
    fehler.sitzplaetze = "Die Sitzplatzanzahl muss eine positive ganze Zahl sein.";
  }

  return fehler;
}

export function hatValidierungsfehler(
  fehler: StandortValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
