import type { PrismaClient } from "@prisma/client";

import type { MitarbeiterEingabe } from "./mitarbeiter";

async function pruefeAktivenHauptstandort(
  datenbank: PrismaClient,
  hauptstandortId: string,
) {
  const standort = await datenbank.standort.findFirst({
    where: { id: hauptstandortId, aktiv: true },
    select: { id: true },
  });

  if (!standort) throw new Error("MITARBEITER_HAUPTSTANDORT_INAKTIV");
}

export async function erstelleMitarbeiter(
  datenbank: PrismaClient,
  eingabe: MitarbeiterEingabe,
) {
  await pruefeAktivenHauptstandort(datenbank, eingabe.hauptstandortId);
  return datenbank.mitarbeiter.create({ data: eingabe });
}

export async function aktualisiereMitarbeiter(
  datenbank: PrismaClient,
  id: string,
  eingabe: MitarbeiterEingabe,
) {
  await pruefeAktivenHauptstandort(datenbank, eingabe.hauptstandortId);
  return datenbank.mitarbeiter.update({ where: { id }, data: eingabe });
}
