import type { PrismaClient } from "@prisma/client";

import type { FirmenkundenkontaktEingabe } from "./firmenkundenkontakte";

export function erstelleFirmenkundenkontakt(
  datenbank: PrismaClient,
  eingabe: FirmenkundenkontaktEingabe,
) {
  return datenbank.firmenkundenkontakt.create({ data: eingabe });
}

export function aktualisiereFirmenkundenkontakt(
  datenbank: PrismaClient,
  id: string,
  eingabe: FirmenkundenkontaktEingabe,
) {
  return datenbank.firmenkundenkontakt.update({ where: { id }, data: eingabe });
}
