import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  erstelleRechnung,
  markiereRechnungAlsBezahlt,
  RechnungNichtMoeglichFehler,
  RechnungZahlungNichtMoeglichFehler,
} from "./rechnung-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-rechnung-"));
  const datenbankpfad = path.join(verzeichnis, "test.db");
  execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: `file:${datenbankpfad}` }, stdio: "ignore",
  });
  const datenbank = new PrismaClient({ datasourceUrl: `file:${datenbankpfad}` });
  t.after(async () => {
    await datenbank.$disconnect();
    await rm(verzeichnis, { recursive: true, force: true });
  });

  await datenbank.standort.create({ data: {
    id: "standort", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true,
  } });
  await datenbank.tisch.create({ data: {
    id: "tisch", standortId: "standort", nummer: "K-1", kapazitaet: 4, bereich: "innen",
  } });
  await datenbank.mitarbeiter.createMany({ data: [
    { id: "bedienung", name: "Bedienung", benutzername: "bedienung", rolle: "bedienung", hauptstandortId: "standort" },
    { id: "manager", name: "Manager", benutzername: "manager", rolle: "manager", hauptstandortId: "standort" },
  ] });
  await datenbank.artikel.create({ data: {
    id: "pasta", name: "Pasta", kategorie: "Hauptgericht", preisCent: 1290,
  } });
  await datenbank.artikel.create({ data: {
    id: "gruss", name: "Gruß aus der Küche", kategorie: "Hauptgericht", preisCent: 0,
  } });
  await datenbank.artikelStandort.createMany({ data: [
    { artikelId: "pasta", standortId: "standort" },
    { artikelId: "gruss", standortId: "standort" },
  ] });

  for (const id of ["mit-positionen", "kostenlos", "leer", "nur-storniert"]) {
    await datenbank.bestellung.create({ data: {
      id, standortId: "standort", tischId: "tisch", aufgenommenVonMitarbeiterId: "bedienung",
    } });
  }
  await datenbank.bestellposition.createMany({ data: [
    { id: "offen", bestellungId: "mit-positionen", artikelId: "pasta", menge: 2, einzelpreisCent: 1290, sonderwunsch: "" },
    { id: "spaeter-storniert", bestellungId: "mit-positionen", artikelId: "pasta", menge: 4, einzelpreisCent: 1290, sonderwunsch: "" },
    { id: "einzig-storniert", bestellungId: "nur-storniert", artikelId: "pasta", menge: 1, einzelpreisCent: 1290, sonderwunsch: "" },
    { id: "kostenlose-position", bestellungId: "kostenlos", artikelId: "gruss", menge: 1, einzelpreisCent: 0, sonderwunsch: "" },
  ] });
  for (const id of ["spaeter-storniert", "einzig-storniert"]) {
    await datenbank.bestellposition.update({
      where: { id },
      data: { status: "storniert", storniertAm: new Date(), storniertVonMitarbeiterId: "manager" },
    });
  }
  return datenbank;
}

test("erzeugt eine offene Rechnung mit Bruttobetrag-Snapshot aus BV-033", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");

  assert.equal(rechnung.bestellungId, "mit-positionen");
  assert.equal(rechnung.bruttobetragCent, 2580);
  assert.equal(rechnung.status, "offen");
  assert.ok(rechnung.erstelltAm instanceof Date);

  await datenbank.bestellposition.update({ where: { id: "offen" }, data: { menge: 3 } });
  const snapshot = await datenbank.rechnung.findUniqueOrThrow({ where: { bestellungId: "mit-positionen" } });
  assert.equal(snapshot.bruttobetragCent, 2580);
});

test("weist leere Bestellungen und Bestellungen mit ausschließlich stornierten Positionen zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(erstelleRechnung(datenbank, "leer"), RechnungNichtMoeglichFehler);
  await assert.rejects(erstelleRechnung(datenbank, "nur-storniert"), RechnungNichtMoeglichFehler);
  await assert.rejects(erstelleRechnung(datenbank, "unbekannt"), RechnungNichtMoeglichFehler);
  assert.equal(await datenbank.rechnung.count(), 0);
});

