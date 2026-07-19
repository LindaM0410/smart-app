"use server";

import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, sitzungsAkteurId, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  aktualisiereBestellposition,
  BestellpositionReferenzfehler,
  BestellpositionValidierungsfehler as BestellpositionEingabefehler,
  erstelleBestellposition,
} from "@/lib/bestellposition-persistenz";
import { validiereBestellposition, type BestellpositionValidierungsfehler } from "@/lib/bestellpositionen";
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

export type BestellpositionFormularStatus = {
  fehler: BestellpositionValidierungsfehler;
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

function lesePositionsEingabe(formular: FormData) {
  return {
    menge: Number(String(formular.get("menge") ?? "")),
    sonderwunsch: String(formular.get("sonderwunsch") ?? ""),
  };
}

async function fuehrePositionsaktionAus(
  formular: FormData,
  aktion: (eingabe: ReturnType<typeof lesePositionsEingabe>) => Promise<unknown>,
  erfolgsmeldung: string,
): Promise<BestellpositionFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const eingabe = lesePositionsEingabe(formular);
  const fehler = validiereBestellposition(eingabe);
  if (Object.keys(fehler).length > 0) return { fehler };

  try {
    await aktion(eingabe);
  } catch (error) {
    if (error instanceof BestellpositionEingabefehler) return { fehler: validiereBestellposition(eingabe) };
    if (error instanceof BestellpositionReferenzfehler) {
      return { fehler: {}, meldung: "Bestellung oder Artikel ist nicht mehr offen beziehungsweise verfügbar." };
    }
    throw error;
  }
  revalidatePath("/bestellungen");
  return { fehler: {}, meldung: erfolgsmeldung, erfolgreich: true };
}

export async function bestellpositionAnlegen(
  _status: BestellpositionFormularStatus,
  formular: FormData,
): Promise<BestellpositionFormularStatus> {
  const bestellungId = String(formular.get("bestellungId") ?? "").trim();
  const artikelId = String(formular.get("artikelId") ?? "").trim();
  if (!bestellungId || !artikelId) return { fehler: {}, meldung: "Bitte einen Artikel wählen." };
  return fuehrePositionsaktionAus(
    formular,
    (eingabe) => erstelleBestellposition(prisma, { ...eingabe, bestellungId, artikelId }),
    "Position wurde hinzugefügt.",
  );
}

export async function bestellpositionBearbeiten(
  _status: BestellpositionFormularStatus,
  formular: FormData,
): Promise<BestellpositionFormularStatus> {
  const id = String(formular.get("id") ?? "").trim();
  if (!id) return { fehler: {}, meldung: "Die Position konnte nicht gefunden werden." };
  return fuehrePositionsaktionAus(
    formular,
    (eingabe) => aktualisiereBestellposition(prisma, id, eingabe),
    "Position wurde gespeichert.",
  );
}
