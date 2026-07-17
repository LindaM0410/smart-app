import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  BelegungNichtOffenFehler,
  BelegungReferenzfehler,
  gibTischFrei,
  platziereReservierung,
  TischBereitsBelegtFehler,
} from "./belegung-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-belegung-"));
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

  await datenbank.standort.create({
    data: { id: "standort-1", name: "Kreuzberg", adresse: "Test", sitzplaetze: 80, hatTerrasse: true, hatGrill: true },
  });
  await datenbank.gast.create({
    data: { id: "gast-1", name: "Testgast", telefon: "", notiz: "" },
  });
  await datenbank.tisch.create({
    data: { id: "tisch-1", standortId: "standort-1", nummer: "K-01", kapazitaet: 4, bereich: "innen" },
  });
  await datenbank.tisch.create({
    data: { id: "tisch-2", standortId: "standort-1", nummer: "K-02", kapazitaet: 4, bereich: "innen" },
  });
  await datenbank.reservierung.create({
    data: {
      id: "reservierung-1", gastId: "gast-1", standortId: "standort-1",
      beginn: new Date("2026-07-20T17:00:00.000Z"), ende: new Date("2026-07-20T19:00:00.000Z"),
      personenanzahl: 4, status: "bestaetigt", notiz: "", erstelltVonMitarbeiterId: "mitarbeiter-1",
      tische: { create: { tischId: "tisch-1" } },
    },
  });
  return datenbank;
}

test("platziert eine Reservierung nur am zugeordneten aktiven Tisch", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const beginn = new Date("2026-07-20T17:12:00.000Z");
  const belegung = await platziereReservierung(db, "reservierung-1", "tisch-1", beginn);
  assert.equal(belegung.beginn.toISOString(), beginn.toISOString());
  assert.equal(belegung.ende, null);

  await assert.rejects(
    platziereReservierung(db, "reservierung-1", "tisch-2", beginn),
    BelegungReferenzfehler,
  );
});

test("verhindert zwei offene Belegungen desselben Tisches", async (t) => {
  const db = await erstelleTestdatenbank(t);
  await platziereReservierung(db, "reservierung-1", "tisch-1");
  await assert.rejects(
    platziereReservierung(db, "reservierung-1", "tisch-1"),
    TischBereitsBelegtFehler,
  );
  assert.equal(await db.belegung.count({ where: { ende: null } }), 1);
});

test("gibt eine offene Belegung explizit frei und erhält die Historie", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const belegung = await platziereReservierung(
    db, "reservierung-1", "tisch-1", new Date("2026-07-20T17:10:00.000Z"),
  );
  const ende = new Date("2026-07-20T19:35:00.000Z");
  const beendet = await gibTischFrei(db, belegung.id, ende);
  assert.equal(beendet.ende?.toISOString(), ende.toISOString());
  assert.equal(await db.belegung.count(), 1);
  await assert.rejects(gibTischFrei(db, belegung.id, ende), BelegungNichtOffenFehler);
});

test("beendet eine Belegung weder am Planungsende noch durch Reservierungsstatus", async (t) => {
  const db = await erstelleTestdatenbank(t);
  const belegung = await platziereReservierung(db, "reservierung-1", "tisch-1");
  await db.reservierung.update({ where: { id: "reservierung-1" }, data: { status: "abgeschlossen" } });
  const weiterhinOffen = await db.belegung.findUniqueOrThrow({ where: { id: belegung.id } });
  assert.equal(weiterhinOffen.ende, null);
});
