import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereBestellung,
  BestellungReferenzfehler,
  erstelleBestellung,
} from "./bestellung-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-bestellungen-"));
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
    { id: "inaktiv", name: "Alt", adresse: "Test", sitzplaetze: 1, hatTerrasse: false, hatGrill: false, aktiv: false },
  ] });
  await datenbank.tisch.createMany({ data: [
    { id: "tisch-k", standortId: "kreuzberg", nummer: "K-1", kapazitaet: 4, bereich: "innen" },
    { id: "tisch-s", standortId: "spandau", nummer: "S-1", kapazitaet: 4, bereich: "innen" },
    { id: "tisch-inaktiv", standortId: "kreuzberg", nummer: "K-2", kapazitaet: 2, bereich: "innen", aktiv: false },
  ] });
  await datenbank.mitarbeiter.createMany({ data: [
    { id: "mit-k", name: "Karla", benutzername: "karla", rolle: "bedienung", hauptstandortId: "kreuzberg" },
    { id: "mit-s", name: "Sven", benutzername: "sven", rolle: "bedienung", hauptstandortId: "spandau" },
    { id: "mit-inaktiv", name: "Ina", benutzername: "ina", rolle: "bedienung", hauptstandortId: "kreuzberg", aktiv: false },
  ] });
  const gast = await datenbank.gast.create({ data: { id: "gast", name: "Gast", telefon: "", notiz: "" } });
  await datenbank.reservierung.createMany({ data: [
    { id: "res-k", gastId: gast.id, standortId: "kreuzberg", beginn: new Date("2026-07-18T18:00:00Z"), ende: new Date("2026-07-18T20:00:00Z"), personenanzahl: 2, status: "bestaetigt", notiz: "", erstelltVonMitarbeiterId: "mit-k" },
    { id: "res-s", gastId: gast.id, standortId: "spandau", beginn: new Date("2026-07-18T18:00:00Z"), ende: new Date("2026-07-18T20:00:00Z"), personenanzahl: 2, status: "bestaetigt", notiz: "", erstelltVonMitarbeiterId: "mit-s" },
  ] });
  return datenbank;
}

test("eröffnet und pflegt eine leere offene Bestellung mit optionaler Reservierung", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const bestellung = await erstelleBestellung(datenbank, {
    standortId: "kreuzberg", tischId: "tisch-k", reservierungId: null, aufgenommenVonMitarbeiterId: "mit-k",
  });

  assert.equal(bestellung.status, "offen");
  assert.ok(bestellung.erstelltAm instanceof Date);
  assert.equal(await datenbank.bestellung.count(), 1);

  const bearbeitet = await aktualisiereBestellung(datenbank, bestellung.id, {
    standortId: "kreuzberg", tischId: "tisch-k", reservierungId: "res-k", aufgenommenVonMitarbeiterId: "mit-k",
  });
  assert.equal(bearbeitet.reservierungId, "res-k");
  assert.equal(bearbeitet.status, "offen");
});

test("weist unbekannte und inaktive Referenzen zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const basis = { standortId: "kreuzberg", tischId: "tisch-k", aufgenommenVonMitarbeiterId: "mit-k" };

  await assert.rejects(erstelleBestellung(datenbank, { ...basis, tischId: "unbekannt" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, tischId: "tisch-inaktiv" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, aufgenommenVonMitarbeiterId: "mit-inaktiv" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, standortId: "inaktiv" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, reservierungId: "unbekannt" }), BestellungReferenzfehler);
  assert.equal(await datenbank.bestellung.count(), 0);
});

test("weist Standortkonflikte bei Tisch, Reservierung und Mitarbeiter zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const basis = { standortId: "kreuzberg", tischId: "tisch-k", aufgenommenVonMitarbeiterId: "mit-k" };

  await assert.rejects(erstelleBestellung(datenbank, { ...basis, tischId: "tisch-s" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, reservierungId: "res-s" }), BestellungReferenzfehler);
  await assert.rejects(erstelleBestellung(datenbank, { ...basis, aufgenommenVonMitarbeiterId: "mit-s" }), BestellungReferenzfehler);
  assert.equal(await datenbank.bestellung.count(), 0);
});

test("rollt eine ungültige Bearbeitung vollständig zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const bestellung = await erstelleBestellung(datenbank, {
    standortId: "kreuzberg", tischId: "tisch-k", reservierungId: null, aufgenommenVonMitarbeiterId: "mit-k",
  });

  await assert.rejects(aktualisiereBestellung(datenbank, bestellung.id, {
    standortId: "spandau", tischId: "tisch-s", reservierungId: "res-s", aufgenommenVonMitarbeiterId: "mit-k",
  }), BestellungReferenzfehler);

  const unveraendert = await datenbank.bestellung.findUniqueOrThrow({ where: { id: bestellung.id } });
  assert.equal(unveraendert.standortId, "kreuzberg");
  assert.equal(unveraendert.tischId, "tisch-k");
  assert.equal(unveraendert.reservierungId, null);
});

test("Datenbank verhindert direkte ungültige Bestellungen und andere Status", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(datenbank.bestellung.create({ data: {
    standortId: "kreuzberg", tischId: "tisch-s", aufgenommenVonMitarbeiterId: "mit-k", status: "offen",
  } }));
  await assert.rejects(datenbank.bestellung.create({ data: {
    standortId: "kreuzberg", tischId: "tisch-k", aufgenommenVonMitarbeiterId: "mit-k", status: "inBearbeitung",
  } }));
  assert.equal(await datenbank.bestellung.count(), 0);
});
