"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FAEHIGKEITEN, sitzungsAkteurId, verlangeFaehigkeit } from "@/lib/autorisierung";
import {
  aktualisiereReservierung,
  erstelleReservierung,
  markiereReservierungAlsNoShow,
  NoShowAusgangsstatusFehler,
  NoShowFristFehler,
  NoShowReservierungNichtGefundenFehler,
  NoShowUngepruefterStatuswechselFehler,
  ReservierungKonfliktfehler,
  ReservierungReferenzfehler,
} from "@/lib/reservierung-persistenz";
import {
  hatReservierungValidierungsfehler,
  normalisiereReservierung,
  validiereReservierung,
  type ReservierungEingabe,
  type ReservierungValidierungsfehler,
} from "@/lib/reservierungen";
import { prisma } from "@/lib/prisma";

export type ReservierungFormularStatus = {
  fehler: ReservierungValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseDatum(wert: FormDataEntryValue | null): Date | undefined {
  const text = String(wert ?? "").trim();
  return text.length === 0 ? undefined : new Date(text);
}

function leseEingabe(formular: FormData, mitarbeiterId: string): ReservierungEingabe {
  return {
    gastId: String(formular.get("gastId") ?? "").trim(),
    standortId: String(formular.get("standortId") ?? "").trim(),
    beginn: leseDatum(formular.get("beginn")) ?? new Date(Number.NaN),
    ende: leseDatum(formular.get("ende")),
    personenanzahl: Number(formular.get("personenanzahl")),
    status: String(formular.get("status") ?? ""),
    notiz: String(formular.get("notiz") ?? "").trim(),
    erstelltVonMitarbeiterId: mitarbeiterId,
    tischIds: formular.getAll("tischIds").map((wert) => String(wert).trim()),
  };
}

function persistenzfehler(error: unknown): ReservierungFormularStatus | undefined {
  if (error instanceof NoShowUngepruefterStatuswechselFehler) {
    return { fehler: { status: error.message }, meldung: error.message };
  }
  if (error instanceof ReservierungKonfliktfehler) {
    return {
      fehler: { tischIds: error.message },
      meldung: "Die Reservierung überschneidet sich mit einer bestehenden Tischbelegung.",
    };
  }

  if (error instanceof ReservierungReferenzfehler) {
    const istGast = error.feld === "gastId";
    return {
      fehler: {
        [error.feld]: istGast
          ? "Der gewählte Gast ist nicht aktiv oder nicht mehr vorhanden."
          : error.feld === "standortId"
            ? "Der gewählte Standort ist nicht aktiv oder nicht mehr vorhanden."
            : "Mindestens ein gewählter Tisch ist in diesem Standort nicht aktiv oder nicht mehr vorhanden.",
      },
      meldung: "Bitte eine verfügbare Auswahl treffen.",
    };
  }

  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;
  if (error.code === "P2025") {
    return { fehler: {}, meldung: "Die Reservierung konnte nicht gefunden werden." };
  }
  if (error.code === "P2003") {
    return { fehler: {}, meldung: "Gast oder Standort ist nicht mehr verfügbar." };
  }

  return undefined;
}

export async function reservierungAnlegen(
  _status: ReservierungFormularStatus,
  formular: FormData,
): Promise<ReservierungFormularStatus> {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const eingabe = leseEingabe(formular, sitzungsAkteurId(mitarbeiter, formular.get("erstelltVonMitarbeiterId")));
  const fehler = validiereReservierung(eingabe);

  if (hatReservierungValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    await erstelleReservierung(prisma, normalisiereReservierung(eingabe));
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/reservierungen");
  return { fehler: {}, meldung: "Reservierung wurde angelegt.", erfolgreich: true };
}

export async function reservierungBearbeiten(
  _status: ReservierungFormularStatus,
  formular: FormData,
): Promise<ReservierungFormularStatus> {
  const mitarbeiter = await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular, sitzungsAkteurId(mitarbeiter, formular.get("erstelltVonMitarbeiterId")));
  const fehler = validiereReservierung(eingabe);

  if (hatReservierungValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }
  if (id.length === 0) {
    return { fehler: {}, meldung: "Die Reservierung konnte nicht gefunden werden." };
  }

  try {
    await aktualisiereReservierung(prisma, id, normalisiereReservierung(eingabe));
  } catch (error) {
    const status = persistenzfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/reservierungen");
  return { fehler: {}, meldung: "Änderungen wurden gespeichert.", erfolgreich: true };
}

function noShowZiel(meldung: string, standortId: string, erfolgreich = false) {
  const parameter = new URLSearchParams({
    [erfolgreich ? "erfolg" : "fehler"]: meldung,
    standortId,
  });
  return `/reservierungen?${parameter}`;
}

export async function reservierungAlsNoShowMarkieren(formular: FormData) {
  await verlangeFaehigkeit(FAEHIGKEITEN.operativeAblaeufeNutzen);
  const id = String(formular.get("id") ?? "").trim();
  const standortId = String(formular.get("standortId") ?? "").trim();
  let weiterleitung: string;

  if (!id) {
    weiterleitung = noShowZiel("Die Reservierung konnte nicht gefunden werden.", standortId);
  } else {
    try {
      await markiereReservierungAlsNoShow(prisma, id);
      revalidatePath("/reservierungen");
      weiterleitung = noShowZiel("Die Reservierung wurde als No-Show markiert.", standortId, true);
    } catch (fehler) {
      if (
        fehler instanceof NoShowAusgangsstatusFehler ||
        fehler instanceof NoShowFristFehler ||
        fehler instanceof NoShowReservierungNichtGefundenFehler
      ) {
        weiterleitung = noShowZiel(fehler.message, standortId);
      } else {
        throw fehler;
      }
    }
  }

  redirect(weiterleitung);
}
