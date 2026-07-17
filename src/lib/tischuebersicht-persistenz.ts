import type { PrismaClient } from "@prisma/client";

import { ermittleTischstatus } from "./tischuebersicht.ts";

const BLOCKIERENDE_STATUS = ["angefragt", "bestaetigt"];
const SECHZIG_MINUTEN = 60 * 60 * 1000;

export async function ladeTischuebersicht(
  datenbank: PrismaClient,
  standortId: string,
  referenzzeit: Date,
  tagesende: Date,
) {
  const reservierungsgrenze = new Date(Math.min(
    referenzzeit.getTime() + SECHZIG_MINUTEN,
    tagesende.getTime(),
  ));

  const tische = await datenbank.tisch.findMany({
    where: { standortId, aktiv: true },
    orderBy: { nummer: "asc" },
    select: {
      id: true,
      nummer: true,
      kapazitaet: true,
      bereich: true,
      belegungen: { where: { ende: null }, select: { id: true }, take: 1 },
      reservierungen: {
        where: {
          reservierung: {
            status: { in: BLOCKIERENDE_STATUS },
            beginn: { gte: referenzzeit, lte: reservierungsgrenze, lt: tagesende },
          },
        },
        select: { reservierung: { select: { beginn: true } } },
        orderBy: { reservierung: { beginn: "asc" } },
      },
    },
  });

  return tische.map((tisch) => ({
    id: tisch.id,
    nummer: tisch.nummer,
    kapazitaet: tisch.kapazitaet,
    bereich: tisch.bereich,
    status: ermittleTischstatus({
      hatOffeneBelegung: tisch.belegungen.length > 0,
      reservierungsbeginne: tisch.reservierungen.map(({ reservierung }) => reservierung.beginn),
    }, referenzzeit),
    naechsteReservierung: tisch.reservierungen[0]?.reservierung.beginn ?? null,
  }));
}
