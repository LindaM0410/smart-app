import assert from "node:assert/strict";
import test from "node:test";

import {
  FAEHIGKEITEN,
  ZugriffVerweigertFehler,
  faehigkeitFuerPfad,
  hatFaehigkeit,
  pruefeFaehigkeit,
  sitzungsAkteurId,
} from "./berechtigungen.ts";

test("Inhaber und Manager dürfen Stammdaten und operative Abläufe nutzen", () => {
  for (const rolle of ["inhaber", "manager"]) {
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.stammdatenPflegen), true);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.operativeAblaeufeNutzen), true);
  }
});

test("manipulierte Mitarbeiterwerte ersetzen niemals den Sitzungsakteur", () => {
  assert.equal(sitzungsAkteurId({ id: "sitzungs-id" }, "fremde-id"), "sitzungs-id");
  assert.equal(sitzungsAkteurId({ id: "sitzungs-id" }, { rolle: "inhaber" }), "sitzungs-id");
});

test("Bedienung darf nur operative Abläufe nutzen", () => {
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.stammdatenPflegen), false);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.operativeAblaeufeNutzen), true);
});

test("Küche und unbekannte Rollen erhalten standardmäßig keine Fähigkeit", () => {
  for (const rolle of ["kueche", "admin", "", "INHABER"]) {
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.stammdatenPflegen), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.operativeAblaeufeNutzen), false);
  }
});

test("direkte Seitenpfade sind der passenden Fähigkeit zugeordnet", () => {
  for (const pfad of ["/standorte", "/tische", "/mitarbeiter", "/speisekarte", "/artikelangebot?standortId=1"]) {
    assert.equal(faehigkeitFuerPfad(pfad), FAEHIGKEITEN.stammdatenPflegen);
  }
  for (const pfad of ["/gaeste", "/reservierungen/", "/tischuebersicht", "/walk-ins", "/belegungen", "/bestellungen"]) {
    assert.equal(faehigkeitFuerPfad(pfad), FAEHIGKEITEN.operativeAblaeufeNutzen);
  }
  assert.equal(faehigkeitFuerPfad("/"), null);
  assert.equal(faehigkeitFuerPfad("/abmeldung"), null);
});

test("dieselbe Prüfung lehnt gesperrte Serveroperationen ab", () => {
  assert.doesNotThrow(() => pruefeFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.operativeAblaeufeNutzen));
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.stammdatenPflegen),
    ZugriffVerweigertFehler,
  );
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.operativeAblaeufeNutzen),
    ZugriffVerweigertFehler,
  );
  assert.throws(() => pruefeFaehigkeit(null, FAEHIGKEITEN.stammdatenPflegen), ZugriffVerweigertFehler);
});
