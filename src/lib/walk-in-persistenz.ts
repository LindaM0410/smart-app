import { Prisma, type PrismaClient } from "@prisma/client";

import { WALK_IN_DAUER_IN_MS, type WalkInEingabe } from "./walk-ins.ts";

export class WalkInReferenzfehler extends Error {
  readonly feld: "gastId" | "standortId" | "tischId";

  constructor(feld: "gastId" | "standortId" | "tischId") {
    super(feld === "gastId" ? "Der Gast ist nicht verfügbar." :
      feld === "standortId" ? "Der Standort ist nicht verfügbar." : "Der Tisch ist nicht verfügbar.");
    this.feld = feld;
  }
}

export class WalkInKapazitaetsfehler extends Error {
  constructor() {
    super("Der Tisch hat nicht genügend Plätze für diesen Walk-in.");
  }
}

export class WalkInZeitfensterfehler extends Error {
  constructor() {
    super("Der Tisch ist in den nächsten zwei Stunden nicht ausreichend frei.");
  }
}

function istReservierungskonflikt(fehler: unknown) {
  return fehler instanceof Prisma.PrismaClientKnownRequestError &&
    fehler.message.includes("RESERVIERUNG_DOPPELBUCHUNG");
}

function istBelegungskonflikt(fehler: unknown) {
  return fehler instanceof Prisma.PrismaClientKnownRequestError &&
    (fehler.code === "P2002" || fehler.message.includes("BELEGUNG_UNGUELTIGE_ZUORDNUNG"));
}

export async function platziereWalkIn(
  datenbank: PrismaClient,
  eingabe: WalkInEingabe,
  beginn = new Date(),
) {
  const ende = new Date(beginn.getTime() + WALK_IN_DAUER_IN_MS);

  try {
    return await datenbank.$transaction(async (transaktion) => {
      const [gast, standort, tisch] = await Promise.all([
        transaktion.gast.findFirst({ where: { id: eingabe.gastId, aktiv: true }, select: { id: true } }),
        transaktion.standort.findFirst({ where: { id: eingabe.standortId, aktiv: true }, select: { id: true } }),
        transaktion.tisch.findFirst({
          where: { id: eingabe.tischId, standortId: eingabe.standortId, aktiv: true },
          select: { kapazitaet: true, belegungen: { where: { ende: null }, select: { id: true }, take: 1 } },
        }),
      ]);

      if (!gast) throw new WalkInReferenzfehler("gastId");
      if (!standort) throw new WalkInReferenzfehler("standortId");
      if (!tisch) throw new WalkInReferenzfehler("tischId");
      if (tisch.kapazitaet < eingabe.personenanzahl) throw new WalkInKapazitaetsfehler();
      if (tisch.belegungen.length > 0) throw new WalkInZeitfensterfehler();

      const konflikt = await transaktion.reservierung.findFirst({
        where: {
          status: { in: ["angefragt", "bestaetigt"] },
          beginn: { lt: ende },
          ende: { gt: beginn },
          tische: { some: { tischId: eingabe.tischId } },
        },
        select: { id: true },
      });
      if (konflikt) throw new WalkInZeitfensterfehler();

      const reservierung = await transaktion.reservierung.create({
        data: {
          gastId: eingabe.gastId,
          standortId: eingabe.standortId,
          beginn,
          ende,
          personenanzahl: eingabe.personenanzahl,
          status: "bestaetigt",
          typ: "walkIn",
          notiz: eingabe.notiz,
          istGruppe: eingabe.personenanzahl >= 8,
          erstelltVonMitarbeiterId: "walk-in-erfassung",
          tische: { create: { tischId: eingabe.tischId } },
        },
      });
      const belegung = await transaktion.belegung.create({
        data: { reservierungId: reservierung.id, tischId: eingabe.tischId, beginn },
      });
      return { reservierung, belegung };
    });
  } catch (fehler) {
    if (istReservierungskonflikt(fehler) || istBelegungskonflikt(fehler)) {
      throw new WalkInZeitfensterfehler();
    }
    throw fehler;
  }
}
