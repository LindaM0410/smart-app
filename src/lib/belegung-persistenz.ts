import { Prisma, type PrismaClient } from "@prisma/client";

export class BelegungReferenzfehler extends Error {
  constructor() {
    super("Der Tisch ist dieser Reservierung nicht aktiv zugeordnet.");
  }
}

export class TischBereitsBelegtFehler extends Error {
  constructor() {
    super("Der Tisch ist bereits real belegt.");
  }
}

export class BelegungNichtOffenFehler extends Error {
  constructor() {
    super("Die Belegung ist nicht vorhanden oder bereits beendet.");
  }
}

function istEindeutigkeitsfehler(fehler: unknown) {
  return fehler instanceof Prisma.PrismaClientKnownRequestError && fehler.code === "P2002";
}

function istUngueltigeZuordnung(fehler: unknown) {
  return fehler instanceof Prisma.PrismaClientKnownRequestError &&
    fehler.message.includes("BELEGUNG_UNGUELTIGE_ZUORDNUNG");
}

export async function platziereReservierung(
  datenbank: PrismaClient,
  reservierungId: string,
  tischId: string,
  beginn = new Date(),
) {
  const zuordnung = await datenbank.reservierungTisch.findFirst({
    where: {
      reservierungId,
      tischId,
      tisch: { aktiv: true },
    },
    select: { tischId: true },
  });

  if (!zuordnung) throw new BelegungReferenzfehler();

  try {
    return await datenbank.belegung.create({
      data: { reservierungId, tischId, beginn },
    });
  } catch (fehler) {
    if (istEindeutigkeitsfehler(fehler)) throw new TischBereitsBelegtFehler();
    if (istUngueltigeZuordnung(fehler)) throw new BelegungReferenzfehler();
    throw fehler;
  }
}

export async function gibTischFrei(
  datenbank: PrismaClient,
  belegungId: string,
  ende = new Date(),
) {
  const ergebnis = await datenbank.belegung.updateMany({
    where: { id: belegungId, ende: null, beginn: { lte: ende } },
    data: { ende },
  });

  if (ergebnis.count !== 1) throw new BelegungNichtOffenFehler();
  return datenbank.belegung.findUniqueOrThrow({ where: { id: belegungId } });
}
