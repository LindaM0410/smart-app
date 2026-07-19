import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereKuechenstatus,
  KuechenstatusUebergangsfehler,
  ladeKuechenpositionen,
} from "./kuechenstatus-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-kueche-"));
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
  await datenbank.mitarbeiter.create({ data: {
    id: "service", name: "Service", benutzername: "service", rolle: "bedienung", hauptstandortId: "standort",
  } });
  await datenbank.bestellung.create({ data: {
    id: "bestellung", standortId: "standort", tischId: "tisch", aufgenommenVonMitarbeiterId: "service",
  } });
  await datenbank.artikel.create({ data: {
    id: "pasta", name: "Pasta", kategorie: "Hauptgericht", preisCent: 1290,
  } });
  await datenbank.artikelStandort.create({ data: { artikelId: "pasta", standortId: "standort" } });
  await datenbank.bestellposition.createMany({ data: [
    { id: "offen", bestellungId: "bestellung", artikelId: "pasta", menge: 2, einzelpreisCent: 1290, sonderwunsch: "ohne Käse" },
    { id: "zweite", bestellungId: "bestellung", artikelId: "pasta", menge: 1, einzelpreisCent: 1290, sonderwunsch: "" },
  ] });
  return datenbank;
}

test("liefert nur zubereitungsrelevante Positionen mit Küchenangaben", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await aktualisiereKuechenstatus(datenbank, "zweite", "inZubereitung");
  await aktualisiereKuechenstatus(datenbank, "zweite", "serviert");
  const positionen = await ladeKuechenpositionen(datenbank);
  assert.equal(positionen.length, 1);
  assert.deepEqual(positionen[0], {
    id: "offen", menge: 2, sonderwunsch: "ohne Käse", status: "offen",
    artikel: { name: "Pasta" },
    bestellung: { tisch: { nummer: "K-1" }, standort: { name: "Kreuzberg" } },
  });
});

test("erlaubt ausschließlich offen zu inZubereitung zu serviert", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  assert.equal((await aktualisiereKuechenstatus(datenbank, "offen", "inZubereitung")).status, "inZubereitung");
  assert.equal((await aktualisiereKuechenstatus(datenbank, "offen", "serviert")).status, "serviert");
  await assert.rejects(aktualisiereKuechenstatus(datenbank, "offen", "inZubereitung"), KuechenstatusUebergangsfehler);
  await assert.rejects(aktualisiereKuechenstatus(datenbank, "fehlt", "inZubereitung"), KuechenstatusUebergangsfehler);
  await assert.rejects(aktualisiereKuechenstatus(datenbank, "zweite", "storniert"), KuechenstatusUebergangsfehler);
});

test("Datenbank lehnt übersprungene und rückwärts gerichtete Statuswechsel ab", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(datenbank.bestellposition.update({ where: { id: "offen" }, data: { status: "serviert" } }));
  await aktualisiereKuechenstatus(datenbank, "offen", "inZubereitung");
  await assert.rejects(datenbank.bestellposition.update({ where: { id: "offen" }, data: { status: "offen" } }));
});

test("Statusänderungen bewahren Preis-Snapshot und Bestelldaten", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const vorher = await datenbank.bestellposition.findUniqueOrThrow({ where: { id: "offen" } });
  await aktualisiereKuechenstatus(datenbank, "offen", "inZubereitung");
  const nachher = await datenbank.bestellposition.findUniqueOrThrow({ where: { id: "offen" } });
  assert.equal(nachher.einzelpreisCent, vorher.einzelpreisCent);
  assert.equal(nachher.menge, vorher.menge);
  assert.equal(nachher.sonderwunsch, vorher.sonderwunsch);
  assert.equal(nachher.artikelId, vorher.artikelId);
  assert.equal(nachher.bestellungId, vorher.bestellungId);
});
