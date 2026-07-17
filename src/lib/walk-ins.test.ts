import assert from "node:assert/strict";
import test from "node:test";

import { validiereWalkIn } from "./walk-ins.ts";

test("akzeptiert vollständige Walk-in-Angaben", () => {
  assert.deepEqual(validiereWalkIn({
    gastId: "gast-1", standortId: "standort-1", tischId: "tisch-1", personenanzahl: 4, notiz: "",
  }), {});
});

test("verlangt Referenzen und eine positive ganze Personenzahl", () => {
  const fehler = validiereWalkIn({
    gastId: "", standortId: "", tischId: "", personenanzahl: 1.5, notiz: "",
  });
  assert.deepEqual(Object.keys(fehler).sort(), ["gastId", "personenanzahl", "standortId", "tischId"]);
});