test("erlaubt eine berechenbare Position mit einem Bruttobetrag von null Cent", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const rechnung = await erstelleRechnung(datenbank, "kostenlos");
  assert.equal(rechnung.bruttobetragCent, 0);
});

test("erlaubt höchstens eine Rechnung pro Bestellung", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await erstelleRechnung(datenbank, "mit-positionen");
  await assert.rejects(erstelleRechnung(datenbank, "mit-positionen"), RechnungNichtMoeglichFehler);
  assert.equal(await datenbank.rechnung.count(), 1);
});

test("Datenbank lehnt manipulierte Beträge und Status ab und bewahrt den Snapshot", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(datenbank.rechnung.create({ data: {
    bestellungId: "mit-positionen", bruttobetragCent: 1, status: "offen",
  } }));
  await assert.rejects(datenbank.rechnung.create({ data: {
    bestellungId: "mit-positionen", bruttobetragCent: 2580, status: "bezahlt",
  } }));

  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");
  await assert.rejects(datenbank.rechnung.update({
    where: { id: rechnung.id }, data: { bruttobetragCent: 1 },
  }));
});

test("markiert eine offene Rechnung mit Zahlungsart und serverseitigem Zeitpunkt als bezahlt", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");
  const bezahltAm = new Date("2026-07-23T18:30:00.000Z");

  const bezahlt = await markiereRechnungAlsBezahlt(datenbank, rechnung.id, "bar", bezahltAm);

  assert.equal(bezahlt.status, "bezahlt");
  assert.equal(bezahlt.zahlungsart, "bar");
  assert.deepEqual(bezahlt.bezahltAm, bezahltAm);
  assert.equal(bezahlt.bruttobetragCent, 2580);
});

test("akzeptiert ausschließlich bar oder karte als Zahlungsart", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");

  await assert.rejects(
    markiereRechnungAlsBezahlt(datenbank, rechnung.id, "ueberweisung" as "bar"),
    RechnungZahlungNichtMoeglichFehler,
  );
  const unveraendert = await datenbank.rechnung.findUniqueOrThrow({ where: { id: rechnung.id } });
  assert.equal(unveraendert.status, "offen");
  assert.equal(unveraendert.zahlungsart, null);
  assert.equal(unveraendert.bezahltAm, null);
});

test("eine bezahlte Rechnung kann nicht erneut bezahlt werden", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");
  await markiereRechnungAlsBezahlt(datenbank, rechnung.id, "karte");

  await assert.rejects(
    markiereRechnungAlsBezahlt(datenbank, rechnung.id, "bar"),
    RechnungZahlungNichtMoeglichFehler,
  );
  const bezahlt = await datenbank.rechnung.findUniqueOrThrow({ where: { id: rechnung.id } });
  assert.equal(bezahlt.status, "bezahlt");
  assert.equal(bezahlt.zahlungsart, "karte");
});

test("Datenbank sperrt vorbefüllte und manipulierte Zahlungsdaten", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(datenbank.rechnung.create({ data: {
    bestellungId: "mit-positionen",
    bruttobetragCent: 2580,
    status: "offen",
    zahlungsart: "bar",
    bezahltAm: new Date(),
  } }));

  const rechnung = await erstelleRechnung(datenbank, "mit-positionen");
  await assert.rejects(datenbank.rechnung.update({
    where: { id: rechnung.id },
    data: { status: "bezahlt", zahlungsart: "ueberweisung", bezahltAm: new Date() },
  }));
  await assert.rejects(datenbank.rechnung.update({
    where: { id: rechnung.id },
    data: { status: "bezahlt", zahlungsart: "bar", bezahltAm: new Date(), bruttobetragCent: 1 },
  }));
});
