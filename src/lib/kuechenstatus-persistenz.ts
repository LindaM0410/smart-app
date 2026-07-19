import type { PrismaClient } from "@prisma/client";

export const KUECHENSTATUS = ["offen", "inZubereitung", "serviert"] as const;
export type Kuechenstatus = (typeof KUECHENSTATUS)[number];

const naechsterStatus: Partial<Record<Kuechenstatus, Kuechenstatus>> = {
  offen: "inZubereitung",
  inZubereitung: "serviert",
};

export class KuechenstatusUebergangsfehler extends Error {
  constructor() {
    super("Dieser Küchenstatuswechsel ist nicht erlaubt.");
    this.name = "KuechenstatusUebergangsfehler";
  }
}

export function ladeKuechenpositionen(datenbank: PrismaClient) {
  return datenbank.bestellposition.findMany({
    where: { status: { in: ["offen", "inZubereitung"] } },
    orderBy: [{ bestellung: { erstelltAm: "asc" } }, { id: "asc" }],
    select: {
      id: true,
      menge: true,
      sonderwunsch: true,
      status: true,
      artikel: { select: { name: true } },
      bestellung: {
        select: {
          tisch: { select: { nummer: true } },
          standort: { select: { name: true } },
        },
      },
    },
  });
}

export async function aktualisiereKuechenstatus(
  datenbank: PrismaClient,
  positionId: string,
  zielstatus: string,
) {
  if (!positionId || !KUECHENSTATUS.includes(zielstatus as Kuechenstatus)) {
    throw new KuechenstatusUebergangsfehler();
  }

  return datenbank.$transaction(async (transaktion) => {
    const position = await transaktion.bestellposition.findUnique({
      where: { id: positionId },
      select: { status: true },
    });
    if (!position || naechsterStatus[position.status as Kuechenstatus] !== zielstatus) {
      throw new KuechenstatusUebergangsfehler();
    }

    try {
      return await transaktion.bestellposition.update({
        where: { id: positionId },
        data: { status: zielstatus },
      });
    } catch {
      throw new KuechenstatusUebergangsfehler();
    }
  });
}
