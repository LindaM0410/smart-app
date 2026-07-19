import assert from "node:assert/strict";
import test from "node:test";

import { berechneBruttobetragCent } from "./bestellbetrag.ts";

test("summiert mehrere Positionen einschließlich Mengen größer eins in Cent", () => {
  assert.equal(berechneBruttobetragCent([
    { menge: 2, einzelpreisCent: 1290, status: "offen" },
    { menge: 3, einzelpreisCent: 450, status: "serviert" },
  ]), 3930);
});

test("berücksichtigt alle nicht stornierten Positionsstatus", () => {
  assert.equal(berechneBruttobetragCent([
    { menge: 1, einzelpreisCent: 100, status: "offen" },
    { menge: 1, einzelpreisCent: 200, status: "inZubereitung" },
    { menge: 1, einzelpreisCent: 300, status: "serviert" },
  ]), 600);
});

test("schließt stornierte Positionen vollständig aus", () => {
  assert.equal(berechneBruttobetragCent([
    { menge: 2, einzelpreisCent: 1290, status: "storniert" },
    { menge: 1, einzelpreisCent: 590, status: "offen" },
  ]), 590);
});

test("liefert für eine leere Bestellung null Cent", () => {
  assert.equal(berechneBruttobetragCent([]), 0);
});

test("berechnet große Centbeträge innerhalb des sicheren Ganzzahlbereichs exakt", () => {
  assert.equal(berechneBruttobetragCent([
    { menge: 3, einzelpreisCent: 1_000_000_000_000, status: "serviert" },
    { menge: 2, einzelpreisCent: 2_000_000_000_000, status: "offen" },
  ]), 7_000_000_000_000);
});

test("weist unsichere Ganzzahlen und Überläufe zurück", () => {
  assert.throws(() => berechneBruttobetragCent([
    { menge: 1.5, einzelpreisCent: 100, status: "offen" },
  ]), RangeError);
  assert.throws(() => berechneBruttobetragCent([
    { menge: 2, einzelpreisCent: Number.MAX_SAFE_INTEGER, status: "offen" },
  ]), RangeError);
  assert.throws(() => berechneBruttobetragCent([
    { menge: 1, einzelpreisCent: Number.MAX_SAFE_INTEGER, status: "offen" },
    { menge: 1, einzelpreisCent: 1, status: "serviert" },
  ]), RangeError);
});
