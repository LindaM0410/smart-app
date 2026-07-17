"use server";

import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, sitzungsAkteurId, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  aktualisiereBestellung,
  BestellungReferenzfehler,
  erstelleBestellung,
  type BestellungEingabe,
} from "@/lib/bestellung-persistenz";
import { prisma } from "@/lib/prisma";

export type BestellungFormularStatus = {
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData, mitarbeiterId: string): BestellungEingabe {
  return {
    standortId: String(formular.get("standortId") ?? "").trim(),
    tischId: String(formular.get("tischId") ?? "").trim(),
    reservierungId: String(formular.get("reservierungId") ?? "").trim() || null,
    aufgenommenVonMitarbeiterId: mitarbeiterId,
  };
}

function istVollstaendig(eingabe: BestellungEingabe) {
  return eingabe.standortId && eingabe.tischId && eingabe.aufgenommenVonMitarbeiterId;
}

async function fuehreAus(
  formular: FormData,
  aktion: (eingabe: BestellungEingabe) => Promise<unknown>,
  erfolgsmeldung: string,
): Promise<BestellungFormularStatus> {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const eingabe = leseEingabe(formular, sitzungsAkteurId(mitarbeiter, formular.get("aufgenommenVonMitarbeiterId")));
  if (!istVollstaendig(eingabe)) return { meldung: "Bitte einen Tisch wählen." };

  try {
    await aktion(eingabe);
  } catch (error) {
    if (error instanceof BestellungReferenzfehler) {
      return { meldung: "Die Auswahl ist nicht mehr gültig oder gehört zu einem anderen Standort." };
    }
    throw error;
  }

  revalidatePath("/bestellungen");
  return { meldung: erfolgsmeldung, erfolgreich: true };
}

export async function bestellungAnlegen(
  _status: BestellungFormularStatus,
  formular: FormData,
): Promise<BestellungFormularStatus> {
  return fuehreAus(formular, (eingabe) => erstelleBestellung(prisma, eingabe), "Bestellung wurde eröffnet.");
}

export async function bestellungBearbeiten(
  _status: BestellungFormularStatus,
  formular: FormData,
): Promise<BestellungFormularStatus> {
  const id = String(formular.get("id") ?? "").trim();
  if (!id) return Promise.resolve({ meldung: "Die Bestellung konnte nicht gefunden werden." });
  return fuehreAus(
    formular,
    (eingabe) => aktualisiereBestellung(prisma, id, eingabe),
    "Bestellung wurde gespeichert.",
  );
}
