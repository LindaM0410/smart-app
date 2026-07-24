"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  aktualisiereFirmenkundenkontakt,
  erstelleFirmenkundenkontakt,
} from "@/lib/firmenkundenkontakt-persistenz";
import {
  hatFirmenkundenkontaktValidierungsfehler,
  validiereFirmenkundenkontakt,
  type FirmenkundenkontaktEingabe,
  type FirmenkundenkontaktValidierungsfehler,
} from "@/lib/firmenkundenkontakte";
import { prisma } from "@/lib/prisma";

export type FirmenkundenkontaktFormularStatus = {
  fehler: FirmenkundenkontaktValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): FirmenkundenkontaktEingabe {
  return {
    firmenname: String(formular.get("firmenname") ?? "").trim(),
    ansprechperson: String(formular.get("ansprechperson") ?? "").trim(),
    kontaktdaten: String(formular.get("kontaktdaten") ?? "").trim(),
    notiz: String(formular.get("notiz") ?? "").trim(),
    aktiv: formular.get("aktiv") === "on",
  };
}

function persistenzfehler(
  error: unknown,
): FirmenkundenkontaktFormularStatus | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  if (error.code === "P2025") {
    return {
      fehler: {},
      meldung: "Der Firmenkundenkontakt konnte nicht gefunden werden.",
    };
  }
  return undefined;
}

export async function firmenkundenkontaktAnlegen(
  _status: FirmenkundenkontaktFormularStatus,
  formular: FormData,
): Promise<FirmenkundenkontaktFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const eingabe = leseEingabe(formular);
  const fehler = validiereFirmenkundenkontakt(eingabe);

  if (hatFirmenkundenkontaktValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  await erstelleFirmenkundenkontakt(prisma, eingabe);
  revalidatePath("/firmenkundenkontakte");
  return {
    fehler: {},
    meldung: "Firmenkundenkontakt wurde angelegt.",
    erfolgreich: true,
  };
}

export async function firmenkundenkontaktBearbeiten(
  _status: FirmenkundenkontaktFormularStatus,
  formular: FormData,
): Promise<FirmenkundenkontaktFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
  const fehler = validiereFirmenkundenkontakt(eingabe);

  if (hatFirmenkundenkontaktValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }
  if (id.length === 0) {
    return {
      fehler: {},
      meldung: "Der Firmenkundenkontakt konnte nicht gefunden werden.",
    };
  }

  try {
    await aktualisiereFirmenkundenkontakt(prisma, id, eingabe);
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/firmenkundenkontakte");
  return {
    fehler: {},
    meldung: "Änderungen wurden gespeichert.",
    erfolgreich: true,
  };
}
