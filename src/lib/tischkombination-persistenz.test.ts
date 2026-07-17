import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  entferneTischKombination,
  erstelleTischKombination,
} from "./tischkombination-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(tmpdir(), `bella-vista-kombination-${process.pid}-${Date.now()}-${Math.random()}.db`);
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(pfad, { force: true });
  });

  await datenbank.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  await datenbank.$executeRawUnsafe(`CREATE TABLE "Standort" (
    "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "adresse" TEXT NOT NULL,
    "sitzplaetze" INTEGER NOT NULL, "hatTerrasse" BOOLEAN NOT NULL,
    "hatGrill" BOOLEAN NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true
  )`);
  await datenbank.$executeRawUnsafe(`CREATE TABLE "Tisch" (
    "id" TEXT NOT NULL PRIMARY KEY, "standortId" TEXT NOT NULL, "nummer" TEXT NOT NULL,
    "kapazitaet" INTEGER NOT NULL, "bereich" TEXT NOT NULL,
    "kombinierbar" BOOLEAN NOT NULL DEFAULT false, "aktiv" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);

  await datenbank.$executeRawUnsafe(`CREATE TABLE "TischKombination" (
    "id" TEXT NOT NULL PRIMARY KEY, "standortId" TEXT NOT NULL, "schluessel" TEXT NOT NULL,
    FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);
  await datenbank.$executeRawUnsafe(`CREATE TABLE "TischKombinationTisch" (
    "kombinationId" TEXT NOT NULL, "tischId" TEXT NOT NULL,
    PRIMARY KEY ("kombinationId", "tischId"),
    FOREIGN KEY ("kombinationId") REFERENCES "TischKombination" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`);
  await datenbank.$executeRawUnsafe('CREATE UNIQUE INDEX "TischKombination_schluessel_key" ON "TischKombination"("schluessel")');
  await datenbank.$executeRawUnsafe(`CREATE TRIGGER "TischKombinationTisch_nur_gueltige_Tische"
    BEFORE INSERT ON "TischKombinationTisch"
    WHEN NOT EXISTS (
      SELECT 1 FROM "TischKombination" AS kombination
      JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
      WHERE kombination."id" = NEW."kombinationId"
        AND kombination."standortId" = tisch."standortId"
        AND tisch."aktiv" = 1 AND tisch."kombinierbar" = 1
    )
    BEGIN SELECT RAISE(ABORT, 'TISCHKOMBINATION_UNGUELTIGER_TISCH'); END`);
  await datenbank.$executeRawUnsafe(`CREATE TRIGGER "Tisch_Kombinationsgueltigkeit_bewahren"
    BEFORE UPDATE OF "standortId", "aktiv", "kombinierbar" ON "Tisch"
    WHEN EXISTS (
      SELECT 1 FROM "TischKombinationTisch" AS mitglied
      JOIN "TischKombination" AS kombination ON kombination."id" = mitglied."kombinationId"
      WHERE mitglied."tischId" = OLD."id"
        AND (NEW."standortId" <> kombination."standortId" OR NEW."aktiv" <> 1 OR NEW."kombinierbar" <> 1)
    )
    BEGIN SELECT RAISE(ABORT, 'TISCH_WIRD_IN_KOMBINATION_VERWENDET'); END`);

  return datenbank;
}

async function basisdaten(datenbank: PrismaClient) {
  const ersterStandort = await datenbank.standort.create({
    data: { name: "Standort A", adresse: "A", sitzplaetze: 20, hatTerrasse: false, hatGrill: false, aktiv: true },
  });
  const zweiterStandort = await datenbank.standort.create({
    data: { name: "Standort B", adresse: "B", sitzplaetze: 20, hatTerrasse: false, hatGrill: false, aktiv: true },
  });
  const tisch = (nummer: string, standortId = ersterStandort.id, aktiv = true, kombinierbar = true) =>
    datenbank.tisch.create({ data: { standortId, nummer, kapazitaet: 2, bereich: "innen", aktiv, kombinierbar } });

  return {
    ersterStandort,
    tischEins: await tisch("1"),
    tischZwei: await tisch("2"),
    andererTisch: await tisch("3", zweiterStandort.id),
    inaktiverTisch: await tisch("4", ersterStandort.id, false),
    ungeeigneterTisch: await tisch("5", ersterStandort.id, true, false),
  };
}

test("legt eine erlaubte Kombination an und entfernt sie", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const daten = await basisdaten(datenbank);
  const kombination = await erstelleTischKombination(datenbank, {
    standortId: daten.ersterStandort.id,
    tischIds: [daten.tischZwei.id, daten.tischEins.id],
  });

  assert.equal(kombination.tische.length, 2);
  await entferneTischKombination(datenbank, kombination.id);
  assert.equal(await datenbank.tischKombination.count(), 0);
});

test("weist fremde, inaktive und nicht kombinierbare Tische zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const daten = await basisdaten(datenbank);

  for (const ungueltigeId of [daten.andererTisch.id, daten.inaktiverTisch.id, daten.ungeeigneterTisch.id]) {
    await assert.rejects(
      erstelleTischKombination(datenbank, {
        standortId: daten.ersterStandort.id,
        tischIds: [daten.tischEins.id, ungueltigeId],
      }),
      /TISCHKOMBINATION_UNGUELTIGE_TISCHE/,
    );
  }
  assert.equal(await datenbank.tischKombination.count(), 0);
});

test("verhindert dieselbe Tischmenge in anderer Reihenfolge", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const daten = await basisdaten(datenbank);
  await erstelleTischKombination(datenbank, {
    standortId: daten.ersterStandort.id,
    tischIds: [daten.tischEins.id, daten.tischZwei.id],
  });

  await assert.rejects(
    erstelleTischKombination(datenbank, {
      standortId: daten.ersterStandort.id,
      tischIds: [daten.tischZwei.id, daten.tischEins.id],
    }),
  );
});

test("Datenbank bewahrt die Gültigkeit bestehender Kombinationen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const daten = await basisdaten(datenbank);
  await erstelleTischKombination(datenbank, {
    standortId: daten.ersterStandort.id,
    tischIds: [daten.tischEins.id, daten.tischZwei.id],
  });

  await assert.rejects(datenbank.tisch.update({ where: { id: daten.tischEins.id }, data: { aktiv: false } }));
  assert.equal((await datenbank.tisch.findUniqueOrThrow({ where: { id: daten.tischEins.id } })).aktiv, true);
});
