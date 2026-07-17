import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import { ladeTischuebersicht } from "./tischuebersicht-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-uebersicht-"));
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
  ] });
  await datenbank.gast.create({ data: { id: "gast", name: "Testgast", telefon: "", notiz: "" } });
  await datenbank.tisch.createMany({ data: [
    { id: "frei", standortId: "kreuzberg", nummer: "K-01", kapazitaet: 2, bereich: "innen" },
    { id: "bald", standortId: "kreuzberg", nummer: "K-02", kapazitaet: 4, bereich: "fenster" },
    { id: "belegt", standortId: "kreuzberg", nummer: "K-03", kapazitaet: 6, bereich: "innen" },
    { id: "inaktiv", standortId: "kreuzberg", nummer: "K-04", kapazitaet: 2, bereich: "bar", aktiv: false },
    { id: "fremd", standortId: "spandau", nummer: "S-01", kapazitaet: 2, bereich: "innen" },
  ] });

  const reservierungen = [
    { id: "bald-aktiv", tischId: "bald", status: "bestaetigt", beginn: "2026-07-20T17:30:00.000Z" },
    { id: "bald-storniert", tischId: "frei", status: "storniert", beginn: "2026-07-20T17:20:00.000Z" },
    { id: "am-folgetag", tischId: "frei", status: "angefragt", beginn: "2026-07-20T22:00:00.000Z" },
    { id: "belegt-reservierung", tischId: "belegt", status: "abgeschlossen", beginn: "2026-07-20T15:00:00.000Z" },
  ];
  for (const eintrag of reservierungen) {
    await datenbank.reservierung.create({ data: {
      id: eintrag.id, gastId: "gast", standortId: "kreuzberg",
      beginn: new Date(eintrag.beginn), ende: new Date(new Date(eintrag.beginn).getTime() + 2 * 60 * 60 * 1000),
      personenanzahl: 2, status: eintrag.status, notiz: "", erstelltVonMitarbeiterId: "test",
      tische: { create: { tischId: eintrag.tischId } },
    } });
  }
  await datenbank.belegung.create({ data: {
    id: "offen", tischId: "belegt", reservierungId: "belegt-reservierung",
    beginn: new Date("2026-07-20T15:15:00.000Z"),
  } });
  return datenbank;
}

test("lädt nur aktive Tische des Standorts mit korrekt priorisiertem Zustand", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const uebersicht = await ladeTischuebersicht(
    datenbank,
    "kreuzberg",
    new Date("2026-07-20T17:00:00.000Z"),
    new Date("2026-07-20T22:00:00.000Z"),
  );

  assert.deepEqual(uebersicht.map(({ nummer, status }) => ({ nummer, status })), [
    { nummer: "K-01", status: "frei" },
    { nummer: "K-02", status: "baldReserviert" },
    { nummer: "K-03", status: "belegt" },
  ]);
  assert.equal(uebersicht[1].naechsteReservierung?.toISOString(), "2026-07-20T17:30:00.000Z");
});

test("bezieht den exakten Tageswechsel nicht in den gewählten Tag ein", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const uebersicht = await ladeTischuebersicht(
    datenbank,
    "kreuzberg",
    new Date("2026-07-20T21:30:00.000Z"),
    new Date("2026-07-20T22:00:00.000Z"),
  );
  assert.equal(uebersicht.find(({ nummer }) => nummer === "K-01")?.status, "frei");
});

