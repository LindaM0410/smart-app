import assert from "node:assert/strict";
import test from "node:test";

import {
  hatMitarbeiterValidierungsfehler,
  MITARBEITER_ROLLEN,
  validiereMitarbeiter,
  type MitarbeiterEingabe,
} from "./mitarbeiter.ts";

const gueltigerMitarbeiter: MitarbeiterEingabe = {
  name: "Giulia Rossi",
  benutzername: "giulia.rossi",
  rolle: "bedienung",
  hauptstandortId: "standort-1",
  aktiv: true,
};

test("akzeptiert alle vier definierten Rollen", () => {
  for (const rolle of MITARBEITER_ROLLEN) {
    assert.deepEqual(validiereMitarbeiter({ ...gueltigerMitarbeiter, rolle }), {});
  }
  assert.equal(hatMitarbeiterValidierungsfehler({}), false);
});

test("verlangt Name, Benutzername und Hauptstandort", () => {
  const fehler = validiereMitarbeiter({
    ...gueltigerMitarbeiter,
    name: " ",
    benutzername: " ",
    hauptstandortId: " ",
  });

  assert.equal(fehler.name, "Bitte einen Namen angeben.");
  assert.equal(fehler.benutzername, "Bitte einen Benutzernamen angeben.");
  assert.equal(fehler.hauptstandortId, "Bitte einen Hauptstandort auswählen.");
  assert.equal(hatMitarbeiterValidierungsfehler(fehler), true);
});

test("weist unbekannte Rollen ab", () => {
  assert.equal(
    validiereMitarbeiter({ ...gueltigerMitarbeiter, rolle: "admin" }).rolle,
    "Bitte eine gültige Rolle auswählen.",
  );
});

test("erlaubt die Deaktivierung", () => {
  assert.deepEqual(validiereMitarbeiter({ ...gueltigerMitarbeiter, aktiv: false }), {});
});
