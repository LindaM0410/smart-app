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
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.kuechenstatusPflegen), true);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.bestellpositionStornieren), true);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.rechnungErzeugen), true);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.rechnungBezahlen), true);
  }
});

test("manipulierte Mitarbeiterwerte ersetzen niemals den Sitzungsakteur", () => {
  assert.equal(sitzungsAkteurId({ id: "sitzungs-id" }, "fremde-id"), "sitzungs-id");
  assert.equal(sitzungsAkteurId({ id: "sitzungs-id" }, { rolle: "inhaber" }), "sitzungs-id");
});

test("Bedienung darf nur operative Abläufe und nicht die Küchenansicht nutzen", () => {
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.stammdatenPflegen), false);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.operativeAblaeufeNutzen), true);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.kuechenstatusPflegen), false);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.bestellpositionStornieren), false);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.rechnungErzeugen), true);
  assert.equal(hatFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.rechnungBezahlen), true);
});

test("Küche erhält ausschließlich die Küchenfähigkeit", () => {
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.stammdatenPflegen), false);
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.operativeAblaeufeNutzen), false);
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.kuechenstatusPflegen), true);
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.bestellpositionStornieren), false);
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.rechnungErzeugen), false);
  assert.equal(hatFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.rechnungBezahlen), false);
});

test("unbekannte Rollen erhalten standardmäßig keine Fähigkeit", () => {
  for (const rolle of ["admin", "", "INHABER"]) {
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.stammdatenPflegen), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.operativeAblaeufeNutzen), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.kuechenstatusPflegen), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.bestellpositionStornieren), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.rechnungErzeugen), false);
    assert.equal(hatFaehigkeit({ rolle }, FAEHIGKEITEN.rechnungBezahlen), false);
  }
});

test("direkte Seitenpfade sind der passenden Fähigkeit zugeordnet", () => {
  for (const pfad of ["/standorte", "/tische", "/mitarbeiter", "/speisekarte", "/artikelangebot?standortId=1"]) {
    assert.equal(faehigkeitFuerPfad(pfad), FAEHIGKEITEN.stammdatenPflegen);
  }
  for (const pfad of ["/gaeste", "/reservierungen/", "/tischuebersicht", "/walk-ins", "/belegungen", "/bestellungen"]) {
    assert.equal(faehigkeitFuerPfad(pfad), FAEHIGKEITEN.operativeAblaeufeNutzen);
  }
  assert.equal(faehigkeitFuerPfad("/kueche"), FAEHIGKEITEN.kuechenstatusPflegen);
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
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.kuechenstatusPflegen),
    ZugriffVerweigertFehler,
  );
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "bedienung" }, FAEHIGKEITEN.bestellpositionStornieren),
    ZugriffVerweigertFehler,
  );
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.bestellpositionStornieren),
    ZugriffVerweigertFehler,
  );
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.rechnungErzeugen),
    ZugriffVerweigertFehler,
  );
  assert.throws(
    () => pruefeFaehigkeit({ rolle: "kueche" }, FAEHIGKEITEN.rechnungBezahlen),
    ZugriffVerweigertFehler,
  );
  assert.throws(() => pruefeFaehigkeit(null, FAEHIGKEITEN.stammdatenPflegen), ZugriffVerweigertFehler);
});
