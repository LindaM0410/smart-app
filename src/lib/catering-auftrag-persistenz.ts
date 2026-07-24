import type { Prisma, PrismaClient } from "@prisma/client";

import {
  CATERING_STARTSTATUS,
  type CateringAuftragEingabe,
} from "./catering-auftraege.ts";

type Datenbank = PrismaClient | Prisma.TransactionClient;

export class CateringFirmenkontaktNichtAktivFehler extends Error {
  constructor() {
    super("Der Firmenkundenkontakt ist nicht vorhanden oder nicht aktiv.");
    this.name = "CateringFirmenkontaktNichtAktivFehler";
  }
}

async function pruefeAktivenFirmenkontakt(
  datenbank: Datenbank,
  firmenkundenkontaktId: string,
) {
  const kontakt = await datenbank.firmenkundenkontakt.findFirst({
    where: { id: firmenkundenkontaktId, aktiv: true },
    select: { id: true },
  });
  if (!kontakt) throw new CateringFirmenkontaktNichtAktivFehler();
}

export function erstelleCateringAuftrag(
  datenbank: PrismaClient,
  eingabe: CateringAuftragEingabe,
) {
  return datenbank.$transaction(async (transaktion) => {
    await pruefeAktivenFirmenkontakt(
      transaktion,
      eingabe.firmenkundenkontaktId,
    );
    return transaktion.cateringAuftrag.create({
      data: { ...eingabe, status: CATERING_STARTSTATUS },
    });
  });
}

export function aktualisiereCateringAuftrag(
  datenbank: PrismaClient,
  id: string,
  eingabe: CateringAuftragEingabe,
) {
  return datenbank.$transaction(async (transaktion) => {
    await pruefeAktivenFirmenkontakt(
      transaktion,
      eingabe.firmenkundenkontaktId,
    );
    return transaktion.cateringAuftrag.update({
      where: { id },
      data: eingabe,
    });
  });
}
