import assert from "node:assert/strict";
import test from "node:test";

import { berlinZeitpunkt, ermittleTischstatus, folgetag } from "./tischuebersicht.ts";

const referenzzeit = new Date("2026-07-20T17:00:00.000Z");

test("priorisiert eine offene reale Belegung", () => {
  assert.equal(ermittleTischstatus({
    hatOffeneBelegung: true,
    reservierungsbeginne: [new Date("2026-07-20T17:30:00.000Z")],
  }, referenzzeit), "belegt");
});

test("erkennt Reservierungsbeginn innerhalb der nächsten 60 Minuten einschließlich Grenzen", () => {
  for (const beginn of [referenzzeit, new Date("2026-07-20T18:00:00.000Z")]) {
    assert.equal(ermittleTischstatus({
      hatOffeneBelegung: false,
      reservierungsbeginne: [beginn],
    }, referenzzeit), "baldReserviert");
  }
});

test("meldet ohne offene Belegung oder baldige Reservierung frei", () => {
  assert.equal(ermittleTischstatus({
    hatOffeneBelegung: false,
    reservierungsbeginne: [
      new Date("2026-07-20T16:59:59.999Z"),
      new Date("2026-07-20T18:00:00.001Z"),
    ],
  }, referenzzeit), "frei");
});

test("bildet Berliner Sommer- und Winterzeit sowie den halb-offenen Folgetag ab", () => {
  assert.equal(berlinZeitpunkt("2026-07-20", "19:00")?.toISOString(), "2026-07-20T17:00:00.000Z");
  assert.equal(berlinZeitpunkt("2026-12-20", "19:00")?.toISOString(), "2026-12-20T18:00:00.000Z");
  assert.equal(berlinZeitpunkt("2026-03-29", "02:30"), null);
  assert.equal(folgetag("2026-12-31"), "2027-01-01");
});

