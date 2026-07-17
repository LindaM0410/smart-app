import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  ladeBelegungsdatenFuerStandort,
  ladeReservierungenFuerStandort,
  ladeWalkInTischeFuerStandort,
  waehleAktivenStandort,
} from "./standortfilter.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-standortfilter-"));
  const datenbankpfad = path.join(verzeichnis, "test.db");
  execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: `file:${datenbankpfad}` },
    stdio: "ignore",
  });
  const datenbank = new PrismaClient({ datasourceUrl: `file:${datenbankpfad}` });
  t.after(async () => {
    await datenbank.$disconnect();
    await rm(verzeichnis, { recursive: true, force: true });
  });

  await datenbank.standort.createMany({ data: [
    { id: "kreuzberg", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true },
    { id: "spandau", name: "Spandau", adresse: "Test", sitzplaetze: 50, hatTerrasse: false, hatGrill: false },
    { id: "inaktiv", name: "Alt", adresse: "Test", sitzplaetze: 1, hatTerrasse: false, hatGrill: false, aktiv: false },
  ] });
  await datenbank.gast.create({ data: { id: "gast", name: "Testgast", telefon: "", notiz: "" } });
  await datenbank.tisch.createMany({ data: [
    { id: "tisch-k", standortId: "kreuzberg", nummer: "K-01", kapazitaet: 4, bereich: "innen" },
    { id: "tisch-s", standortId: "spandau", nummer: "S-01", kapazitaet: 4, bereich: "innen" },
  ] });
  for (const [id, standortId, tischId] of [
    ["reservierung-k", "kreuzberg", "tisch-k"],
    ["reservierung-s", "spandau", "tisch-s"],
  ] as const) {
    await datenbank.reservierung.create({ data: {
      id, gastId: "gast", standortId,
      beginn: new Date("2026-07-20T17:00:00.000Z"),
      ende: new Date("2026-07-20T19:00:00.000Z"),
      personenanzahl: 2, status: "bestaetigt", notiz: "", erstelltVonMitarbeiterId: "test",
      tische: { create: { tischId } },
    } });
  }
  await datenbank.belegung.createMany({ data: [
    { id: "belegung-k", tischId: "tisch-k", reservierungId: "reservierung-k" },
    { id: "belegung-s", tischId: "tisch-s", reservierungId: "reservierung-s", ende: new Date() },
  ] });
  return datenbank;
}

test("wählt nur eine vorhandene aktive Standortoption", () => {
  const standorte = [{ id: "kreuzberg", name: "Kreuzberg" }, { id: "spandau", name: "Spandau" }];
  assert.equal(waehleAktivenStandort(standorte)?.id, "kreuzberg");
  assert.equal(waehleAktivenStandort(standorte, "spandau")?.id, "spandau");
  assert.equal(waehleAktivenStandort(standorte, "inaktiv"), undefined);
});

test("lädt Reservierungen und Walk-in-Tische ohne Daten des anderen Standorts", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const [reservierungen, tische] = await Promise.all([
    ladeReservierungenFuerStandort(datenbank, "spandau"),
    ladeWalkInTischeFuerStandort(datenbank, "spandau"),
  ]);
  assert.deepEqual(reservierungen.map(({ id }) => id), ["reservierung-s"]);
  assert.deepEqual(tische.map(({ id }) => id), ["tisch-s"]);
});

test("lädt offene Belegungen und platzierbare Zuordnungen nur für einen Standort", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const kreuzberg = await ladeBelegungsdatenFuerStandort(datenbank, "kreuzberg");
  assert.deepEqual(kreuzberg.offeneBelegungen.map(({ id }) => id), ["belegung-k"]);
  assert.deepEqual(kreuzberg.zuordnungen, []);

  const spandau = await ladeBelegungsdatenFuerStandort(datenbank, "spandau");
  assert.deepEqual(spandau.offeneBelegungen, []);
  assert.deepEqual(spandau.zuordnungen.map(({ reservierungId }) => reservierungId), ["reservierung-s"]);
});
