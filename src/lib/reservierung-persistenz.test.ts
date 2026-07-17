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
  markiereReservierungAlsNoShow,
  NoShowAusgangsstatusFehler,
  NoShowFristFehler,
  NoShowUngepruefterStatuswechselFehler,
  ReservierungKonfliktfehler,
  ReservierungReferenzfehler,
} from "./reservierung-persistenz.ts";
import { normalisiereReservierung } from "./reservierungen.ts";

const testdatenbankPfade = new WeakMap<PrismaClient, string>();

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-reservierungen-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });
  testdatenbankPfade.set(datenbank, pfad);

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
    CREATE TABLE "Tisch" (
      "id" TEXT NOT NULL PRIMARY KEY, "standortId" TEXT NOT NULL, "nummer" TEXT NOT NULL,
      "kapazitaet" INTEGER NOT NULL, "bereich" TEXT NOT NULL,
      "kombinierbar" BOOLEAN NOT NULL DEFAULT false, "aktiv" BOOLEAN NOT NULL DEFAULT true,
      FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "ReservierungTisch" (
      "reservierungId" TEXT NOT NULL, "tischId" TEXT NOT NULL,
      PRIMARY KEY ("reservierungId", "tischId"),
      FOREIGN KEY ("reservierungId") REFERENCES "Reservierung" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Belegung" (
      "id" TEXT NOT NULL PRIMARY KEY, "tischId" TEXT NOT NULL, "reservierungId" TEXT NOT NULL,
      "beginn" DATETIME NOT NULL, "ende" DATETIME,
      FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("reservierungId") REFERENCES "Reservierung" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TRIGGER "ReservierungTisch_keine_Doppelbuchung_insert"
    BEFORE INSERT ON "ReservierungTisch"
    WHEN EXISTS (
      SELECT 1 FROM "Reservierung" AS neu
      JOIN "ReservierungTisch" AS zuordnung ON zuordnung."tischId" = NEW."tischId"
      JOIN "Reservierung" AS vorhanden ON vorhanden."id" = zuordnung."reservierungId"
      WHERE neu."id" = NEW."reservierungId"
        AND neu."status" IN ('angefragt', 'bestaetigt')
        AND vorhanden."status" IN ('angefragt', 'bestaetigt')
        AND vorhanden."id" <> neu."id"
        AND vorhanden."beginn" < neu."ende"
        AND vorhanden."ende" > neu."beginn"
    ) BEGIN SELECT RAISE(ABORT, 'RESERVIERUNG_DOPPELBUCHUNG'); END
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TRIGGER "Reservierung_keine_Doppelbuchung_update"
    BEFORE UPDATE OF "beginn", "ende", "status" ON "Reservierung"
    WHEN NEW."status" IN ('angefragt', 'bestaetigt') AND EXISTS (
      SELECT 1 FROM "ReservierungTisch" AS eigeneTische
      JOIN "ReservierungTisch" AS andereTische ON andereTische."tischId" = eigeneTische."tischId"
      JOIN "Reservierung" AS vorhanden ON vorhanden."id" = andereTische."reservierungId"
      WHERE eigeneTische."reservierungId" = NEW."id"
        AND vorhanden."id" <> NEW."id"
        AND vorhanden."status" IN ('angefragt', 'bestaetigt')
        AND vorhanden."beginn" < NEW."ende"
        AND vorhanden."ende" > NEW."beginn"
    ) BEGIN SELECT RAISE(ABORT, 'RESERVIERUNG_DOPPELBUCHUNG'); END
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
  await datenbank.tisch.createMany({
    data: [
      {
        id: "tisch-1",
        standortId: "standort-aktiv",
        nummer: "K-01",
        kapazitaet: 4,
        bereich: "innen",
        kombinierbar: false,
        aktiv: true,
      },
      {
        id: "tisch-2",
        standortId: "standort-aktiv",
        nummer: "K-02",
        kapazitaet: 2,
        bereich: "innen",
        kombinierbar: false,
        aktiv: true,
      },
      {
        id: "tisch-inaktiv",
        standortId: "standort-aktiv",
        nummer: "K-03",
        kapazitaet: 2,
        bereich: "innen",
        kombinierbar: false,
        aktiv: false,
      },
    ],
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
  tischIds: ["tisch-1"],
});

test("legt eine Reservierung mit Tischen an, ersetzt und entfernt die Zuordnung", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const reservierung = await erstelleReservierung(datenbank, eingabe);
  assert.deepEqual(reservierung.tische.map(({ tischId }) => tischId), ["tisch-1"]);

  const bearbeitet = await aktualisiereReservierung(datenbank, reservierung.id, {
    ...eingabe,
    personenanzahl: 8,
    istGruppe: true,
    status: "bestaetigt",
    tischIds: ["tisch-2"],
  });

  assert.equal(bearbeitet.ende.toISOString(), "2026-07-20T19:00:00.000Z");
  assert.equal(bearbeitet.personenanzahl, 8);
  assert.equal(bearbeitet.istGruppe, true);
  assert.equal(bearbeitet.status, "bestaetigt");
  assert.deepEqual(bearbeitet.tische.map(({ tischId }) => tischId), ["tisch-2"]);

  const ohneTisch = await aktualisiereReservierung(datenbank, reservierung.id, {
    ...eingabe,
    tischIds: [],
  });
  assert.deepEqual(ohneTisch.tische, []);
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

test("weist unbekannte, inaktive und standortfremde Tische zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const andererStandort = await datenbank.standort.create({
    data: {
      id: "standort-anders",
      name: "Spandau",
      adresse: "Testweg 2",
      sitzplaetze: 50,
      hatTerrasse: false,
      hatGrill: false,
      aktiv: true,
    },
  });
  await datenbank.tisch.create({
    data: {
      id: "tisch-anders",
      standortId: andererStandort.id,
      nummer: "S-01",
      kapazitaet: 4,
      bereich: "innen",
      kombinierbar: false,
      aktiv: true,
    },
  });

  for (const tischId of ["fehlt", "tisch-inaktiv", "tisch-anders"]) {
    await assert.rejects(
      erstelleReservierung(datenbank, { ...eingabe, tischIds: [tischId] }),
      (fehler) =>
        fehler instanceof ReservierungReferenzfehler && fehler.feld === "tischIds",
    );
  }
});

