"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function leseEingabe(formular: FormData): ReservierungEingabe {
  return {
    gastId: String(formular.get("gastId") ?? "").trim(),
    standortId: String(formular.get("standortId") ?? "").trim(),
    beginn: leseDatum(formular.get("beginn")) ?? new Date(Number.NaN),
    ende: leseDatum(formular.get("ende")),
    personenanzahl: Number(formular.get("personenanzahl")),
    status: String(formular.get("status") ?? ""),
    notiz: String(formular.get("notiz") ?? "").trim(),
    erstelltVonMitarbeiterId: String(
      formular.get("erstelltVonMitarbeiterId") ?? "",
    ).trim(),
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
  const eingabe = leseEingabe(formular);
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
  const id = String(formular.get("id") ?? "");
  const eingabe = leseEingabe(formular);
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

function noShowZiel(meldung: string, erfolgreich = false) {
  return `/reservierungen?${erfolgreich ? "erfolg" : "fehler"}=${encodeURIComponent(meldung)}`;
}

export async function reservierungAlsNoShowMarkieren(formular: FormData) {
  const id = String(formular.get("id") ?? "").trim();
  let weiterleitung: string;

  if (!id) {
    weiterleitung = noShowZiel("Die Reservierung konnte nicht gefunden werden.");
  } else {
    try {
      await markiereReservierungAlsNoShow(prisma, id);
      revalidatePath("/reservierungen");
      weiterleitung = noShowZiel("Die Reservierung wurde als No-Show markiert.", true);
    } catch (fehler) {
      if (
        fehler instanceof NoShowAusgangsstatusFehler ||
        fehler instanceof NoShowFristFehler ||
        fehler instanceof NoShowReservierungNichtGefundenFehler
      ) {
        weiterleitung = noShowZiel(fehler.message);
      } else {
        throw fehler;
      }
    }
  }

  redirect(weiterleitung);
}
