import assert from "node:assert/strict";
import test from "node:test";

import {
  normalisiereTischIds,
  tischKombinationsSchluessel,
  validiereTischKombination,
} from "./tischkombinationen.ts";

test("normalisiert Tisch-IDs unabhängig von Reihenfolge und Duplikaten", () => {
  assert.deepEqual(normalisiereTischIds([" tisch-b ", "tisch-a", "tisch-b", ""]), [
    "tisch-a",
    "tisch-b",
  ]);
  assert.equal(
    tischKombinationsSchluessel(["tisch-b", "tisch-a"]),
    tischKombinationsSchluessel(["tisch-a", "tisch-b"]),
  );
});

test("verlangt Standort und mindestens zwei unterschiedliche Tische", () => {
  assert.deepEqual(validiereTischKombination({ standortId: "", tischIds: ["eins"] }), {
    standortId: "Bitte einen Standort auswählen.",
    tischIds: "Bitte mindestens zwei unterschiedliche Tische auswählen.",
  });
  assert.deepEqual(
    validiereTischKombination({ standortId: "standort", tischIds: ["eins", "zwei"] }),
    {},
  );
});