test("verhindert überlappende aktive Reservierungen für denselben Tisch", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await erstelleReservierung(datenbank, eingabe);

  await assert.rejects(
    erstelleReservierung(datenbank, {
      ...eingabe,
      beginn: new Date("2026-07-20T18:00:00.000Z"),
      ende: new Date("2026-07-20T20:00:00.000Z"),
    }),
    (fehler) =>
      fehler instanceof ReservierungKonfliktfehler &&
      fehler.tischNummer === "K-01" &&
      fehler.beginn.toISOString() === "2026-07-20T17:00:00.000Z",
  );

  assert.equal(await datenbank.reservierung.count(), 1);
});

test("behandelt Zeitfenster halb-offen und weitere nicht blockierende Status korrekt", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await erstelleReservierung(datenbank, eingabe);

  await erstelleReservierung(datenbank, {
    ...eingabe,
    beginn: new Date("2026-07-20T19:00:00.000Z"),
    ende: new Date("2026-07-20T21:00:00.000Z"),
  });

  for (const status of ["storniert", "abgeschlossen"] as const) {
    await erstelleReservierung(datenbank, {
      ...eingabe,
      status,
      beginn: new Date("2026-07-20T17:30:00.000Z"),
      ende: new Date("2026-07-20T18:30:00.000Z"),
    });
  }

  assert.equal(await datenbank.reservierung.count(), 4);
});

test("prüft bei mehreren Tischen jeden Tisch und ignoriert sich beim Bearbeiten selbst", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const vorhanden = await erstelleReservierung(datenbank, eingabe);

  await aktualisiereReservierung(datenbank, vorhanden.id, {
    ...eingabe,
    status: "bestaetigt",
  });

  await assert.rejects(
    erstelleReservierung(datenbank, {
      ...eingabe,
      tischIds: ["tisch-2", "tisch-1"],
    }),
    ReservierungKonfliktfehler,
  );
  assert.equal(await datenbank.reservierung.count(), 1);
});

