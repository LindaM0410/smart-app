"use server";

import { revalidatePath } from "next/cache";

import { FAEHIGKEITEN, verlangeFaehigkeit } from "@/lib/autorisierung";
import { prisma } from "@/lib/prisma";
import { aktualisiereStandort, erstelleStandort } from "@/lib/standort-persistenz";
import {
  hatValidierungsfehler,
  validiereStandort,
  type StandortEingabe,
  type StandortValidierungsfehler,
} from "@/lib/standorte";

export type StandortFormularStatus = {
  fehler: StandortValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): StandortEingabe {
  return {
    name: String(formular.get("name") ?? "").trim(),
    adresse: String(formular.get("adresse") ?? "").trim(),
    sitzplaetze: Number(formular.get("sitzplaetze")),
    hatTerrasse: formular.get("hatTerrasse") === "on",
    hatGrill: formular.get("hatGrill") === "on",
    aktiv: formular.get("aktiv") === "on",
  };
}

export async function standortAnlegen(
  _status: StandortFormularStatus,
  formular: FormData,
): Promise<StandortFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const eingabe = leseEingabe(formular);
  const fehler = validiereStandort(eingabe);

  if (hatValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  await erstelleStandort(prisma, eingabe);
  revalidatePath("/standorte");

  return { fehler: {}, meldung: "Standort wurde angelegt.", erfolgreich: true };
}

export async function standortBearbeiten(
  _status: StandortFormularStatus,
  formular: FormData,
): Promise<StandortFormularStatus> {
  await verlangeFaehigkeit(FAEHIGKEITEN.stammdatenPflegen);
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
  const fehler = validiereStandort(eingabe);

  if (hatValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  if (id.length === 0) {
    return { fehler: {}, meldung: "Der Standort konnte nicht gefunden werden." };
  }

  await aktualisiereStandort(prisma, id, eingabe);
  revalidatePath("/standorte");

  return { fehler: {}, meldung: "Änderungen wurden gespeichert.", erfolgreich: true };
}
