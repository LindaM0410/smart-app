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
        data: { bestellungId, bruttobetragCent, status: "offen" },
      });
    } catch {
      throw new RechnungNichtMoeglichFehler();
    }
  });
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
