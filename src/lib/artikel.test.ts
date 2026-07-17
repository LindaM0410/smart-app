import assert from "node:assert/strict";
import test from "node:test";

import { formatierePreis, formatierePreiseingabe, parsePreisCent, validiereArtikel } from "./artikel.ts";

test("validiert Artikelnamen und ganze nicht negative Centbeträge", () => {
  assert.deepEqual(
    validiereArtikel({ name: "", kategorie: "", preisCent: 10.5, benoetigtGrill: false, aktiv: true }),
    {
      name: "Bitte einen Artikelnamen angeben.",
      kategorie: "Bitte eine Kategorie angeben.",
      preisCent: "Bitte einen nicht negativen Preis mit höchstens zwei Nachkommastellen angeben (z. B. 12,50).",
    },
  );
  assert.deepEqual(
    validiereArtikel({ name: "Pizza", kategorie: "Hauptgericht", preisCent: 1290, benoetigtGrill: false, aktiv: true }),
    {},
  );
  assert.match(formatierePreis(1290), /12,90/);
});

test("wandelt deutsche Euro-und-Cent-Eingaben ohne Fließkommarechnung in Cent um", () => {
  assert.equal(parsePreisCent("12,50"), 1250);
  assert.equal(parsePreisCent("12,5"), 1250);
  assert.equal(parsePreisCent("12"), 1200);
  assert.equal(parsePreisCent(" 0,09 "), 9);
  assert.equal(formatierePreiseingabe(9), "0,09");
  assert.equal(formatierePreiseingabe(1250), "12,50");
});

test("weist leere, negative und ungenaue Preiseingaben ab", () => {
  for (const wert of ["", "-1,00", "1,234", "1.50", ",50", "abc"]) {
    assert.equal(Number.isNaN(parsePreisCent(wert)), true, wert);
  }
});
