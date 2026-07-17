import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { anmelden } from "./authentifizierung.ts";
import { bootstrapDemoZugaenge, DEMO_MITARBEITENDE } from "./demo-zugaenge.ts";

async function testdatenbank() {
  const pfad = join(tmpdir(), `bella-vista-demo-${process.pid}-${Date.now()}-${Math.random()}.db`);
  const db = new PrismaClient({ datasourceUrl: `file:${pfad}` });
  await db.$executeRawUnsafe(`CREATE TABLE "Standort" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "adresse" TEXT NOT NULL, "sitzplaetze" INTEGER NOT NULL, "hatTerrasse" BOOLEAN NOT NULL, "hatGrill" BOOLEAN NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true)`);
  await db.$executeRawUnsafe(`CREATE TABLE "Mitarbeiter" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "benutzername" TEXT NOT NULL UNIQUE, "rolle" TEXT NOT NULL, "hauptstandortId" TEXT NOT NULL, "aktiv" BOOLEAN NOT NULL DEFAULT true, FOREIGN KEY ("hauptstandortId") REFERENCES "Standort" ("id"))`);
  await db.$executeRawUnsafe(`CREATE TABLE "MitarbeiterAuthentifizierung" ("mitarbeiterId" TEXT NOT NULL PRIMARY KEY, "passwortHash" TEXT NOT NULL, "aktualisiertAm" DATETIME NOT NULL, FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE)`);
  await db.$executeRawUnsafe(`CREATE TABLE "MitarbeiterSitzung" ("id" TEXT NOT NULL PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "mitarbeiterId" TEXT NOT NULL, "gueltigBis" DATETIME NOT NULL, "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE)`);
  return { db, pfad };
}

test("richtet nur Kreuzberg und vier aktive, anmeldbare Demo-Zugänge ein", async (t) => {
  const { db, pfad } = await testdatenbank();
  t.after(async () => { await db.$disconnect(); await rm(pfad, { force: true }); });
  await bootstrapDemoZugaenge(db);
  assert.equal(await db.standort.count(), 1);
  assert.equal(await db.mitarbeiter.count(), 4);
  assert.equal(await db.mitarbeiterAuthentifizierung.count(), 4);
  for (const person of DEMO_MITARBEITENDE) {
    const gespeichert = await db.mitarbeiter.findUniqueOrThrow({ where: { benutzername: person.benutzername } });
    assert.deepEqual({ name: gespeichert.name, rolle: gespeichert.rolle, aktiv: gespeichert.aktiv }, { name: person.name, rolle: person.rolle, aktiv: true });
    assert.ok(await anmelden(db, person.benutzername, "BellaVista2026!"));
  }
});

test("aktualisiert vorhandene Zugänge idempotent und reaktiviert Kreuzberg", async (t) => {
  const { db, pfad } = await testdatenbank();
  t.after(async () => { await db.$disconnect(); await rm(pfad, { force: true }); });
  const standort = await db.standort.create({ data: { name: "Kreuzberg", adresse: "Bestehend", sitzplaetze: 81, hatTerrasse: false, hatGrill: true, aktiv: false } });
  await db.mitarbeiter.create({ data: { name: "Alt", benutzername: "chef.inhaber", rolle: "kueche", hauptstandortId: standort.id, aktiv: false } });
  await bootstrapDemoZugaenge(db);
  await bootstrapDemoZugaenge(db);
  assert.equal(await db.standort.count(), 1);
  assert.equal((await db.standort.findUniqueOrThrow({ where: { id: standort.id } })).aktiv, true);
  assert.equal(await db.mitarbeiter.count(), 4);
  assert.equal((await db.mitarbeiter.findUniqueOrThrow({ where: { benutzername: "chef.inhaber" } })).rolle, "inhaber");
});
