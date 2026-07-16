import assert from "node:assert/strict";
import test from "node:test";

import {
  hatValidierungsfehler,
  validiereStandort,
  type StandortEingabe,
} from "./standorte.ts";

const gueltigerStandort: StandortEingabe = {
  name: "Kreuzberg",
  adresse: "Musterstraße 1, 10999 Berlin",
  sitzplaetze: 80,
  hatTerrasse: true,
  hatGrill: true,
  aktiv: true,
};

test("akzeptiert einen vollständig angegebenen Standort", () => {
  assert.deepEqual(validiereStandort(gueltigerStandort), {});
});

test("verlangt Name und Adresse", () => {
  const fehler = validiereStandort({
    ...gueltigerStandort,
    name: "   ",
    adresse: "",
  });

  assert.equal(fehler.name, "Bitte einen Namen angeben.");
  assert.equal(fehler.adresse, "Bitte eine Adresse angeben.");
  assert.equal(hatValidierungsfehler(fehler), true);
});

test("verlangt eine positive ganze Sitzplatzanzahl", () => {
  for (const sitzplaetze of [0, -1, 1.5, Number.NaN]) {
    const fehler = validiereStandort({ ...gueltigerStandort, sitzplaetze });
    assert.equal(
      fehler.sitzplaetze,
      "Die Sitzplatzanzahl muss eine positive ganze Zahl sein.",
    );
  }
});
