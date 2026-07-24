import assert from "node:assert/strict";
import test from "node:test";

import {
  hatFirmenkundenkontaktValidierungsfehler,
  validiereFirmenkundenkontakt,
  type FirmenkundenkontaktEingabe,
} from "./firmenkundenkontakte.ts";

const gueltigerKontakt: FirmenkundenkontaktEingabe = {
  firmenname: "Muster GmbH",
  ansprechperson: "Ada Beispiel",
  kontaktdaten: "ada@example.de · 030 123456",
  notiz: "Erreichbar vormittags",
  aktiv: true,
};

test("akzeptiert einen vollständigen Firmenkundenkontakt", () => {
  assert.deepEqual(validiereFirmenkundenkontakt(gueltigerKontakt), {});
  assert.equal(hatFirmenkundenkontaktValidierungsfehler({}), false);
});

test("verlangt Firma, Ansprechperson und Kontaktdaten", () => {
  const fehler = validiereFirmenkundenkontakt({
    ...gueltigerKontakt,
    firmenname: " ",
    ansprechperson: "",
    kontaktdaten: "\t",
  });

  assert.equal(fehler.firmenname, "Bitte einen Firmennamen angeben.");
  assert.equal(fehler.ansprechperson, "Bitte eine Ansprechperson angeben.");
  assert.equal(fehler.kontaktdaten, "Bitte Kontaktdaten angeben.");
  assert.equal(hatFirmenkundenkontaktValidierungsfehler(fehler), true);
});

test("akzeptiert eine leere Notiz und einen inaktiven Kontakt", () => {
  assert.deepEqual(
    validiereFirmenkundenkontakt({ ...gueltigerKontakt, notiz: "", aktiv: false }),
    {},
  );
});
