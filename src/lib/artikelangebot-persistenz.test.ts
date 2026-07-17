import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";

import { PrismaClient } from "@prisma/client";

import {
  ArtikelangebotReferenzfehler,
  erstelleArtikel,
  GrillangebotNichtErlaubtFehler,
  ladeGueltigesArtikelangebot,
  ordneArtikelStandortZu,
  speichereArtikel,
} from "./artikelangebot-persistenz.ts";

async function erstelleTestdatenbank(t: TestContext) {
  const verzeichnis = await mkdtemp(path.join(tmpdir(), "bella-vista-artikelangebot-"));
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
    { id: "inaktiv", name: "Alt", adresse: "Test", sitzplaetze: 1, hatTerrasse: false, hatGrill: true, aktiv: false },
  ] });
  return datenbank;
}

test("ordnet Nicht-Grillartikel beiden aktiven Standorten zu und liest getrennte Angebote", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const pasta = await erstelleArtikel(datenbank, {
    name: "Pasta", kategorie: "Pasta", preisCent: 1290, benoetigtGrill: false, aktiv: true,
  });

  await ordneArtikelStandortZu(datenbank, pasta.id, "kreuzberg");
  await ordneArtikelStandortZu(datenbank, pasta.id, "spandau");

  assert.deepEqual((await ladeGueltigesArtikelangebot(datenbank, "kreuzberg")).map(({ name }) => name), ["Pasta"]);
  assert.deepEqual((await ladeGueltigesArtikelangebot(datenbank, "spandau")).map(({ name }) => name), ["Pasta"]);
});

test("erlaubt Grillartikel nur an einem Standort mit Grill", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const grillteller = await erstelleArtikel(datenbank, {
    name: "Grillteller", kategorie: "Hauptgericht", preisCent: 1890, benoetigtGrill: true, aktiv: true,
  });

  await ordneArtikelStandortZu(datenbank, grillteller.id, "kreuzberg");
  await assert.rejects(
    ordneArtikelStandortZu(datenbank, grillteller.id, "spandau"),
    GrillangebotNichtErlaubtFehler,
  );
});

test("weist inaktive und unbekannte Referenzen serverseitig zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const artikel = await erstelleArtikel(datenbank, {
    name: "Tiramisu", kategorie: "Dessert", preisCent: 790, benoetigtGrill: false, aktiv: false,
  });

  await assert.rejects(
    ordneArtikelStandortZu(datenbank, artikel.id, "kreuzberg"),
    ArtikelangebotReferenzfehler,
  );
  await assert.rejects(
    ordneArtikelStandortZu(datenbank, "unbekannt", "kreuzberg"),
    ArtikelangebotReferenzfehler,
  );
  await assert.rejects(
    ordneArtikelStandortZu(datenbank, artikel.id, "inaktiv"),
    ArtikelangebotReferenzfehler,
  );
});

test("Datenbank verhindert direkte ungültige und doppelte Zuordnungen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const grillteller = await erstelleArtikel(datenbank, {
    name: "Grillteller", kategorie: "Hauptgericht", preisCent: 1890, benoetigtGrill: true, aktiv: true,
  });

  await assert.rejects(datenbank.artikelStandort.create({
    data: { artikelId: grillteller.id, standortId: "spandau" },
  }));
  await datenbank.artikelStandort.create({
    data: { artikelId: grillteller.id, standortId: "kreuzberg" },
  });
  await assert.rejects(datenbank.artikelStandort.create({
    data: { artikelId: grillteller.id, standortId: "kreuzberg" },
  }));
});

test("Datenbank bewahrt die Grill- und Aktivitätsregel bei späteren Änderungen", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const pasta = await erstelleArtikel(datenbank, {
    name: "Pasta", kategorie: "Pasta", preisCent: 1290, benoetigtGrill: false, aktiv: true,
  });
  await ordneArtikelStandortZu(datenbank, pasta.id, "spandau");

  await assert.rejects(datenbank.artikel.update({
    where: { id: pasta.id }, data: { benoetigtGrill: true },
  }));
  await assert.rejects(datenbank.artikel.update({
    where: { id: pasta.id }, data: { aktiv: false },
  }));

  const grillteller = await erstelleArtikel(datenbank, {
    name: "Grillteller", kategorie: "Hauptgericht", preisCent: 1890, benoetigtGrill: true, aktiv: true,
  });
  await ordneArtikelStandortZu(datenbank, grillteller.id, "kreuzberg");
  await assert.rejects(datenbank.standort.update({
    where: { id: "kreuzberg" }, data: { hatGrill: false },
  }));
});

test("legt Artikel mit Kategorie und gültigen Standortfreigaben atomar an", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const artikel = await speichereArtikel(datenbank, undefined, {
    name: "  Bruschetta ", kategorie: "  Vorspeise ", preisCent: 650, benoetigtGrill: false, aktiv: true,
  }, ["kreuzberg", "spandau"]);

  const gespeichert = await datenbank.artikel.findUniqueOrThrow({
    where: { id: artikel.id }, include: { standortAngebote: true },
  });
  assert.equal(gespeichert.name, "Bruschetta");
  assert.equal(gespeichert.kategorie, "Vorspeise");
  assert.deepEqual(gespeichert.standortAngebote.map(({ standortId }) => standortId).sort(), ["kreuzberg", "spandau"]);
});

test("bearbeitet Freigaben und entfernt sie beim Deaktivieren", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  const artikel = await speichereArtikel(datenbank, undefined, {
    name: "Pasta", kategorie: "Pasta", preisCent: 1290, benoetigtGrill: false, aktiv: true,
  }, ["kreuzberg", "spandau"]);

  await speichereArtikel(datenbank, artikel.id, {
    name: "Pasta al Pomodoro", kategorie: "Hauptgericht", preisCent: 1390, benoetigtGrill: false, aktiv: true,
  }, ["kreuzberg"]);
  assert.deepEqual((await datenbank.artikelStandort.findMany({ where: { artikelId: artikel.id } })).map(({ standortId }) => standortId), ["kreuzberg"]);

  await speichereArtikel(datenbank, artikel.id, {
    name: "Pasta al Pomodoro", kategorie: "Hauptgericht", preisCent: 1390, benoetigtGrill: false, aktiv: false,
  }, ["kreuzberg"]);
  assert.equal((await datenbank.artikel.findUniqueOrThrow({ where: { id: artikel.id } })).aktiv, false);
  assert.equal(await datenbank.artikelStandort.count({ where: { artikelId: artikel.id } }), 0);
});

test("weist inaktive Standorte und Grillfreigaben zurück und rollt Änderungen zurück", async (t) => {
  const datenbank = await erstelleTestdatenbank(t);
  await assert.rejects(speichereArtikel(datenbank, undefined, {
    name: "Grillteller", kategorie: "Hauptgericht", preisCent: 1890, benoetigtGrill: true, aktiv: true,
  }, ["spandau"]), GrillangebotNichtErlaubtFehler);
  await assert.rejects(speichereArtikel(datenbank, undefined, {
    name: "Suppe", kategorie: "Vorspeise", preisCent: 590, benoetigtGrill: false, aktiv: true,
  }, ["inaktiv"]), ArtikelangebotReferenzfehler);
  assert.equal(await datenbank.artikel.count(), 0);
});
