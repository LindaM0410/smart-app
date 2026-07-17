"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { aktualisiereGast, erstelleGast } from "@/lib/gast-persistenz";
import {
  hatGastValidierungsfehler,
  validiereGast,
  type GastEingabe,
  type GastValidierungsfehler,
} from "@/lib/gaeste";
import { prisma } from "@/lib/prisma";

export type GastFormularStatus = {
  fehler: GastValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): GastEingabe {
  return {
    name: String(formular.get("name") ?? "").trim(),
    telefon: String(formular.get("telefon") ?? "").trim(),
    notiz: String(formular.get("notiz") ?? "").trim(),
    istStammgast: formular.get("istStammgast") === "on",
    hatBellaCard: formular.get("hatBellaCard") === "on",
    besuchsanzahl: Number(formular.get("besuchsanzahl")),
    aktiv: formular.get("aktiv") === "on",
  };
}

function persistenzfehler(error: unknown): GastFormularStatus | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;

  if (error.code === "P2025") {
    return { fehler: {}, meldung: "Der Gast konnte nicht gefunden werden." };
  }

  return undefined;
}

export async function gastAnlegen(
  _status: GastFormularStatus,
  formular: FormData,
): Promise<GastFormularStatus> {
  const eingabe = leseEingabe(formular);
  const fehler = validiereGast(eingabe);

  if (hatGastValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  await erstelleGast(prisma, eingabe);
  revalidatePath("/gaeste");
  return { fehler: {}, meldung: "Gast wurde angelegt.", erfolgreich: true };
}

export async function gastBearbeiten(
  _status: GastFormularStatus,
  formular: FormData,
): Promise<GastFormularStatus> {
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
  const fehler = validiereGast(eingabe);

  if (hatGastValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  if (id.length === 0) {
    return { fehler: {}, meldung: "Der Gast konnte nicht gefunden werden." };
  }

  try {
    await aktualisiereGast(prisma, id, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/gaeste");
  return { fehler: {}, meldung: "Änderungen wurden gespeichert.", erfolgreich: true };
}
