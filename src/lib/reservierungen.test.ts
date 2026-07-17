import assert from "node:assert/strict";
import test from "node:test";

import {
  hatReservierungValidierungsfehler,
  normalisiereReservierung,
  validiereReservierung,
  type ReservierungEingabe,
} from "./reservierungen.ts";

const gueltigeReservierung: ReservierungEingabe = {
  gastId: "gast-1",
  standortId: "standort-1",
  beginn: new Date("2026-07-20T17:00:00.000Z"),
  personenanzahl: 4,
  status: "angefragt",
  notiz: "Fensterplatz",
  erstelltVonMitarbeiterId: "mitarbeiter-1",
  tischIds: [],
};

test("setzt ohne Endzeit zwei Stunden Planungsdauer", () => {
  const normalisiert = normalisiereReservierung(gueltigeReservierung);

  assert.equal(normalisiert.ende.toISOString(), "2026-07-20T19:00:00.000Z");
  assert.equal(normalisiert.istGruppe, false);
  assert.deepEqual(validiereReservierung(gueltigeReservierung), {});
  assert.equal(hatReservierungValidierungsfehler({}), false);
});

test("übernimmt ein explizites gültiges Ende", () => {
  const ende = new Date("2026-07-20T20:30:00.000Z");
  assert.equal(normalisiereReservierung({ ...gueltigeReservierung, ende }).ende, ende);
});

test("setzt das Gruppenkennzeichen ab acht Personen serverseitig", () => {
  assert.equal(
    normalisiereReservierung({ ...gueltigeReservierung, personenanzahl: 8 }).istGruppe,
    true,
  );
});

test("weist ungültige Pflichtangaben, Zeiträume, Personenzahlen und Status zurück", () => {
  const fehler = validiereReservierung({
    ...gueltigeReservierung,
    gastId: " ",
    standortId: "",
    ende: new Date("2026-07-20T16:59:00.000Z"),
    personenanzahl: 1.5,
    status: "unbekannt",
    erstelltVonMitarbeiterId: " ",
  });

  assert.deepEqual(Object.keys(fehler).sort(), [
    "ende",
    "erstelltVonMitarbeiterId",
    "gastId",
    "personenanzahl",
    "standortId",
    "status",
  ]);
  assert.equal(hatReservierungValidierungsfehler(fehler), true);
});

test("weist ungültige Datumswerte zurück", () => {
  const fehler = validiereReservierung({
    ...gueltigeReservierung,
    beginn: new Date(Number.NaN),
    ende: new Date(Number.NaN),
  });

  assert.ok(fehler.beginn);
  assert.ok(fehler.ende);
});

test("weist doppelte Tischzuordnungen zurück", () => {
  const fehler = validiereReservierung({
    ...gueltigeReservierung,
    tischIds: ["tisch-1", "tisch-1"],
  });

  assert.equal(fehler.tischIds, "Jeder Tisch darf nur einmal zugeordnet werden.");
});
