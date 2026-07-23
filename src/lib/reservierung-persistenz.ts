import { Prisma, type PrismaClient } from "@prisma/client";

import {
  istReservierungsstatus,
  istReservierungsstatusWechselErlaubt,
  type NormalisierteReservierungEingabe,
  type Reservierungsstatus,
} from "./reservierungen.ts";
import { tischKombinationsSchluessel } from "./tischkombinationen.ts";

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

export class GruppenreservierungTischkombinationFehler extends Error {
  constructor() {
    super(
      "Für eine Gruppenreservierung muss genau eine zulässige Tischkombination dieses Standorts gewählt werden.",
    );
  }
}

export class NoShowReservierungNichtGefundenFehler extends Error {
  constructor() {
    super("Die Reservierung konnte nicht gefunden werden.");
  }
}

export class NoShowAusgangsstatusFehler extends Error {
  constructor() {
    super("Nur eine bestätigte Reservierung kann als No-Show markiert werden.");
  }
}

export class NoShowFristFehler extends Error {
  readonly fristEnde: Date;

  constructor(fristEnde: Date) {
    super("Die Reservierung kann erst 15 Minuten nach dem geplanten Beginn als No-Show markiert werden.");
    this.fristEnde = fristEnde;
  }
}

export class NoShowUngepruefterStatuswechselFehler extends Error {
  constructor() {
    super("Bitte die eigene Aktion zum Markieren als No-Show verwenden.");
  }
}

export class ReservierungsstatusNichtGefundenFehler extends Error {
  constructor() {
    super("Die Reservierung konnte nicht gefunden werden.");
  }
}

export class ReservierungsstatusWechselFehler extends Error {
  readonly ausgangsstatus: string;
  readonly zielstatus: string;

  constructor(ausgangsstatus: string, zielstatus: string) {
    super(`Der Statuswechsel von „${ausgangsstatus}“ zu „${zielstatus}“ ist nicht erlaubt.`);
    this.ausgangsstatus = ausgangsstatus;
    this.zielstatus = zielstatus;
  }
}

export class ReservierungsstatusManipulationFehler extends Error {
  constructor() {
    super("Statusänderungen sind nur über die vorgesehenen Statusaktionen erlaubt.");
  }
}

const BLOCKIERENDE_STATUS = ["angefragt", "bestaetigt"];
const NO_SHOW_FRIST_IN_MS = 15 * 60 * 1000;

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

async function pruefeGruppenTischkombination(
  datenbank: Datenbank,
  eingabe: NormalisierteReservierungEingabe,
) {
  if (!eingabe.istGruppe) return;

  const kombination = await datenbank.tischKombination.findFirst({
    where: {
      standortId: eingabe.standortId,
      schluessel: tischKombinationsSchluessel(eingabe.tischIds),
    },
    select: { id: true },
  });

  if (!kombination) {
    throw new GruppenreservierungTischkombinationFehler();
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
  if (eingabe.status !== "angefragt") {
    throw new ReservierungsstatusManipulationFehler();
  }
  try {
    return await datenbank.$transaction(async (transaktion) => {
      await pruefeAktiveReferenzen(transaktion, eingabe);
      await pruefeGruppenTischkombination(transaktion, eingabe);
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
      const vorhanden = await transaktion.reservierung.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!vorhanden) throw new NoShowReservierungNichtGefundenFehler();
      if (eingabe.status !== vorhanden.status) {
        throw new ReservierungsstatusManipulationFehler();
      }
      await pruefeAktiveReferenzen(transaktion, eingabe);
      await pruefeGruppenTischkombination(transaktion, eingabe);
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

export async function wechsleReservierungsstatus(
  datenbank: PrismaClient,
  id: string,
  zielstatus: string,
) {
  if (!istReservierungsstatus(zielstatus) || zielstatus === "noShow") {
    throw new ReservierungsstatusWechselFehler("unbekannt", zielstatus);
  }

  try {
    return await datenbank.$transaction(async (transaktion) => {
      const reservierung = await transaktion.reservierung.findUnique({
        where: { id },
        select: {
          status: true,
          beginn: true,
          ende: true,
          tische: { select: { tischId: true } },
        },
      });
      if (!reservierung) throw new ReservierungsstatusNichtGefundenFehler();
      if (
        !istReservierungsstatus(reservierung.status) ||
        !istReservierungsstatusWechselErlaubt(reservierung.status, zielstatus)
      ) {
        throw new ReservierungsstatusWechselFehler(reservierung.status, zielstatus);
      }

      if (BLOCKIERENDE_STATUS.includes(zielstatus)) {
        await wirfBeiKonflikt(
          transaktion,
          {
            gastId: "",
            standortId: "",
            beginn: reservierung.beginn,
            ende: reservierung.ende,
            personenanzahl: 1,
            status: zielstatus as Reservierungsstatus,
            notiz: "",
            erstelltVonMitarbeiterId: "",
            tischIds: reservierung.tische.map(({ tischId }) => tischId),
            istGruppe: false,
          },
          id,
        );
      }

      return transaktion.reservierung.update({
        where: { id },
        data: { status: zielstatus },
      });
    });
  } catch (fehler) {
    if (istDatenbankKonflikt(fehler)) {
      const reservierung = await datenbank.reservierung.findUniqueOrThrow({
        where: { id },
        include: { tische: true },
      });
      await wirfBeiKonflikt(
        datenbank,
        {
          gastId: reservierung.gastId,
          standortId: reservierung.standortId,
          beginn: reservierung.beginn,
          ende: reservierung.ende,
          personenanzahl: reservierung.personenanzahl,
          status: zielstatus as Reservierungsstatus,
          notiz: reservierung.notiz,
          erstelltVonMitarbeiterId: reservierung.erstelltVonMitarbeiterId,
          tischIds: reservierung.tische.map(({ tischId }) => tischId),
          istGruppe: reservierung.istGruppe,
        },
        id,
      );
    }
    throw fehler;
  }
}

export async function markiereReservierungAlsNoShow(
  datenbank: PrismaClient,
  id: string,
  zeitpunkt = new Date(),
) {
  const fristBeginn = new Date(zeitpunkt.getTime() - NO_SHOW_FRIST_IN_MS);
  const ergebnis = await datenbank.reservierung.updateMany({
    where: { id, status: "bestaetigt", beginn: { lte: fristBeginn } },
    data: { status: "noShow" },
  });

  if (ergebnis.count === 1) {
    return datenbank.reservierung.findUniqueOrThrow({ where: { id } });
  }

  const reservierung = await datenbank.reservierung.findUnique({
    where: { id },
    select: { beginn: true, status: true },
  });
  if (!reservierung) throw new NoShowReservierungNichtGefundenFehler();
  if (reservierung.status !== "bestaetigt") throw new NoShowAusgangsstatusFehler();
  throw new NoShowFristFehler(
    new Date(reservierung.beginn.getTime() + NO_SHOW_FRIST_IN_MS),
  );
}
