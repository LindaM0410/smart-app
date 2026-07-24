import assert from "node:assert/strict";
import test from "node:test";

import {
  formatiereCateringDatum,
  hatCateringAuftragValidierungsfehler,
  parseCateringDatum,
  parsePreisCent,
  validiereCateringAuftrag,
  type CateringAuftragEingabe,
} from "./catering-auftraege.ts";

const gueltigerAuftrag: CateringAuftragEingabe = {
  firmenkundenkontaktId: "kontakt-1",
  lieferadresse: "Musterstraße 1, 10115 Berlin",
  datum: parseCateringDatum("2026-08-15"),
  uhrzeit: "18:30",
  personenanzahl: 25,
  menueBeschreibung: "Antipasti, Lasagne und Tiramisu",
  preisGesamtCent: parsePreisCent("1250,50"),
  notiz: "",
};

test("akzeptiert einen vollständigen Catering-Auftrag mit optional leerer Notiz", () => {
  assert.deepEqual(validiereCateringAuftrag(gueltigerAuftrag), {});
  assert.equal(hatCateringAuftragValidierungsfehler({}), false);
  assert.equal(gueltigerAuftrag.preisGesamtCent, 125050);
  assert.equal(formatiereCateringDatum(gueltigerAuftrag.datum), "2026-08-15");
});

test("verlangt Kontakt, Lieferadresse, Termin, Personenzahl, Menü und gültigen Preis", () => {
  const fehler = validiereCateringAuftrag({
    ...gueltigerAuftrag,
    firmenkundenkontaktId: "",
    lieferadresse: " ",
    datum: parseCateringDatum("2026-02-30"),
    uhrzeit: "24:00",
    personenanzahl: 1.5,
    menueBeschreibung: "",
    preisGesamtCent: parsePreisCent("12.50"),
  });

  assert.ok(fehler.firmenkundenkontaktId);
  assert.ok(fehler.lieferadresse);
  assert.ok(fehler.datum);
  assert.ok(fehler.uhrzeit);
  assert.ok(fehler.personenanzahl);
  assert.ok(fehler.menueBeschreibung);
  assert.ok(fehler.preisGesamtCent);
  assert.equal(hatCateringAuftragValidierungsfehler(fehler), true);
});

test("akzeptiert nur positive ganze Personenzahlen und nicht negative Centpreise", () => {
  assert.ok(
    validiereCateringAuftrag({
      ...gueltigerAuftrag,
      personenanzahl: 0,
    }).personenanzahl,
  );
  assert.ok(
    validiereCateringAuftrag({
      ...gueltigerAuftrag,
      preisGesamtCent: -1,
    }).preisGesamtCent,
  );
  assert.deepEqual(
    validiereCateringAuftrag({
      ...gueltigerAuftrag,
      preisGesamtCent: 0,
    }),
    {},
  );
});

test("weist kalendarisch ungültige Datumswerte ohne Ausnahme ab", () => {
  for (const wert of ["2026-02-30", "2026-13-01", "kein-datum"]) {
    assert.equal(Number.isNaN(parseCateringDatum(wert).getTime()), true);
  }
});
