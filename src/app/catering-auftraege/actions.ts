"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  aktualisiereCateringAuftrag,
  CateringFirmenkontaktNichtAktivFehler,
  erstelleCateringAuftrag,
} from "@/lib/catering-auftrag-persistenz";
import {
  hatCateringAuftragValidierungsfehler,
  parseCateringDatum,
  parsePreisCent,
  validiereCateringAuftrag,
  type CateringAuftragEingabe,
  type CateringAuftragValidierungsfehler,
} from "@/lib/catering-auftraege";
import { prisma } from "@/lib/prisma";

export type CateringAuftragFormularStatus = {
  fehler: CateringAuftragValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): CateringAuftragEingabe {
  return {
    firmenkundenkontaktId: String(
      formular.get("firmenkundenkontaktId") ?? "",
    ),
    lieferadresse: String(formular.get("lieferadresse") ?? "").trim(),
    datum: parseCateringDatum(String(formular.get("datum") ?? "")),
    uhrzeit: String(formular.get("uhrzeit") ?? ""),
    personenanzahl: Number(formular.get("personenanzahl")),
    menueBeschreibung: String(
      formular.get("menueBeschreibung") ?? "",
    ).trim(),
    preisGesamtCent: parsePreisCent(
      String(formular.get("preisGesamt") ?? ""),
    ),
    notiz: String(formular.get("notiz") ?? "").trim(),
  };
}

function fachfehler(
  error: unknown,
): CateringAuftragFormularStatus | undefined {
  if (error instanceof CateringFirmenkontaktNichtAktivFehler) {
    return {
      fehler: {
        firmenkundenkontaktId:
          "Der Firmenkundenkontakt ist nicht mehr aktiv oder vorhanden.",
      },
      meldung: "Bitte den Firmenkundenkontakt prüfen.",
    };
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      fehler: {},
      meldung: "Der Catering-Auftrag konnte nicht gefunden werden.",
    };
  }
  return undefined;
}

async function speichern(
  id: string | undefined,
  formular: FormData,
): Promise<CateringAuftragFormularStatus> {
  const eingabe = leseEingabe(formular);
  const fehler = validiereCateringAuftrag(eingabe);
  if (hatCateringAuftragValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    if (id) {
      await aktualisiereCateringAuftrag(prisma, id, eingabe);
    } else {
      await erstelleCateringAuftrag(prisma, eingabe);
    }
  } catch (error) {
    const status = fachfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/catering-auftraege");
  return {
    fehler: {},
    meldung: id
      ? "Änderungen wurden gespeichert."
      : "Catering-Auftrag wurde angelegt.",
    erfolgreich: true,
  };
}

export async function cateringAuftragAnlegen(
  _status: CateringAuftragFormularStatus,
  formular: FormData,
) {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  return speichern(undefined, formular);
}

export async function cateringAuftragBearbeiten(
  _status: CateringAuftragFormularStatus,
  formular: FormData,
) {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const id = String(formular.get("id") ?? "");
  if (!id) {
    return {
      fehler: {},
      meldung: "Der Catering-Auftrag konnte nicht gefunden werden.",
    };
  }
  return speichern(id, formular);
}
