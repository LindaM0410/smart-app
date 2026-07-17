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
    fehler.preisCent = "Der Preis muss als nicht negativer ganzer Centbetrag angegeben werden.";
  }

  return fehler;
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
