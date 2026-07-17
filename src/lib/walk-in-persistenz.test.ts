import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  platziereWalkIn,
  WalkInKapazitaetsfehler,
  WalkInReferenzfehler,
  WalkInZeitfensterfehler,
} from "./walk-in-persistenz.ts";

const beginn = new Date("2026-07-20T17:00:00.000Z");
const eingabe = {
  gastId: "gast-1", standortId: "standort-1", tischId: "tisch-1", personenanzahl: 4, notiz: "Kinderstuhl",
};

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-walk-in-"));
  const datenbankpfad = path.join(verzeichnis, "test.db");
  execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: `file:${datenbankpfad}` }, stdio: "ignore",
  });
  const datenbank = new PrismaClient({ datasourceUrl: `file:${datenbankpfad}` });
  t.after(async () => {
    await datenbank.$disconnect();
    await rm(verzeichnis, { recursive: true, force: true });
  });
  await datenbank.standort.createMany({ data: [
    { id: "standort-1", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true },
    { id: "standort-2", name: "Spandau", adresse: "Test", sitzplaetze: 50, hatTerrasse: false, hatGrill: false },
  ] });
  await datenbank.gast.create({ data: { id: "gast-1", name: "Walk-in", telefon: "", notiz: "" } });
  await datenbank.tisch.createMany({ data: [
    { id: "tisch-1", standortId: "standort-1", nummer: "K-01", kapazitaet: 4, bereich: "innen" },
    { id: "tisch-2", standortId: "standort-1", nummer: "K-02", kapazitaet: 2, bereich: "innen" },
    { id: "tisch-fremd", standortId: "standort-2", nummer: "S-01", kapazitaet: 4, bereich: "innen" },
  ] });
  return { datenbank, datenbankpfad };
}

async function reserviereTisch(datenbank: PrismaClient, start: Date, ende: Date) {
  return datenbank.reservierung.create({ data: {
    gastId: "gast-1", standortId: "standort-1", beginn: start, ende,
    personenanzahl: 2, status: "bestaetigt", notiz: "", erstelltVonMitarbeiterId: "test",
    tische: { create: { tischId: "tisch-1" } },
  } });
}

test("legt Walk-in-Reservierung, Tischzuordnung und reale Belegung atomar an", async (t) => {
  const { datenbank } = await erstelleTestdatenbank(t);
  const ergebnis = await platziereWalkIn(datenbank, eingabe, beginn);
  assert.equal(ergebnis.reservierung.typ, "walkIn");
  assert.equal(ergebnis.reservierung.status, "bestaetigt");
  assert.equal(ergebnis.reservierung.ende.toISOString(), "2026-07-20T19:00:00.000Z");
  assert.equal(ergebnis.belegung.beginn.toISOString(), beginn.toISOString());
  assert.equal(await datenbank.reservierungTisch.count(), 1);
  assert.equal(await datenbank.belegung.count({ where: { ende: null } }), 1);
});

test("erlaubt eine Folgereservierung exakt am halb-offenen Intervallende", async (t) => {
  const { datenbank } = await erstelleTestdatenbank(t);
  await reserviereTisch(datenbank, new Date("2026-07-20T19:00:00.000Z"), new Date("2026-07-20T21:00:00.000Z"));
  await platziereWalkIn(datenbank, eingabe, beginn);
  assert.equal(await datenbank.reservierung.count(), 2);
});

test("weist eine zu kurze Lücke zurück und hinterlässt keine Teildaten", async (t) => {
  const { datenbank } = await erstelleTestdatenbank(t);
  await reserviereTisch(datenbank, new Date("2026-07-20T18:59:00.000Z"), new Date("2026-07-20T20:00:00.000Z"));
  await assert.rejects(platziereWalkIn(datenbank, eingabe, beginn), WalkInZeitfensterfehler);
  assert.equal(await datenbank.reservierung.count(), 1);
  assert.equal(await datenbank.belegung.count(), 0);
});

test("weist reale Belegung, zu geringe Kapazität und Standortabweichung zurück", async (t) => {
  const { datenbank } = await erstelleTestdatenbank(t);
  await assert.rejects(
    platziereWalkIn(datenbank, { ...eingabe, tischId: "tisch-2" }, beginn), WalkInKapazitaetsfehler,
  );
  await assert.rejects(
    platziereWalkIn(datenbank, { ...eingabe, tischId: "tisch-fremd" }, beginn),
    (fehler) => fehler instanceof WalkInReferenzfehler && fehler.feld === "tischId",
  );
  const vorhanden = await platziereWalkIn(datenbank, eingabe, beginn);
  await datenbank.reservierung.update({ where: { id: vorhanden.reservierung.id }, data: { status: "abgeschlossen" } });
  await assert.rejects(
    platziereWalkIn(datenbank, eingabe, new Date("2026-07-20T20:00:00.000Z")), WalkInZeitfensterfehler,
  );
  assert.equal(await datenbank.reservierung.count(), 1);
});

test("lässt bei konkurrierenden Walk-ins höchstens eine Platzierung bestehen", async (t) => {
  const { datenbank, datenbankpfad } = await erstelleTestdatenbank(t);
  const zweiteVerbindung = new PrismaClient({ datasourceUrl: `file:${datenbankpfad}` });
  t.after(() => zweiteVerbindung.$disconnect());
  const ergebnisse = await Promise.allSettled([
    platziereWalkIn(datenbank, eingabe, beginn),
    platziereWalkIn(zweiteVerbindung, eingabe, beginn),
  ]);
  assert.equal(ergebnisse.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(await datenbank.reservierung.count({ where: { typ: "walkIn" } }), 1);
  assert.equal(await datenbank.belegung.count({ where: { ende: null } }), 1);
});
