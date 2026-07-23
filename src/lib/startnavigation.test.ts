import assert from "node:assert/strict";
import test from "node:test";

import { gewaehlterArbeitsbereich } from "./startnavigation.ts";

test("öffnet einen erlaubten Arbeitsbereich", () => {
  assert.equal(
    gewaehlterArbeitsbereich("alltag", ["administratives", "alltag", "abrechnung", "kueche"]),
    "alltag",
  );
});

test("öffnet keinen für die Rolle unerlaubten Arbeitsbereich", () => {
  assert.equal(gewaehlterArbeitsbereich("administratives", ["alltag", "abrechnung"]), undefined);
});

test("bleibt bei fehlendem oder unbekanntem Bereich in der Bereichsauswahl", () => {
  assert.equal(gewaehlterArbeitsbereich(undefined, ["kueche"]), undefined);
  assert.equal(gewaehlterArbeitsbereich("unbekannt", ["kueche"]), undefined);
});
