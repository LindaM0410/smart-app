import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereReservierung,
  erstelleReservierung,
  ReservierungReferenzfehler,
} from "./reservierung-persistenz.ts";
import { normalisiereReservierung } from "./reservierungen.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-reservierungen-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(pfad, { force: true });
  });

  await datenbank.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Standort" (
      "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "adresse" TEXT NOT NULL,
      "sitzplaetze" INTEGER NOT NULL, "hatTerrasse" BOOLEAN NOT NULL,
      "hatGrill" BOOLEAN NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Gast" (
      "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "telefon" TEXT NOT NULL,
      "notiz" TEXT NOT NULL, "istStammgast" BOOLEAN NOT NULL DEFAULT false,
      "hatBellaCard" BOOLEAN NOT NULL DEFAULT false, "besuchsanzahl" INTEGER NOT NULL DEFAULT 0,
      "aktiv" BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Reservierung" (
      "id" TEXT NOT NULL PRIMARY KEY, "gastId" TEXT NOT NULL, "standortId" TEXT NOT NULL,
      "beginn" DATETIME NOT NULL, "ende" DATETIME NOT NULL, "personenanzahl" INTEGER NOT NULL,
      "status" TEXT NOT NULL, "notiz" TEXT NOT NULL, "istGruppe" BOOLEAN NOT NULL DEFAULT false,
      "erstelltVonMitarbeiterId" TEXT NOT NULL,
      FOREIGN KEY ("gastId") REFERENCES "Gast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await datenbank.standort.create({
    data: {
      id: "standort-aktiv",
      name: "Kreuzberg",
      adresse: "Teststraße 1",
      sitzplaetze: 80,
      hatTerrasse: true,
      hatGrill: true,
      aktiv: true,
    },
  });
  await datenbank.gast.create({
    data: {
      id: "gast-aktiv",
      name: "Giulia Rossi",
      telefon: "",
      notiz: "",
      istStammgast: false,
      hatBellaCard: false,
      besuchsanzahl: 0,
      aktiv: true,
    },
  });

  return datenbank;
}

const eingabe = normalisiereReservierung({
  gastId: "gast-aktiv",
  standortId: "standort-aktiv",
  beginn: new Date("2026-07-20T17:00:00.000Z"),
  personenanzahl: 4,
  status: "angefragt",
  notiz: "Fensterplatz",
  erstelltVonMitarbeiterId: "mitarbeiter-1",
});

test("legt eine Reservierung an und bearbeitet sie", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const reservierung = await erstelleReservierung(datenbank, eingabe);
  const bearbeitet = await aktualisiereReservierung(datenbank, reservierung.id, {
    ...eingabe,
    personenanzahl: 8,
    istGruppe: true,
    status: "bestaetigt",
  });

  assert.equal(bearbeitet.ende.toISOString(), "2026-07-20T19:00:00.000Z");
  assert.equal(bearbeitet.personenanzahl, 8);
  assert.equal(bearbeitet.istGruppe, true);
  assert.equal(bearbeitet.status, "bestaetigt");
  assert.equal(await datenbank.reservierung.count(), 1);
});

test("weist nicht vorhandene oder inaktive Referenzen zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);

  await assert.rejects(
    erstelleReservierung(datenbank, { ...eingabe, gastId: "fehlt" }),
    (fehler) =>
      fehler instanceof ReservierungReferenzfehler && fehler.feld === "gastId",
  );

  await datenbank.standort.update({
    where: { id: "standort-aktiv" },
    data: { aktiv: false },
  });
  await assert.rejects(
    erstelleReservierung(datenbank, eingabe),
    (fehler) =>
      fehler instanceof ReservierungReferenzfehler && fehler.feld === "standortId",
  );
});
