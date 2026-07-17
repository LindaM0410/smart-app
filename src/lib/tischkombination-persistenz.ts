import type { PrismaClient } from "@prisma/client";

import {
  normalisiereTischIds,
  tischKombinationsSchluessel,
  type TischKombinationEingabe,
} from "./tischkombinationen.ts";

export async function erstelleTischKombination(
  datenbank: PrismaClient,
  eingabe: TischKombinationEingabe,
) {
  const tischIds = normalisiereTischIds(eingabe.tischIds);

  return datenbank.$transaction(async (transaktion) => {
    const tische = await transaktion.tisch.findMany({
      where: { id: { in: tischIds } },
      select: { id: true, standortId: true, aktiv: true, kombinierbar: true },
    });

    if (
      tische.length !== tischIds.length ||
      tische.some(
        (tisch) =>
          tisch.standortId !== eingabe.standortId || !tisch.aktiv || !tisch.kombinierbar,
      )
    ) {
      throw new Error("TISCHKOMBINATION_UNGUELTIGE_TISCHE");
    }

    return transaktion.tischKombination.create({
      data: {
        standortId: eingabe.standortId,
        schluessel: tischKombinationsSchluessel(tischIds),
        tische: { create: tischIds.map((tischId) => ({ tischId })) },
      },
      include: { tische: true },
    });
  });
}

export function entferneTischKombination(datenbank: PrismaClient, id: string) {
  return datenbank.tischKombination.delete({ where: { id } });
}
