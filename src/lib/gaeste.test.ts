import assert from "node:assert/strict";
import test from "node:test";

import {
  hatGastValidierungsfehler,
  validiereGast,
  type GastEingabe,
} from "./gaeste.ts";

const gueltigerGast: GastEingabe = {
  name: "Giulia Rossi",
  telefon: "030 1234567",
  notiz: "Fensterplatz bevorzugt",
  istStammgast: true,
  hatBellaCard: true,
  besuchsanzahl: 12,
  aktiv: true,
};

test("akzeptiert einen vollständig angegebenen Gast", () => {
  assert.deepEqual(validiereGast(gueltigerGast), {});
  assert.equal(hatGastValidierungsfehler({}), false);
});

test("verlangt einen Namen", () => {
  const fehler = validiereGast({ ...gueltigerGast, name: " " });

  assert.equal(fehler.name, "Bitte einen Namen angeben.");
  assert.equal(hatGastValidierungsfehler(fehler), true);
});

test("verlangt eine nicht negative ganze Besuchsanzahl", () => {
  for (const besuchsanzahl of [-1, 1.5, Number.NaN]) {
    assert.equal(
      validiereGast({ ...gueltigerGast, besuchsanzahl }).besuchsanzahl,
      "Die Besuchsanzahl muss eine nicht negative ganze Zahl sein.",
    );
  }

  assert.equal(validiereGast({ ...gueltigerGast, besuchsanzahl: 0 }).besuchsanzahl, undefined);
});

test("akzeptiert optionale leere Kontaktdaten und alle Statuskombinationen", () => {
  assert.deepEqual(
    validiereGast({
      ...gueltigerGast,
      telefon: "",
      notiz: "",
      istStammgast: false,
      hatBellaCard: false,
      aktiv: false,
    }),
    {},
  );
});
