import type { PrismaClient } from "@prisma/client";

import { hatArtikelValidierungsfehler, validiereArtikel, type ArtikelEingabe } from "./artikel.ts";

export class ArtikelValidierungsfehler extends Error {
  constructor() {
    super("Die Artikeldaten sind ungültig.");
  }
}

export class ArtikelangebotReferenzfehler extends Error {
  constructor() {
    super("Artikel oder Standort ist nicht aktiv oder nicht vorhanden.");
  }
}

export class GrillangebotNichtErlaubtFehler extends Error {
  constructor() {
    super("Dieser Artikel benötigt einen Grill und kann an diesem Standort nicht angeboten werden.");
  }
}

export async function erstelleArtikel(
  datenbank: PrismaClient,
  eingabe: ArtikelEingabe,
) {
  if (hatArtikelValidierungsfehler(validiereArtikel(eingabe))) {
    throw new ArtikelValidierungsfehler();
  }

  return datenbank.artikel.create({
    data: { ...eingabe, name: eingabe.name.trim(), kategorie: eingabe.kategorie.trim() },
  });
}

export async function speichereArtikel(
  datenbank: PrismaClient,
  artikelId: string | undefined,
  eingabe: ArtikelEingabe,
  standortIds: string[],
) {
  if (hatArtikelValidierungsfehler(validiereArtikel(eingabe))) {
    throw new ArtikelValidierungsfehler();
  }

  const eindeutigeStandortIds = [...new Set(standortIds)];
  if (eindeutigeStandortIds.length !== standortIds.length) {
    throw new ArtikelangebotReferenzfehler();
  }

  return datenbank.$transaction(async (transaktion) => {
    const standorte = await transaktion.standort.findMany({
      where: { id: { in: eindeutigeStandortIds }, aktiv: true },
      select: { id: true, hatGrill: true },
    });
    if (standorte.length !== eindeutigeStandortIds.length) {
      throw new ArtikelangebotReferenzfehler();
    }
    if (eingabe.benoetigtGrill && standorte.some((standort) => !standort.hatGrill)) {
      throw new GrillangebotNichtErlaubtFehler();
    }

    const wirksameStandortIds = eingabe.aktiv ? eindeutigeStandortIds : [];
    let artikel;
    if (artikelId) {
      const vorhanden = await transaktion.artikel.findUnique({ where: { id: artikelId }, select: { id: true } });
      if (!vorhanden) throw new ArtikelangebotReferenzfehler();
      await transaktion.artikelStandort.deleteMany({
        where: { artikelId, standortId: { notIn: wirksameStandortIds } },
      });
      artikel = await transaktion.artikel.update({
        where: { id: artikelId },
        data: { ...eingabe, name: eingabe.name.trim(), kategorie: eingabe.kategorie.trim() },
      });
    } else {
      artikel = await transaktion.artikel.create({
        data: { ...eingabe, name: eingabe.name.trim(), kategorie: eingabe.kategorie.trim() },
      });
    }

    for (const standortId of wirksameStandortIds) {
      await transaktion.artikelStandort.upsert({
        where: { artikelId_standortId: { artikelId: artikel.id, standortId } },
        create: { artikelId: artikel.id, standortId },
        update: {},
      });
    }
    return artikel;
  });
}

export async function ordneArtikelStandortZu(
  datenbank: PrismaClient,
  artikelId: string,
  standortId: string,
) {
  return datenbank.$transaction(async (transaktion) => {
    const [artikel, standort] = await Promise.all([
      transaktion.artikel.findFirst({
        where: { id: artikelId, aktiv: true },
        select: { benoetigtGrill: true },
      }),
      transaktion.standort.findFirst({
        where: { id: standortId, aktiv: true },
        select: { hatGrill: true },
      }),
    ]);

    if (!artikel || !standort) throw new ArtikelangebotReferenzfehler();
    if (artikel.benoetigtGrill && !standort.hatGrill) {
      throw new GrillangebotNichtErlaubtFehler();
    }

    return transaktion.artikelStandort.create({ data: { artikelId, standortId } });
  });
}

export function ladeGueltigesArtikelangebot(
  datenbank: PrismaClient,
  standortId: string,
) {
  return datenbank.artikel.findMany({
    where: {
      aktiv: true,
      standortAngebote: {
        some: { standortId, standort: { aktiv: true } },
      },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kategorie: true, preisCent: true, benoetigtGrill: true },
  });
}
