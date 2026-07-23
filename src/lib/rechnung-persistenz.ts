import type { PrismaClient } from "@prisma/client";

import { berechneBruttobetragCent } from "./bestellbetrag.ts";

export class RechnungNichtMoeglichFehler extends Error {
  constructor() {
    super("Für diese Bestellung kann keine Rechnung erzeugt werden.");
  }
}

export type Zahlungsart = "bar" | "karte";

export class RechnungZahlungNichtMoeglichFehler extends Error {
  constructor() {
    super("Die Rechnung kann nicht als bezahlt markiert werden.");
  }
}

export class BellaCardRabattNichtMoeglichFehler extends Error {
  constructor() {
    super("Der Bella-Card-Rabatt kann nicht angewendet werden.");
  }
}

export function berechneBellaCardRabattCent(bruttobetragCent: number) {
  if (!Number.isSafeInteger(bruttobetragCent) || bruttobetragCent < 0) {
    throw new BellaCardRabattNichtMoeglichFehler();
  }
  const volleEuro = Math.floor(bruttobetragCent / 100);
  const restCent = bruttobetragCent % 100;
  const rabattbetragCent = volleEuro * 15 + Math.floor((restCent * 15 + 50) / 100);
  if (!Number.isSafeInteger(rabattbetragCent)) throw new BellaCardRabattNichtMoeglichFehler();
  return rabattbetragCent;
}

export function erstelleRechnung(datenbank: PrismaClient, bestellungId: string) {
  return datenbank.$transaction(async (transaktion) => {
    const bestellung = await transaktion.bestellung.findUnique({
      where: { id: bestellungId },
      select: {
        rechnung: { select: { id: true } },
        positionen: {
          select: { menge: true, einzelpreisCent: true, status: true },
        },
      },
    });

    if (!bestellung || bestellung.rechnung) throw new RechnungNichtMoeglichFehler();

    const berechenbarePositionen = bestellung.positionen.filter(
      (position) => position.status !== "storniert",
    );
    if (berechenbarePositionen.length === 0) throw new RechnungNichtMoeglichFehler();

    const bruttobetragCent = berechneBruttobetragCent(bestellung.positionen);

    try {
      return await transaktion.rechnung.create({
        data: {
          bestellungId,
          bruttobetragCent,
          rabattbetragCent: 0,
          endbetragCent: bruttobetragCent,
          status: "offen",
        },
      });
    } catch {
      throw new RechnungNichtMoeglichFehler();
    }
  });
}

export function wendeBellaCardRabattAn(
  datenbank: PrismaClient,
  rechnungId: string,
  freigegebenVonMitarbeiterId: string,
) {
  if (!rechnungId || !freigegebenVonMitarbeiterId) {
    throw new BellaCardRabattNichtMoeglichFehler();
  }

  return datenbank.$transaction(async (transaktion) => {
    const [rechnung, freigebender] = await Promise.all([
      transaktion.rechnung.findFirst({
        where: {
          id: rechnungId,
          status: "offen",
          rabattFreigegebenVonMitarbeiterId: null,
        },
        select: {
          bruttobetragCent: true,
          zahler: { select: { id: true, aktiv: true, hatBellaCard: true } },
        },
      }),
      transaktion.mitarbeiter.findFirst({
        where: {
          id: freigegebenVonMitarbeiterId,
          aktiv: true,
          rolle: { in: ["inhaber", "manager"] },
        },
        select: { id: true },
      }),
    ]);
    if (!rechnung?.zahler?.aktiv || !rechnung.zahler.hatBellaCard || !freigebender) {
      throw new BellaCardRabattNichtMoeglichFehler();
    }

    const rabattbetragCent = berechneBellaCardRabattCent(rechnung.bruttobetragCent);
    try {
      return await transaktion.rechnung.update({
        where: { id: rechnungId },
        data: {
          rabattbetragCent,
          endbetragCent: rechnung.bruttobetragCent - rabattbetragCent,
          rabattFreigegebenVonMitarbeiterId: freigegebenVonMitarbeiterId,
        },
      });
    } catch {
      throw new BellaCardRabattNichtMoeglichFehler();
    }
  });
}

export async function waehleRechnungszahler(
  datenbank: PrismaClient,
  rechnungId: string,
  zahlerGastId: string,
) {
  if (!rechnungId || !zahlerGastId) throw new BellaCardRabattNichtMoeglichFehler();
  const zahler = await datenbank.gast.findFirst({
    where: { id: zahlerGastId, aktiv: true },
    select: { id: true },
  });
  if (!zahler) throw new BellaCardRabattNichtMoeglichFehler();

  try {
    const ergebnis = await datenbank.rechnung.updateMany({
      where: {
        id: rechnungId,
        status: "offen",
        rabattFreigegebenVonMitarbeiterId: null,
      },
      data: { zahlerGastId },
    });
    if (ergebnis.count !== 1) throw new BellaCardRabattNichtMoeglichFehler();
    return datenbank.rechnung.findUniqueOrThrow({ where: { id: rechnungId } });
  } catch (error) {
    if (error instanceof BellaCardRabattNichtMoeglichFehler) throw error;
    throw new BellaCardRabattNichtMoeglichFehler();
  }
}

export async function markiereRechnungAlsBezahlt(
  datenbank: PrismaClient,
  rechnungId: string,
  zahlungsart: Zahlungsart,
  bezahltAm = new Date(),
) {
  if (!rechnungId || !["bar", "karte"].includes(zahlungsart)) {
    throw new RechnungZahlungNichtMoeglichFehler();
  }

  try {
    const ergebnis = await datenbank.rechnung.updateMany({
      where: { id: rechnungId, status: "offen", zahlungsart: null, bezahltAm: null },
      data: { status: "bezahlt", zahlungsart, bezahltAm },
    });
    if (ergebnis.count !== 1) throw new RechnungZahlungNichtMoeglichFehler();
    return datenbank.rechnung.findUniqueOrThrow({ where: { id: rechnungId } });
  } catch (error) {
    if (error instanceof RechnungZahlungNichtMoeglichFehler) throw error;
    throw new RechnungZahlungNichtMoeglichFehler();
  }
}
