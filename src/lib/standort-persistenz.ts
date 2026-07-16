import type { PrismaClient } from "@prisma/client";

import type { StandortEingabe } from "./standorte";

export function erstelleStandort(
  datenbank: PrismaClient,
  eingabe: StandortEingabe,
) {
  return datenbank.standort.create({ data: eingabe });
}

export function aktualisiereStandort(
  datenbank: PrismaClient,
  id: string,
  eingabe: StandortEingabe,
) {
  return datenbank.standort.update({ where: { id }, data: eingabe });
}