test("lässt bei zwei parallelen Doppelbuchungen genau eine erfolgreich speichern", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const pfad = testdatenbankPfade.get(datenbank);
  assert.ok(pfad);
  const datenbankParallel = new PrismaClient({
    datasourceUrl: `file:${pfad}`,
  });
  t.after(() => datenbankParallel.$disconnect());

  const ergebnisse = await Promise.allSettled([
    erstelleReservierung(datenbank, eingabe),
    erstelleReservierung(datenbankParallel, {
      ...eingabe,
      beginn: new Date("2026-07-20T17:30:00.000Z"),
      ende: new Date("2026-07-20T19:30:00.000Z"),
    }),
  ]);

  assert.equal(ergebnisse.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(await datenbank.reservierung.count(), 1);
});

test("markiert eine bestätigte Reservierung ab exakt 15 Minuten als No-Show", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const reservierung = await erstelleReservierung(datenbank, {
    ...eingabe,
    status: "bestaetigt",
  });

  const aktualisiert = await markiereReservierungAlsNoShow(
    datenbank,
    reservierung.id,
    new Date("2026-07-20T17:15:00.000Z"),
  );

  assert.equal(aktualisiert.status, "noShow");
});

test("weist die No-Show-Markierung vor Ablauf der 15-Minuten-Frist zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const reservierung = await erstelleReservierung(datenbank, {
    ...eingabe,
    status: "bestaetigt",
  });

  await assert.rejects(
    markiereReservierungAlsNoShow(
      datenbank,
      reservierung.id,
      new Date("2026-07-20T17:14:59.999Z"),
    ),
    (fehler) =>
      fehler instanceof NoShowFristFehler &&
      fehler.fristEnde.toISOString() === "2026-07-20T17:15:00.000Z",
  );
  assert.equal(
    (await datenbank.reservierung.findUniqueOrThrow({ where: { id: reservierung.id } })).status,
    "bestaetigt",
  );
});

test("weist andere Ausgangsstatus und den ungeprüften Bearbeitungsweg zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const angefragt = await erstelleReservierung(datenbank, eingabe);

  await assert.rejects(
    markiereReservierungAlsNoShow(
      datenbank,
      angefragt.id,
      new Date("2026-07-20T18:00:00.000Z"),
    ),
    NoShowAusgangsstatusFehler,
  );
  await assert.rejects(
    aktualisiereReservierung(datenbank, angefragt.id, { ...eingabe, status: "noShow" }),
    NoShowUngepruefterStatuswechselFehler,
  );
  await assert.rejects(
    erstelleReservierung(datenbank, { ...eingabe, status: "noShow" }),
    NoShowUngepruefterStatuswechselFehler,
  );
});

test("gibt nach der No-Show-Markierung die Planung frei und lässt reale Belegung offen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const reservierung = await erstelleReservierung(datenbank, {
    ...eingabe,
    status: "bestaetigt",
  });
  await datenbank.belegung.create({
    data: {
      id: "belegung-offen",
      tischId: "tisch-1",
      reservierungId: reservierung.id,
      beginn: new Date("2026-07-20T17:05:00.000Z"),
    },
  });

  await markiereReservierungAlsNoShow(
    datenbank,
    reservierung.id,
    new Date("2026-07-20T17:15:00.000Z"),
  );
  await erstelleReservierung(datenbank, {
    ...eingabe,
    beginn: new Date("2026-07-20T17:30:00.000Z"),
    ende: new Date("2026-07-20T18:30:00.000Z"),
  });

  const belegung = await datenbank.belegung.findUniqueOrThrow({
    where: { id: "belegung-offen" },
  });
  assert.equal(belegung.ende, null);
  assert.equal(await datenbank.reservierung.count(), 2);
});
