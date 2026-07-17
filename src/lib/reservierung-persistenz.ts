import { Prisma, type PrismaClient } from "@prisma/client";

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

export class ReservierungKonfliktfehler extends Error {
  readonly tischNummer: string;
  readonly beginn: Date;
  readonly ende: Date;

  constructor(tischNummer: string, beginn: Date, ende: Date) {
    super(
      `Tisch ${tischNummer} ist bereits von ${beginn.toLocaleString("de-DE")} bis ${ende.toLocaleString("de-DE")} reserviert.`,
    );
    this.tischNummer = tischNummer;
    this.beginn = beginn;
    this.ende = ende;
  }
}

const BLOCKIERENDE_STATUS = ["angefragt", "bestaetigt"];

type Datenbank = PrismaClient | Prisma.TransactionClient;

async function pruefeAktiveReferenzen(
  datenbank: Datenbank,
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

async function findeKonflikt(
  datenbank: Datenbank,
  eingabe: NormalisierteReservierungEingabe,
  eigeneReservierungId?: string,
) {
  if (
    !BLOCKIERENDE_STATUS.includes(eingabe.status) ||
    eingabe.tischIds.length === 0
  ) {
    return null;
  }

  return datenbank.reservierung.findFirst({
    where: {
      id: eigeneReservierungId ? { not: eigeneReservierungId } : undefined,
      status: { in: BLOCKIERENDE_STATUS },
      beginn: { lt: eingabe.ende },
      ende: { gt: eingabe.beginn },
      tische: { some: { tischId: { in: eingabe.tischIds } } },
    },
    orderBy: { beginn: "asc" },
    select: {
      beginn: true,
      ende: true,
      tische: {
        where: { tischId: { in: eingabe.tischIds } },
        take: 1,
        select: { tisch: { select: { nummer: true } } },
      },
    },
  });
}

async function wirfBeiKonflikt(
  datenbank: Datenbank,
  eingabe: NormalisierteReservierungEingabe,
  eigeneReservierungId?: string,
) {
  const konflikt = await findeKonflikt(datenbank, eingabe, eigeneReservierungId);
  if (konflikt) {
    throw new ReservierungKonfliktfehler(
      konflikt.tische[0].tisch.nummer,
      konflikt.beginn,
      konflikt.ende,
    );
  }
}

function istDatenbankKonflikt(fehler: unknown) {
  return (
    fehler instanceof Prisma.PrismaClientKnownRequestError &&
    fehler.message.includes("RESERVIERUNG_DOPPELBUCHUNG")
  );
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
  try {
    return await datenbank.$transaction(async (transaktion) => {
      await pruefeAktiveReferenzen(transaktion, eingabe);
      await wirfBeiKonflikt(transaktion, eingabe);
      return transaktion.reservierung.create({
        data: reservierungsdaten(eingabe),
        include: { tische: true },
      });
    });
  } catch (fehler) {
    if (istDatenbankKonflikt(fehler)) {
      await wirfBeiKonflikt(datenbank, eingabe);
    }
    throw fehler;
  }
}

export async function aktualisiereReservierung(
  datenbank: PrismaClient,
  id: string,
  eingabe: NormalisierteReservierungEingabe,
) {
  try {
    return await datenbank.$transaction(async (transaktion) => {
      await pruefeAktiveReferenzen(transaktion, eingabe);
      await wirfBeiKonflikt(transaktion, eingabe, id);
      const { tischIds, ...daten } = eingabe;
      return transaktion.reservierung.update({
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
    });
  } catch (fehler) {
    if (istDatenbankKonflikt(fehler)) {
      await wirfBeiKonflikt(datenbank, eingabe, id);
    }
    throw fehler;
  }
}
