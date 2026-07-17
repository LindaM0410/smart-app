import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import { abmelden, anmelden, ladeAngemeldetenMitarbeiter, setzePasswort } from "./authentifizierung.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(tmpdir(), `bella-vista-auth-${process.pid}-${Date.now()}-${Math.random()}.db`);
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });
  t.after(async () => { await datenbank.$disconnect(); await rm(pfad, { force: true }); });

  await datenbank.$executeRawUnsafe(`CREATE TABLE "Standort" (
    "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "adresse" TEXT NOT NULL,
    "sitzplaetze" INTEGER NOT NULL, "hatTerrasse" BOOLEAN NOT NULL,
    "hatGrill" BOOLEAN NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true)`);
  await datenbank.$executeRawUnsafe(`CREATE TABLE "Mitarbeiter" (
    "id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "benutzername" TEXT NOT NULL UNIQUE,
    "rolle" TEXT NOT NULL, "hauptstandortId" TEXT NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("hauptstandortId") REFERENCES "Standort" ("id"))`);
  await datenbank.$executeRawUnsafe(`CREATE TABLE "MitarbeiterAuthentifizierung" (
    "mitarbeiterId" TEXT NOT NULL PRIMARY KEY, "passwortHash" TEXT NOT NULL,
    "aktualisiertAm" DATETIME NOT NULL,
    FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE)`);
  await datenbank.$executeRawUnsafe(`CREATE TABLE "MitarbeiterSitzung" (
    "id" TEXT NOT NULL PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE,
    "mitarbeiterId" TEXT NOT NULL, "gueltigBis" DATETIME NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE)`);

  await datenbank.standort.create({ data: { id: "kreuzberg", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true, aktiv: true } });
  await datenbank.mitarbeiter.createMany({ data: [
    { id: "aktiv", name: "Giulia Rossi", benutzername: "giulia", rolle: "manager", hauptstandortId: "kreuzberg", aktiv: true },
    { id: "inaktiv", name: "Mario Rossi", benutzername: "mario", rolle: "bedienung", hauptstandortId: "kreuzberg", aktiv: false },
  ] });
  await setzePasswort(datenbank, "giulia", "sicheres-passwort");
  await setzePasswort(datenbank, "mario", "anderes-passwort");
  return datenbank;
}

test("meldet einen aktiven Mitarbeiter an und lädt Identität, Rolle und Hauptstandort", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const sitzung = await anmelden(db, "giulia", "sicheres-passwort");
  assert.ok(sitzung);
  const person = await ladeAngemeldetenMitarbeiter(db, sitzung.token);
  assert.deepEqual(person, { id: "aktiv", name: "Giulia Rossi", benutzername: "giulia", rolle: "manager", hauptstandortId: "kreuzberg" });
});

test("weist falsche Zugangsdaten, unbekannte und inaktive Mitarbeitende gleichförmig ab", async (t) => {
  const db = await erstelleTestdatenbank(t);
  assert.equal(await anmelden(db, "giulia", "falsches-passwort"), null);
  assert.equal(await anmelden(db, "unbekannt", "sicheres-passwort"), null);
  assert.equal(await anmelden(db, "mario", "anderes-passwort"), null);
  assert.equal(await db.mitarbeiterSitzung.count(), 0);
});

test("weist eine manipulierte oder abgelaufene Sitzung ab", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const jetzt = new Date("2026-07-18T10:00:00Z");
  const sitzung = await anmelden(db, "giulia", "sicheres-passwort", jetzt);
  assert.ok(sitzung);
  assert.equal(await ladeAngemeldetenMitarbeiter(db, `${sitzung.token}x`, jetzt), null);
  assert.equal(await ladeAngemeldetenMitarbeiter(db, sitzung.token, sitzung.gueltigBis), null);
  assert.equal(await db.mitarbeiterSitzung.count(), 0);
});

test("macht eine bestehende Sitzung bei Deaktivierung unwirksam", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const sitzung = await anmelden(db, "giulia", "sicheres-passwort");
  assert.ok(sitzung);
  await db.mitarbeiter.update({ where: { id: "aktiv" }, data: { aktiv: false } });
  assert.equal(await ladeAngemeldetenMitarbeiter(db, sitzung.token), null);
  assert.equal(await db.mitarbeiterSitzung.count(), 0);
});

test("meldet ab und widerruft beim Passwort-Reset alle bestehenden Sitzungen", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const erste = await anmelden(db, "giulia", "sicheres-passwort");
  assert.ok(erste);
  await abmelden(db, erste.token);
  assert.equal(await ladeAngemeldetenMitarbeiter(db, erste.token), null);

  const zweite = await anmelden(db, "giulia", "sicheres-passwort");
  assert.ok(zweite);
  await setzePasswort(db, "giulia", "neues-passwort-123");
  assert.equal(await ladeAngemeldetenMitarbeiter(db, zweite.token), null);
  assert.equal(await anmelden(db, "giulia", "sicheres-passwort"), null);
  assert.ok(await anmelden(db, "giulia", "neues-passwort-123"));
});
