import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereBestellposition,
  BestellpositionReferenzfehler,
  BestellpositionValidierungsfehler,
  erstelleBestellposition,
} from "./bestellposition-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-bestellpositionen-"));
  const datenbankpfad = path.join(verzeichnis, "test.db");
  execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: `file:${datenbankpfad}` }, stdio: "ignore",
  });
  const datenbank = new PrismaClient({ datasourceUrl: `file:${datenbankpfad}` });
  t.after(async () => {
    await datenbank.$disconnect();
    await rm(verzeichnis, { recursive: true, force: true });
  });

  await datenbank.standort.createMany({ data: [
    { id: "kreuzberg", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true },
    { id: "spandau", name: "Spandau", adresse: "Test", sitzplaetze: 50, hatTerrasse: false, hatGrill: false },
  ] });
  await datenbank.tisch.createMany({ data: [
    { id: "tisch-k", standortId: "kreuzberg", nummer: "K-1", kapazitaet: 4, bereich: "innen" },
    { id: "tisch-s", standortId: "spandau", nummer: "S-1", kapazitaet: 4, bereich: "innen" },
  ] });
  await datenbank.mitarbeiter.createMany({ data: [
    { id: "mit-k", name: "Karla", benutzername: "karla-pos", rolle: "bedienung", hauptstandortId: "kreuzberg" },
    { id: "mit-s", name: "Sven", benutzername: "sven-pos", rolle: "bedienung", hauptstandortId: "spandau" },
  ] });
  await datenbank.bestellung.createMany({ data: [
    { id: "bestellung-k", standortId: "kreuzberg", tischId: "tisch-k", aufgenommenVonMitarbeiterId: "mit-k" },
    { id: "bestellung-s", standortId: "spandau", tischId: "tisch-s", aufgenommenVonMitarbeiterId: "mit-s" },
  ] });
  await datenbank.artikel.createMany({ data: [
    { id: "pasta", name: "Pasta", kategorie: "Hauptgericht", preisCent: 1290, aktiv: true },
    { id: "inaktiv", name: "Alt", kategorie: "Hauptgericht", preisCent: 900, aktiv: false },
    { id: "spandau", name: "Suppe", kategorie: "Vorspeise", preisCent: 590, aktiv: true },
  ] });
  await datenbank.artikelStandort.createMany({ data: [
    { artikelId: "pasta", standortId: "kreuzberg" },
    { artikelId: "spandau", standortId: "spandau" },
  ] });
  return datenbank;
}

test("legt eine offene Position mit serverseitigem Preis-Snapshot und getrimmtem Sonderwunsch an", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const position = await erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "pasta", menge: 2, sonderwunsch: "  ohne Käse  ",
  });
  assert.equal(position.einzelpreisCent, 1290);
  assert.equal(position.status, "offen");
  assert.equal(position.sonderwunsch, "ohne Käse");
});

test("weist ungültige Mengen, inaktive Artikel und standortfremde Angebote zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  assert.throws(() => erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "pasta", menge: 0, sonderwunsch: "",
  }), BestellpositionValidierungsfehler);
  await assert.rejects(erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "inaktiv", menge: 1, sonderwunsch: "",
  }), BestellpositionReferenzfehler);
  await assert.rejects(erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "spandau", menge: 1, sonderwunsch: "",
  }), BestellpositionReferenzfehler);
  assert.equal(await datenbank.bestellposition.count(), 0);
});

test("bearbeitet nur Menge und Sonderwunsch und bewahrt den Preis-Snapshot", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const position = await erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "pasta", menge: 1, sonderwunsch: "",
  });
  await datenbank.artikel.update({ where: { id: "pasta" }, data: { preisCent: 1490 } });
  const bearbeitet = await aktualisiereBestellposition(datenbank, position.id, { menge: 3, sonderwunsch: "scharf" });
  assert.equal(bearbeitet.menge, 3);
  assert.equal(bearbeitet.sonderwunsch, "scharf");
  assert.equal(bearbeitet.einzelpreisCent, 1290);
  assert.equal(bearbeitet.status, "offen");
});

test("Datenbank verhindert manipulierte Preise, Status und Standortwechsel", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(datenbank.bestellposition.create({ data: {
    bestellungId: "bestellung-k", artikelId: "pasta", menge: 1, einzelpreisCent: 1, sonderwunsch: "", status: "offen",
  } }));
  const position = await erstelleBestellposition(datenbank, {
    bestellungId: "bestellung-k", artikelId: "pasta", menge: 1, sonderwunsch: "",
  });
  await assert.rejects(datenbank.bestellposition.update({ where: { id: position.id }, data: { status: "inZubereitung" } }));
  await assert.rejects(datenbank.bestellposition.update({ where: { id: position.id }, data: { einzelpreisCent: 1 } }));
  await assert.rejects(datenbank.bestellung.update({ where: { id: "bestellung-k" }, data: {
    standortId: "spandau", tischId: "tisch-s", aufgenommenVonMitarbeiterId: "mit-s",
  } }));
});
