import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereCateringAuftrag,
  CateringFirmenkontaktNichtAktivFehler,
  erstelleCateringAuftrag,
} from "./catering-auftrag-persistenz.ts";
import { parseCateringDatum } from "./catering-auftraege.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-catering-${process.pid}-${Date.now()}-${Math.random()}.db`,
  );
  const datenbank = new PrismaClient({ datasourceUrl: `file:${pfad}` });

  t.after(async () => {
    await datenbank.$disconnect();
    await rm(pfad, { force: true });
  });

  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "Firmenkundenkontakt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "firmenname" TEXT NOT NULL,
      "ansprechperson" TEXT NOT NULL,
      "kontaktdaten" TEXT NOT NULL,
      "notiz" TEXT NOT NULL,
      "aktiv" BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await datenbank.$executeRawUnsafe(`
    CREATE TABLE "CateringAuftrag" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "firmenkundenkontaktId" TEXT NOT NULL,
      "lieferadresse" TEXT NOT NULL,
      "datum" DATETIME NOT NULL,
      "uhrzeit" TEXT NOT NULL,
      "personenanzahl" INTEGER NOT NULL,
      "menueBeschreibung" TEXT NOT NULL,
      "preisGesamtCent" INTEGER NOT NULL,
      "notiz" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'angefragt',
      CONSTRAINT "CateringAuftrag_firmenkundenkontaktId_fkey"
        FOREIGN KEY ("firmenkundenkontaktId")
        REFERENCES "Firmenkundenkontakt" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `);

  await datenbank.firmenkundenkontakt.create({
    data: {
      id: "kontakt-aktiv",
      firmenname: "Muster GmbH",
      ansprechperson: "Ada Beispiel",
      kontaktdaten: "ada@example.de",
      notiz: "",
      aktiv: true,
    },
  });
  await datenbank.firmenkundenkontakt.create({
    data: {
      id: "kontakt-inaktiv",
      firmenname: "Alt GmbH",
      ansprechperson: "Max Alt",
      kontaktdaten: "max@example.de",
      notiz: "",
      aktiv: false,
    },
  });

  return datenbank;
}

const eingabe = {
  firmenkundenkontaktId: "kontakt-aktiv",
  lieferadresse: "Musterstraße 1, 10115 Berlin",
  datum: parseCateringDatum("2026-08-15"),
  uhrzeit: "18:30",
  personenanzahl: 25,
  menueBeschreibung: "Antipasti und Pasta",
  preisGesamtCent: 125000,
  notiz: "",
};

test("legt einen Auftrag verknüpft und mit festem Startstatus angefragt an", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const auftrag = await erstelleCateringAuftrag(datenbank, eingabe);
  const gespeichert = await datenbank.cateringAuftrag.findUniqueOrThrow({
    where: { id: auftrag.id },
    include: { firmenkundenkontakt: true },
  });

  assert.equal(gespeichert.status, "angefragt");
  assert.equal(gespeichert.firmenkundenkontakt.firmenname, "Muster GmbH");
  assert.equal(gespeichert.preisGesamtCent, 125000);
});

test("bearbeitet Auftragsdaten, ohne den Status zu verändern", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const auftrag = await erstelleCateringAuftrag(datenbank, eingabe);
  const bearbeitet = await aktualisiereCateringAuftrag(
    datenbank,
    auftrag.id,
    {
      ...eingabe,
      personenanzahl: 30,
      notiz: "Zufahrt über den Hof",
    },
  );

  assert.equal(bearbeitet.personenanzahl, 30);
  assert.equal(bearbeitet.notiz, "Zufahrt über den Hof");
  assert.equal(bearbeitet.status, "angefragt");
  assert.equal(await datenbank.cateringAuftrag.count(), 1);
});

test("weist einen inaktiven oder fehlenden Firmenkundenkontakt ab", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);

  await assert.rejects(
    erstelleCateringAuftrag(datenbank, {
      ...eingabe,
      firmenkundenkontaktId: "kontakt-inaktiv",
    }),
    CateringFirmenkontaktNichtAktivFehler,
  );
  await assert.rejects(
    erstelleCateringAuftrag(datenbank, {
      ...eingabe,
      firmenkundenkontaktId: "fehlt",
    }),
    CateringFirmenkontaktNichtAktivFehler,
  );
  assert.equal(await datenbank.cateringAuftrag.count(), 0);
});
