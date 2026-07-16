import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { aktualisiereStandort, erstelleStandort } from "./standort-persistenz.ts";

test("legt einen Standort an und bearbeitet ihn", async (t) => {
  const datenbankPfad = join(tmpdir(), `bella-vista-standorte-${process.pid}-${Date.now()}.db`);
  const datenbank = new PrismaClient({ datasourceUrl: `file:${datenbankPfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(datenbankPfad, { force: true });
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

  const standort = await erstelleStandort(datenbank, {
    name: "Spandau",
    adresse: "Beispielweg 2, 13597 Berlin",
    sitzplaetze: 50,
    hatTerrasse: false,
    hatGrill: false,
    aktiv: true,
  });

  assert.equal(standort.name, "Spandau");
  assert.equal(standort.hatGrill, false);

  const bearbeitet = await aktualisiereStandort(datenbank, standort.id, {
    ...standort,
    sitzplaetze: 52,
    aktiv: false,
  });

  assert.equal(bearbeitet.sitzplaetze, 52);
  assert.equal(bearbeitet.aktiv, false);
  assert.equal(await datenbank.standort.count(), 1);
});
