import type { Prisma, PrismaClient } from "@prisma/client";

import {
  hatBestellpositionValidierungsfehler,
  validiereBestellposition,
  type BestellpositionEingabe,
} from "./bestellpositionen.ts";

export type NeueBestellpositionEingabe = BestellpositionEingabe & {
  bestellungId: string;
  artikelId: string;
};

export class BestellpositionValidierungsfehler extends Error {
  constructor() {
    super("Die Bestellposition ist ungültig.");
  }
}

export class BestellpositionReferenzfehler extends Error {
  constructor() {
    super("Bestellung oder Artikel ist ungültig.");
  }
}

async function ladeGueltigenKontext(
  transaktion: Prisma.TransactionClient,
  bestellungId: string,
  artikelId: string,
) {
  const bestellung = await transaktion.bestellung.findFirst({
    where: { id: bestellungId, status: "offen" },
    select: { standortId: true },
  });
  if (!bestellung) throw new BestellpositionReferenzfehler();

  const artikel = await transaktion.artikel.findFirst({
    where: {
      id: artikelId,
      aktiv: true,
      standortAngebote: { some: { standortId: bestellung.standortId, standort: { aktiv: true } } },
    },
    select: { id: true, preisCent: true },
  });
  if (!artikel) throw new BestellpositionReferenzfehler();
  return artikel;
}

export function erstelleBestellposition(datenbank: PrismaClient, eingabe: NeueBestellpositionEingabe) {
  if (hatBestellpositionValidierungsfehler(validiereBestellposition(eingabe))) {
    throw new BestellpositionValidierungsfehler();
  }

  return datenbank.$transaction(async (transaktion) => {
    const artikel = await ladeGueltigenKontext(transaktion, eingabe.bestellungId, eingabe.artikelId);
    return transaktion.bestellposition.create({
      data: {
        bestellungId: eingabe.bestellungId,
        artikelId: artikel.id,
        menge: eingabe.menge,
        einzelpreisCent: artikel.preisCent,
        sonderwunsch: eingabe.sonderwunsch.trim(),
        status: "offen",
      },
    });
  });
}

export function aktualisiereBestellposition(
  datenbank: PrismaClient,
  id: string,
  eingabe: BestellpositionEingabe,
) {
  if (hatBestellpositionValidierungsfehler(validiereBestellposition(eingabe))) {
    throw new BestellpositionValidierungsfehler();
  }

  return datenbank.$transaction(async (transaktion) => {
    const position = await transaktion.bestellposition.findUnique({
      where: { id }, select: { bestellungId: true, artikelId: true },
    });
    if (!position) throw new BestellpositionReferenzfehler();
    await ladeGueltigenKontext(transaktion, position.bestellungId, position.artikelId);
    return transaktion.bestellposition.update({
      where: { id },
      data: { menge: eingabe.menge, sonderwunsch: eingabe.sonderwunsch.trim() },
    });
  });
}
