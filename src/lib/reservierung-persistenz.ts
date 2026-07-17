import type { PrismaClient } from "@prisma/client";

import type { NormalisierteReservierungEingabe } from "./reservierungen";

export class ReservierungReferenzfehler extends Error {
  readonly feld: "gastId" | "standortId" | "tischIds";

  constructor(feld: "gastId" | "standortId" | "tischIds") {
    super(
      feld === "gastId"
        ? "Gast ist nicht verfügbar."
        : feld === "standortId"
          ? "Standort ist nicht verfügbar."
          : "Mindestens ein Tisch ist nicht verfügbar.",
    );
    this.feld = feld;
  }
}

async function pruefeAktiveReferenzen(
  datenbank: PrismaClient,
  eingabe: NormalisierteReservierungEingabe,
) {
  const [gast, standort, tische] = await Promise.all([
    datenbank.gast.findFirst({ where: { id: eingabe.gastId, aktiv: true }, select: { id: true } }),
    datenbank.standort.findFirst({
      where: { id: eingabe.standortId, aktiv: true },
      select: { id: true },
    }),
    datenbank.tisch.findMany({
      where: {
        id: { in: eingabe.tischIds },
        standortId: eingabe.standortId,
        aktiv: true,
      },
      select: { id: true },
    }),
  ]);

  if (!gast) throw new ReservierungReferenzfehler("gastId");
  if (!standort) throw new ReservierungReferenzfehler("standortId");
  if (tische.length !== eingabe.tischIds.length) {
    throw new ReservierungReferenzfehler("tischIds");
  }
}

function reservierungsdaten(eingabe: NormalisierteReservierungEingabe) {
  const { tischIds, ...daten } = eingabe;
  return {
    ...daten,
    tische: { create: tischIds.map((tischId) => ({ tischId })) },
  };
}

export async function erstelleReservierung(
  datenbank: PrismaClient,
  eingabe: NormalisierteReservierungEingabe,
) {
  await pruefeAktiveReferenzen(datenbank, eingabe);
  return datenbank.reservierung.create({
    data: reservierungsdaten(eingabe),
    include: { tische: true },
  });
}

export async function aktualisiereReservierung(
  datenbank: PrismaClient,
  id: string,
  eingabe: NormalisierteReservierungEingabe,
) {
  await pruefeAktiveReferenzen(datenbank, eingabe);
  const { tischIds, ...daten } = eingabe;
  return datenbank.reservierung.update({
    where: { id },
    data: {
      ...daten,
      tische: {
        deleteMany: {},
        create: tischIds.map((tischId) => ({ tischId })),
      },
    },
    include: { tische: true },
  });
}
