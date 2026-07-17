"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";
import { aktualisiereTisch, erstelleTisch } from "@/lib/tisch-persistenz";
import {
  entferneTischKombination,
  erstelleTischKombination,
} from "@/lib/tischkombination-persistenz";
import {
  validiereTischKombination,
  type TischKombinationValidierungsfehler,
} from "@/lib/tischkombinationen";
import {
  hatTischValidierungsfehler,
  validiereTisch,
  type TischEingabe,
  type TischValidierungsfehler,
} from "@/lib/tische";

export type TischFormularStatus = {
  fehler: TischValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

export type TischKombinationFormularStatus = {
  fehler: TischKombinationValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): TischEingabe {
  return {
    standortId: String(formular.get("standortId") ?? "").trim(),
    nummer: String(formular.get("nummer") ?? "").trim(),
    kapazitaet: Number(formular.get("kapazitaet")),
    bereich: String(formular.get("bereich") ?? ""),
    kombinierbar: formular.get("kombinierbar") === "on",
    aktiv: formular.get("aktiv") === "on",
  };
}

function persistenzfehler(error: unknown): TischFormularStatus | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;

  if (error.code === "P2002") {
    return {
      fehler: { nummer: "Diese Tischnummer ist am gewählten Standort bereits vergeben." },
      meldung: "Bitte eine andere Tischnummer wählen.",
    };
  }

  if (error.code === "P2003") {
    return {
      fehler: { standortId: "Der gewählte Standort ist nicht mehr verfügbar." },
      meldung: "Bitte einen vorhandenen Standort wählen.",
    };
  }

  if (error.code === "P2025") {
    return { fehler: {}, meldung: "Der Tisch konnte nicht gefunden werden." };
  }

  return undefined;
}

export async function tischAnlegen(
  _status: TischFormularStatus,
  formular: FormData,
): Promise<TischFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const eingabe = leseEingabe(formular);
  const fehler = validiereTisch(eingabe);

  if (hatTischValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    await erstelleTisch(prisma, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/tische");
  return { fehler: {}, meldung: "Tisch wurde angelegt.", erfolgreich: true };
}

export async function tischBearbeiten(
  _status: TischFormularStatus,
  formular: FormData,
): Promise<TischFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
  const fehler = validiereTisch(eingabe);

  if (hatTischValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  if (id.length === 0) {
    return { fehler: {}, meldung: "Der Tisch konnte nicht gefunden werden." };
  }

  try {
    await aktualisiereTisch(prisma, id, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/tische");
  return { fehler: {}, meldung: "Änderungen wurden gespeichert.", erfolgreich: true };
}

export async function tischKombinationAnlegen(
  _status: TischKombinationFormularStatus,
  formular: FormData,
): Promise<TischKombinationFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const eingabe = {
    standortId: String(formular.get("standortId") ?? "").trim(),
    tischIds: formular.getAll("tischIds").map(String),
  };
  const fehler = validiereTischKombination(eingabe);

  if (Object.keys(fehler).length > 0) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    await erstelleTischKombination(prisma, eingabe);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        fehler: { tischIds: "Diese Tischkombination ist bereits vorhanden." },
        meldung: "Bitte eine andere Tischmenge auswählen.",
      };
    }
    if (error instanceof Error && error.message === "TISCHKOMBINATION_UNGUELTIGE_TISCHE") {
      return {
        fehler: {
          tischIds:
            "Alle Tische müssen aktiv, kombinierbar und dem gewählten Standort zugeordnet sein.",
        },
        meldung: "Die Tischkombination konnte nicht angelegt werden.",
      };
    }
    throw error;
  }

  revalidatePath("/tische");
  return { fehler: {}, meldung: "Tischkombination wurde angelegt.", erfolgreich: true };
}

export async function tischKombinationEntfernen(formular: FormData): Promise<void> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const id = String(formular.get("id") ?? "");
  if (!id) return;

  try {
    await entferneTischKombination(prisma, id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return;
    throw error;
  }
  revalidatePath("/tische");
}
