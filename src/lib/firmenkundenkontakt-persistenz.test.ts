import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  aktualisiereFirmenkundenkontakt,
  erstelleFirmenkundenkontakt,
} from "./firmenkundenkontakt-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const pfad = join(
    tmpdir(),
    `bella-vista-firmenkunden-${process.pid}-${Date.now()}-${Math.random()}.db`,
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

  return datenbank;
}

test("legt einen Firmenkundenkontakt an und deaktiviert ihn beim Bearbeiten", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const kontakt = await erstelleFirmenkundenkontakt(datenbank, {
    firmenname: "Muster GmbH",
    ansprechperson: "Ada Beispiel",
    kontaktdaten: "ada@example.de",
    notiz: "",
    aktiv: true,
  });
  const bearbeitet = await aktualisiereFirmenkundenkontakt(datenbank, kontakt.id, {
    firmenname: "Muster GmbH",
    ansprechperson: "Ada Beispiel",
    kontaktdaten: "030 123456",
    notiz: "Neue Telefonnummer",
    aktiv: false,
  });

  assert.equal(bearbeitet.kontaktdaten, "030 123456");
  assert.equal(bearbeitet.aktiv, false);
  assert.equal(await datenbank.firmenkundenkontakt.count(), 1);
});
