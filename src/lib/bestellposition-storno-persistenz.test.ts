import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  BestellpositionStornoFehler,
  storniereBestellposition,
} from "./bestellposition-storno-persistenz.ts";
import { ladeBestellungenFuerStandort } from "./bestellung-persistenz.ts";
import { ladeKuechenpositionen } from "./kuechenstatus-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-storno-"));
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
    { id: "inhaber", name: "Inhaber", benutzername: "inhaber", rolle: "inhaber", hauptstandortId: "standort" },
    { id: "manager", name: "Manager", benutzername: "manager", rolle: "manager", hauptstandortId: "standort" },
    { id: "bedienung", name: "Bedienung", benutzername: "bedienung", rolle: "bedienung", hauptstandortId: "standort" },
    { id: "kueche", name: "Küche", benutzername: "kueche", rolle: "kueche", hauptstandortId: "standort" },
  ] });
  await datenbank.bestellung.create({ data: {
    id: "bestellung", standortId: "standort", tischId: "tisch", aufgenommenVonMitarbeiterId: "bedienung",
  } });
  await datenbank.artikel.create({ data: {
    id: "pasta", name: "Pasta", kategorie: "Hauptgericht", preisCent: 1290,
  } });
  await datenbank.artikelStandort.create({ data: { artikelId: "pasta", standortId: "standort" } });
  await datenbank.bestellposition.createMany({ data: [
    { id: "offen", bestellungId: "bestellung", artikelId: "pasta", menge: 2, einzelpreisCent: 1290, sonderwunsch: "ohne Käse" },
    { id: "zubereitung", bestellungId: "bestellung", artikelId: "pasta", menge: 1, einzelpreisCent: 1290, sonderwunsch: "" },
    { id: "serviert", bestellungId: "bestellung", artikelId: "pasta", menge: 3, einzelpreisCent: 1290, sonderwunsch: "scharf" },
  ] });
  await datenbank.bestellposition.update({ where: { id: "zubereitung" }, data: { status: "inZubereitung" } });
  await datenbank.bestellposition.update({ where: { id: "serviert" }, data: { status: "inZubereitung" } });
  await datenbank.bestellposition.update({ where: { id: "serviert" }, data: { status: "serviert" } });
  return datenbank;
}

test("Manager und Inhaber stornieren offene und in Zubereitung befindliche Positionen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const offen = await storniereBestellposition(datenbank, "offen", "manager");
  const zubereitung = await storniereBestellposition(datenbank, "zubereitung", "inhaber");
  assert.equal(offen.status, "storniert");
  assert.equal(offen.storniertVonMitarbeiterId, "manager");
  assert.ok(offen.storniertAm instanceof Date);
  assert.equal(zubereitung.status, "storniert");
  assert.equal(zubereitung.storniertVonMitarbeiterId, "inhaber");
});

test("Storno bewahrt sämtliche fachlichen Positionsdaten", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const vorher = await datenbank.bestellposition.findUniqueOrThrow({ where: { id: "offen" } });
  const nachher = await storniereBestellposition(datenbank, "offen", "manager");
  for (const feld of ["bestellungId", "artikelId", "menge", "einzelpreisCent", "sonderwunsch"] as const) {
    assert.equal(nachher[feld], vorher[feld]);
  }
});

test("stornierte Position bleibt in der Bestellung sichtbar und verschwindet aus der Küche", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await storniereBestellposition(datenbank, "offen", "manager");
  const bestellungen = await ladeBestellungenFuerStandort(datenbank, "standort");
  const position = bestellungen[0]?.positionen.find((eintrag) => eintrag.id === "offen");
  assert.equal(position?.status, "storniert");
  assert.equal(position?.storniertVonMitarbeiterId, "manager");
  assert.equal((await ladeKuechenpositionen(datenbank)).some((eintrag) => eintrag.id === "offen"), false);
});

test("Bedienung, Küche und inaktive Freigebende werden abgelehnt", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(storniereBestellposition(datenbank, "offen", "bedienung"), BestellpositionStornoFehler);
  await assert.rejects(storniereBestellposition(datenbank, "offen", "kueche"), BestellpositionStornoFehler);
  await datenbank.mitarbeiter.update({ where: { id: "manager" }, data: { aktiv: false } });
  await assert.rejects(storniereBestellposition(datenbank, "offen", "manager"), BestellpositionStornoFehler);
});

test("serviert und storniert sind für Storno gesperrt; storniert bleibt Endstatus", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(storniereBestellposition(datenbank, "serviert", "manager"), BestellpositionStornoFehler);
  await storniereBestellposition(datenbank, "offen", "manager");
  await assert.rejects(storniereBestellposition(datenbank, "offen", "inhaber"), BestellpositionStornoFehler);
  await assert.rejects(datenbank.bestellposition.update({ where: { id: "offen" }, data: { status: "offen" } }));
});

test("Datenbank erzwingt Statusfolge, Freigaberolle und unveränderte Positionsdaten", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const zeitpunkt = new Date();
  await assert.rejects(datenbank.bestellposition.update({
    where: { id: "offen" },
    data: { status: "storniert", storniertAm: zeitpunkt, storniertVonMitarbeiterId: "bedienung" },
  }));
  await assert.rejects(datenbank.bestellposition.update({
    where: { id: "serviert" },
    data: { status: "storniert", storniertAm: zeitpunkt, storniertVonMitarbeiterId: "manager" },
  }));
  await assert.rejects(datenbank.bestellposition.update({
    where: { id: "offen" },
    data: { status: "storniert", menge: 99, storniertAm: zeitpunkt, storniertVonMitarbeiterId: "manager" },
  }));
});
