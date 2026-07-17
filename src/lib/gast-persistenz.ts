import type { PrismaClient } from "@prisma/client";

import type { GastEingabe } from "./gaeste";

export function erstelleGast(datenbank: PrismaClient, eingabe: GastEingabe) {
  return datenbank.gast.create({ data: eingabe });
}

export function aktualisiereGast(
  datenbank: PrismaClient,
  id: string,
  eingabe: GastEingabe,
) {
  return datenbank.gast.update({ where: { id }, data: eingabe });
}
