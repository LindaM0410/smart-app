import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import { aktualisiereTisch, erstelleTisch } from "./tisch-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(tmpdir(), `bella-vista-tische-${process.pid}-${Date.now()}-${Math.random()}.db`);
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(pfad, { force: true });
  });

  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Standort" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "adresse" TEXT NOT NULL,
      "sitzplaetze" INTEGER NOT NULL,
      "hatTerrasse" BOOLEAN NOT NULL,
      "hatGrill" BOOLEAN NOT NULL,
      "aktiv" BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Tisch" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "standortId" TEXT NOT NULL,
      "nummer" TEXT NOT NULL,
      "kapazitaet" INTEGER NOT NULL,
      "bereich" TEXT NOT NULL,
      "kombinierbar" BOOLEAN NOT NULL DEFAULT false,
      "aktiv" BOOLEAN NOT NULL DEFAULT true,
      FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await datenbank.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "Tisch_standortId_nummer_key" ON "Tisch"("standortId", "nummer")',
  );

  return datenbank;
}

test("legt einen Tisch an und bearbeitet ihn", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const standort = await datenbank.standort.create({
    data: {
      name: "Kreuzberg",
      adresse: "Musterstraße 1",
      sitzplaetze: 80,
      hatTerrasse: true,
      hatGrill: true,
      aktiv: true,
    },
  });

  const tisch = await erstelleTisch(datenbank, {
    standortId: standort.id,
    nummer: "K-01",
    kapazitaet: 4,
    bereich: "innen",
    kombinierbar: true,
    aktiv: true,
  });
  const bearbeitet = await aktualisiereTisch(datenbank, tisch.id, {
    ...tisch,
    kapazitaet: 6,
    aktiv: false,
  });

  assert.equal(bearbeitet.kapazitaet, 6);
  assert.equal(bearbeitet.aktiv, false);
  assert.equal(await datenbank.tisch.count(), 1);
});

test("erzwingt Standortbindung und eindeutige Nummer pro Standort", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await datenbank.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  const standort = await datenbank.standort.create({
    data: {
      name: "Spandau",
      adresse: "Beispielweg 2",
      sitzplaetze: 50,
      hatTerrasse: false,
      hatGrill: false,
      aktiv: true,
    },
  });
  const eingabe = {
    standortId: standort.id,
    nummer: "S-01",
    kapazitaet: 2,
    bereich: "fenster",
    kombinierbar: false,
    aktiv: true,
  };

  await erstelleTisch(datenbank, eingabe);
  await assert.rejects(erstelleTisch(datenbank, eingabe));
  await assert.rejects(
    erstelleTisch(datenbank, { ...eingabe, standortId: "fehlt", nummer: "S-02" }),
  );
});
