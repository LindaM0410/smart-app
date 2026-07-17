export type ArtikelEingabe = {
  name: string;
  kategorie: string;
  preisCent: number;
  benoetigtGrill: boolean;
  aktiv: boolean;
};

export type ArtikelValidierungsfehler = Partial<Record<"name" | "kategorie" | "preisCent" | "standortIds", string>>;

export function validiereArtikel(eingabe: ArtikelEingabe): ArtikelValidierungsfehler {
  const fehler: ArtikelValidierungsfehler = {};

  if (eingabe.name.trim().length === 0) {
    fehler.name = "Bitte einen Artikelnamen angeben.";
  }
  if (eingabe.kategorie.trim().length === 0) {
    fehler.kategorie = "Bitte eine Kategorie angeben.";
  }
  if (!Number.isSafeInteger(eingabe.preisCent) || eingabe.preisCent < 0) {
    fehler.preisCent = "Bitte einen nicht negativen Preis mit höchstens zwei Nachkommastellen angeben (z. B. 12,50).";
  }

  return fehler;
}

export function parsePreisCent(wert: string): number {
  const normalisiert = wert.trim();
  if (!/^\d+(?:,\d{1,2})?$/.test(normalisiert)) {
    return Number.NaN;
  }

  const [euro, cent = ""] = normalisiert.split(",");
  const preisCent = Number(euro) * 100 + Number(cent.padEnd(2, "0"));
  return Number.isSafeInteger(preisCent) ? preisCent : Number.NaN;
}

export function formatierePreiseingabe(preisCent: number) {
  const euro = Math.floor(preisCent / 100);
  const cent = String(preisCent % 100).padStart(2, "0");
  return `${euro},${cent}`;
}

export function hatArtikelValidierungsfehler(fehler: ArtikelValidierungsfehler) {
  return Object.keys(fehler).length > 0;
}

export function formatierePreis(preisCent: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(preisCent / 100);
}
