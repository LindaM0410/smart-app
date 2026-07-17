import type { PrismaClient } from "@prisma/client";

type AktiverStandort = { id: string; name: string };

export function waehleAktivenStandort(
  standorte: AktiverStandort[],
  angefragteId?: string,
) {
  if (angefragteId === undefined) return standorte[0];
  return standorte.find(({ id }) => id === angefragteId);
}

export function ladeReservierungenFuerStandort(
  datenbank: PrismaClient,
  standortId: string,
) {
  return datenbank.reservierung.findMany({
    where: { standortId },
    include: {
      gast: { select: { name: true } },
      standort: { select: { name: true } },
      tische: { include: { tisch: { select: { nummer: true } } } },
    },
    orderBy: { beginn: "asc" },
  });
}

export function ladeWalkInTischeFuerStandort(
  datenbank: PrismaClient,
  standortId: string,
) {
  return datenbank.tisch.findMany({
    where: { standortId, aktiv: true, standort: { aktiv: true } },
    orderBy: { nummer: "asc" },
  });
}

export async function ladeBelegungsdatenFuerStandort(
  datenbank: PrismaClient,
  standortId: string,
) {
  const [offeneBelegungen, zuordnungen] = await Promise.all([
    datenbank.belegung.findMany({
      where: { ende: null, tisch: { standortId } },
      include: {
        tisch: { include: { standort: { select: { name: true } } } },
        reservierung: { include: { gast: { select: { name: true } } } },
      },
      orderBy: { beginn: "asc" },
    }),
    datenbank.reservierungTisch.findMany({
      where: {
        tisch: {
          standortId,
          aktiv: true,
          belegungen: { none: { ende: null } },
        },
      },
      include: {
        tisch: { include: { standort: { select: { name: true } } } },
        reservierung: { include: { gast: { select: { name: true } } } },
      },
      orderBy: [{ reservierung: { beginn: "asc" } }, { tisch: { nummer: "asc" } }],
    }),
  ]);

  return { offeneBelegungen, zuordnungen };
}
