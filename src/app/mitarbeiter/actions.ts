"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  aktualisiereMitarbeiter,
  erstelleMitarbeiter,
} from "@/lib/mitarbeiter-persistenz";
import {
  hatMitarbeiterValidierungsfehler,
  validiereMitarbeiter,
  type MitarbeiterEingabe,
  type MitarbeiterValidierungsfehler,
} from "@/lib/mitarbeiter";
import { prisma } from "@/lib/prisma";

export type MitarbeiterFormularStatus = {
  fehler: MitarbeiterValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): MitarbeiterEingabe {
  return {
    name: String(formular.get("name") ?? "").trim(),
    benutzername: String(formular.get("benutzername") ?? "").trim(),
    rolle: String(formular.get("rolle") ?? ""),
    hauptstandortId: String(formular.get("hauptstandortId") ?? "").trim(),
    aktiv: formular.get("aktiv") === "on",
  };
}

function persistenzfehler(error: unknown): MitarbeiterFormularStatus | undefined {
  if (error instanceof Error && error.message === "MITARBEITER_HAUPTSTANDORT_INAKTIV") {
    return {
      fehler: { hauptstandortId: "Der gewählte Standort ist nicht aktiv." },
      meldung: "Bitte einen aktiven Hauptstandort wählen.",
    };
  }
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;

  if (error.code === "P2002") {
    return {
      fehler: { benutzername: "Dieser Benutzername ist bereits vergeben." },
      meldung: "Bitte einen anderen Benutzernamen wählen.",
    };
  }
  if (error.code === "P2003") {
    return {
      fehler: { hauptstandortId: "Der gewählte Standort ist nicht mehr verfügbar." },
      meldung: "Bitte einen vorhandenen Hauptstandort wählen.",
    };
  }
  if (error.code === "P2025") {
    return { fehler: {}, meldung: "Der Mitarbeiter konnte nicht gefunden werden." };
  }

  return undefined;
}

export async function mitarbeiterAnlegen(
  _status: MitarbeiterFormularStatus,
  formular: FormData,
): Promise<MitarbeiterFormularStatus> {
  const eingabe = leseEingabe(formular);
  const fehler = validiereMitarbeiter(eingabe);

  if (hatMitarbeiterValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    await erstelleMitarbeiter(prisma, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/mitarbeiter");
  return { fehler: {}, meldung: "Mitarbeiter wurde angelegt.", erfolgreich: true };
}

export async function mitarbeiterBearbeiten(
  _status: MitarbeiterFormularStatus,
  formular: FormData,
): Promise<MitarbeiterFormularStatus> {
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
  const fehler = validiereMitarbeiter(eingabe);

  if (hatMitarbeiterValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }
  if (!id) {
    return { fehler: {}, meldung: "Der Mitarbeiter konnte nicht gefunden werden." };
  }

  try {
    await aktualisiereMitarbeiter(prisma, id, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/mitarbeiter");
  return { fehler: {}, meldung: "Änderungen wurden gespeichert.", erfolgreich: true };
}
