import type { PrismaClient } from "@prisma/client";

import type { TischEingabe } from "./tische";

export function erstelleTisch(datenbank: PrismaClient, eingabe: TischEingabe) {
  return datenbank.tisch.create({ data: eingabe });
}

export function aktualisiereTisch(
  datenbank: PrismaClient,
  id: string,
  eingabe: TischEingabe,
) {
  return datenbank.tisch.update({ where: { id }, data: eingabe });
}
