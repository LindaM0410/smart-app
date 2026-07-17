import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import { aktualisiereGast, erstelleGast } from "./gast-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-gaeste-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(pfad, { force: true });
  });

  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Gast" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "telefon" TEXT NOT NULL,
      "notiz" TEXT NOT NULL,
      "istStammgast" BOOLEAN NOT NULL DEFAULT false,
      "hatBellaCard" BOOLEAN NOT NULL DEFAULT false,
      "besuchsanzahl" INTEGER NOT NULL DEFAULT 0,
      "aktiv" BOOLEAN NOT NULL DEFAULT true
    )
  `);

  return datenbank;
}

test("legt einen Gast an und bearbeitet ihn", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const gast = await erstelleGast(datenbank, {
    name: "Giulia Rossi",
    telefon: "030 1234567",
    notiz: "Fensterplatz bevorzugt",
    istStammgast: false,
    hatBellaCard: false,
    besuchsanzahl: 1,
    aktiv: true,
  });
  const bearbeitet = await aktualisiereGast(datenbank, gast.id, {
    name: "Giulia Rossi",
    telefon: "030 7654321",
    notiz: "Bella-Card geprüft",
    istStammgast: true,
    hatBellaCard: true,
    besuchsanzahl: 12,
    aktiv: false,
  });

  assert.equal(bearbeitet.telefon, "030 7654321");
  assert.equal(bearbeitet.istStammgast, true);
  assert.equal(bearbeitet.hatBellaCard, true);
  assert.equal(bearbeitet.besuchsanzahl, 12);
  assert.equal(bearbeitet.aktiv, false);
  assert.equal(await datenbank.gast.count(), 1);
});
