import assert from "node:assert/strict";
import test from "node:test";

import { validiereBestellposition } from "./bestellpositionen.ts";

test("akzeptiert ausschließlich positive ganzzahlige Mengen", () => {
  for (const menge of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.deepEqual(validiereBestellposition({ menge, sonderwunsch: "" }), {
      menge: "Bitte eine positive ganze Menge angeben.",
    });
  }
  assert.deepEqual(validiereBestellposition({ menge: 2, sonderwunsch: "ohne Käse" }), {});
});
