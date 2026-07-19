import type { PrismaClient } from "@prisma/client";

export class BestellpositionStornoFehler extends Error {
  constructor() {
    super("Diese Bestellposition kann nicht storniert werden.");
    this.name = "BestellpositionStornoFehler";
  }
}

export function storniereBestellposition(
  datenbank: PrismaClient,
  positionId: string,
  mitarbeiterId: string,
) {
  if (!positionId || !mitarbeiterId) throw new BestellpositionStornoFehler();

  return datenbank.$transaction(async (transaktion) => {
    const [position, mitarbeiter] = await Promise.all([
      transaktion.bestellposition.findUnique({
        where: { id: positionId },
        select: { status: true },
      }),
      transaktion.mitarbeiter.findFirst({
        where: { id: mitarbeiterId, aktiv: true, rolle: { in: ["manager", "inhaber"] } },
        select: { id: true },
      }),
    ]);

    if (!position || !mitarbeiter || !["offen", "inZubereitung"].includes(position.status)) {
      throw new BestellpositionStornoFehler();
    }

    try {
      return await transaktion.bestellposition.update({
        where: { id: positionId },
        data: {
          status: "storniert",
          storniertAm: new Date(),
          storniertVonMitarbeiterId: mitarbeiter.id,
        },
      });
    } catch {
      throw new BestellpositionStornoFehler();
    }
  });
}
