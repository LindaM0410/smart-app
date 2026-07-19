import type { PrismaClient } from "@prisma/client";

import { berechneBruttobetragCent } from "./bestellbetrag.ts";

export class RechnungNichtMoeglichFehler extends Error {
  constructor() {
    super("Für diese Bestellung kann keine Rechnung erzeugt werden.");
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
