import assert from "node:assert/strict";
import test from "node:test";

import {
  hatTischValidierungsfehler,
  tischbereiche,
  validiereTisch,
  type TischEingabe,
} from "./tische.ts";

const gueltigerTisch: TischEingabe = {
  standortId: "standort-kreuzberg",
  nummer: "K-01",
  kapazitaet: 4,
  bereich: "innen",
  kombinierbar: true,
  aktiv: true,
};

test("akzeptiert einen vollständig angegebenen Tisch", () => {
  assert.deepEqual(validiereTisch(gueltigerTisch), {});
  assert.deepEqual(tischbereiche, ["innen", "außen", "fenster", "bar"]);
});

test("verlangt Standort und Tischnummer", () => {
  const fehler = validiereTisch({
    ...gueltigerTisch,
    standortId: " ",
    nummer: "",
  });

  assert.equal(fehler.standortId, "Bitte einen Standort auswählen.");
  assert.equal(fehler.nummer, "Bitte eine Tischnummer angeben.");
  assert.equal(hatTischValidierungsfehler(fehler), true);
});

test("verlangt eine positive ganze Kapazität", () => {
  for (const kapazitaet of [0, -1, 1.5, Number.NaN]) {
    assert.equal(
      validiereTisch({ ...gueltigerTisch, kapazitaet }).kapazitaet,
      "Die Kapazität muss eine positive ganze Zahl sein.",
    );
  }
});

test("akzeptiert nur die vorgesehenen Bereiche", () => {
  assert.equal(
    validiereTisch({ ...gueltigerTisch, bereich: "terrasse" }).bereich,
    "Bitte einen gültigen Bereich auswählen.",
  );
});
