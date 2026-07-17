import type { PrismaClient } from "@prisma/client";

import type { NormalisierteReservierungEingabe } from "./reservierungen";

export class ReservierungReferenzfehler extends Error {
  readonly feld: "gastId" | "standortId";

  constructor(feld: "gastId" | "standortId") {
    super(feld === "gastId" ? "Gast ist nicht verfügbar." : "Standort ist nicht verfügbar.");
    this.feld = feld;
  }
}

async function pruefeAktiveReferenzen(
  datenbank: PrismaClient,
  eingabe: NormalisierteReservierungEingabe,
) {
  const [gast, standort] = await Promise.all([
    datenbank.gast.findFirst({ where: { id: eingabe.gastId, aktiv: true }, select: { id: true } }),
    datenbank.standort.findFirst({
      where: { id: eingabe.standortId, aktiv: true },
      select: { id: true },
    }),
  ]);

  if (!gast) throw new ReservierungReferenzfehler("gastId");
  if (!standort) throw new ReservierungReferenzfehler("standortId");
}

export async function erstelleReservierung(
  datenbank: PrismaClient,
  eingabe: NormalisierteReservierungEingabe,
) {
  await pruefeAktiveReferenzen(datenbank, eingabe);
  return datenbank.reservierung.create({ data: eingabe });
}

export async function aktualisiereReservierung(
  datenbank: PrismaClient,
  id: string,
  eingabe: NormalisierteReservierungEingabe,
) {
  await pruefeAktiveReferenzen(datenbank, eingabe);
  return datenbank.reservierung.update({ where: { id }, data: eingabe });
}
