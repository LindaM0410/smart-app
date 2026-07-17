import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereMitarbeiter,
  erstelleMitarbeiter,
} from "./mitarbeiter-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-mitarbeiter-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
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
    CREATE TABLE "Mitarbeiter" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "benutzername" TEXT NOT NULL,
      "rolle" TEXT NOT NULL CHECK ("rolle" IN ('inhaber', 'manager', 'bedienung', 'kueche')),
      "hauptstandortId" TEXT NOT NULL,
      "aktiv" BOOLEAN NOT NULL DEFAULT true,
      FOREIGN KEY ("hauptstandortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await datenbank.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "Mitarbeiter_benutzername_key" ON "Mitarbeiter"("benutzername")',
  );

  return datenbank;
}

async function legeStandortAn(datenbank: PrismaClient, aktiv: boolean) {
  return datenbank.standort.create({
    data: {
      name: aktiv ? "Kreuzberg" : "Spandau",
      adresse: "Musterstraße 1",
      sitzplaetze: 80,
      hatTerrasse: true,
      hatGrill: true,
      aktiv,
    },
  });
}

test("legt einen Mitarbeiter an, bearbeitet und deaktiviert ihn", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const standort = await legeStandortAn(datenbank, true);
  const mitarbeiter = await erstelleMitarbeiter(datenbank, {
    name: "Giulia Rossi",
    benutzername: "giulia.rossi",
    rolle: "bedienung",
    hauptstandortId: standort.id,
    aktiv: true,
  });
  const bearbeitet = await aktualisiereMitarbeiter(datenbank, mitarbeiter.id, {
    name: "Giulia Bianchi",
    benutzername: "giulia.rossi",
    rolle: "manager",
    hauptstandortId: standort.id,
    aktiv: false,
  });

  assert.equal(bearbeitet.name, "Giulia Bianchi");
  assert.equal(bearbeitet.rolle, "manager");
  assert.equal(bearbeitet.aktiv, false);
  assert.equal(await datenbank.mitarbeiter.count(), 1);
});

test("erzwingt eindeutige Benutzernamen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const standort = await legeStandortAn(datenbank, true);
  const eingabe = {
    name: "Mario Rossi",
    benutzername: "mario.rossi",
    rolle: "kueche",
    hauptstandortId: standort.id,
    aktiv: true,
  };

  await erstelleMitarbeiter(datenbank, eingabe);
  await assert.rejects(erstelleMitarbeiter(datenbank, { ...eingabe, name: "Mario Bianchi" }));
});

test("weist fehlende und inaktive Hauptstandorte beim Schreiben ab", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const inaktiverStandort = await legeStandortAn(datenbank, false);
  const basis = {
    name: "Lucia Verdi",
    benutzername: "lucia.verdi",
    rolle: "inhaber",
    aktiv: true,
  };

  await assert.rejects(
    erstelleMitarbeiter(datenbank, { ...basis, hauptstandortId: inaktiverStandort.id }),
    /MITARBEITER_HAUPTSTANDORT_INAKTIV/,
  );
  await assert.rejects(
    erstelleMitarbeiter(datenbank, { ...basis, hauptstandortId: "fehlt" }),
    /MITARBEITER_HAUPTSTANDORT_INAKTIV/,
  );
});

test("erzwingt die Rollenmenge auch in der Datenbank", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const standort = await legeStandortAn(datenbank, true);

  await assert.rejects(
    datenbank.mitarbeiter.create({
      data: {
        name: "Unbekannt",
        benutzername: "unbekannt",
        rolle: "admin",
        hauptstandortId: standort.id,
        aktiv: true,
      },
    }),
  );
});
