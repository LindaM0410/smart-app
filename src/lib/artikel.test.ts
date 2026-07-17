import assert from "node:assert/strict";
import test from "node:test";

import { formatierePreis, validiereArtikel } from "./artikel.ts";

test("validiert Artikelnamen und ganze nicht negative Centbeträge", () => {
  assert.deepEqual(
    validiereArtikel({ name: "", kategorie: "", preisCent: 10.5, benoetigtGrill: false, aktiv: true }),
    {
      name: "Bitte einen Artikelnamen angeben.",
      kategorie: "Bitte eine Kategorie angeben.",
      preisCent: "Der Preis muss als nicht negativer ganzer Centbetrag angegeben werden.",
    },
  );
  assert.deepEqual(
    validiereArtikel({ name: "Pizza", kategorie: "Hauptgericht", preisCent: 1290, benoetigtGrill: false, aktiv: true }),
    {},
  );
  assert.match(formatierePreis(1290), /12,90/);
});
