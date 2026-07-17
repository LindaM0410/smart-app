import type { PrismaClient, Prisma } from "@prisma/client";

export type BestellungEingabe = {
  standortId: string;
  tischId: string;
  reservierungId?: string | null;
  aufgenommenVonMitarbeiterId: string;
};

export class BestellungReferenzfehler extends Error {
  constructor() {
    super("Standort, Tisch, Reservierung oder Mitarbeiter ist ungültig.");
  }
}

async function pruefeStandortkontext(
  transaktion: Prisma.TransactionClient,
  eingabe: BestellungEingabe,
) {
  const [standort, tisch, mitarbeiter, reservierung] = await Promise.all([
    transaktion.standort.findFirst({ where: { id: eingabe.standortId, aktiv: true }, select: { id: true } }),
    transaktion.tisch.findFirst({ where: { id: eingabe.tischId, standortId: eingabe.standortId, aktiv: true }, select: { id: true } }),
    transaktion.mitarbeiter.findFirst({
      where: { id: eingabe.aufgenommenVonMitarbeiterId, hauptstandortId: eingabe.standortId, aktiv: true },
      select: { id: true },
    }),
    eingabe.reservierungId
      ? transaktion.reservierung.findFirst({
          where: { id: eingabe.reservierungId, standortId: eingabe.standortId },
          select: { id: true },
        })
      : Promise.resolve({ id: "ohne-reservierung" }),
  ]);

  if (!standort || !tisch || !mitarbeiter || !reservierung) throw new BestellungReferenzfehler();
}

export function erstelleBestellung(datenbank: PrismaClient, eingabe: BestellungEingabe) {
  return datenbank.$transaction(async (transaktion) => {
    await pruefeStandortkontext(transaktion, eingabe);
    return transaktion.bestellung.create({
      data: { ...eingabe, reservierungId: eingabe.reservierungId || null, status: "offen" },
    });
  });
}

export function aktualisiereBestellung(
  datenbank: PrismaClient,
  id: string,
  eingabe: BestellungEingabe,
) {
  return datenbank.$transaction(async (transaktion) => {
    const vorhanden = await transaktion.bestellung.findUnique({ where: { id }, select: { id: true } });
    if (!vorhanden) throw new BestellungReferenzfehler();
    await pruefeStandortkontext(transaktion, eingabe);
    return transaktion.bestellung.update({
      where: { id },
      data: { ...eingabe, reservierungId: eingabe.reservierungId || null },
    });
  });
}

export function ladeBestellungenFuerStandort(datenbank: PrismaClient, standortId: string) {
  return datenbank.bestellung.findMany({
    where: { standortId },
    orderBy: { erstelltAm: "desc" },
    include: {
      standort: { select: { name: true } },
      tisch: { select: { nummer: true } },
      reservierung: { select: { id: true, gast: { select: { name: true } } } },
      aufgenommenVonMitarbeiter: { select: { name: true } },
    },
  });
}
