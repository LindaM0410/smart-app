"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  BelegungNichtOffenFehler,
  BelegungReferenzfehler,
  gibTischFrei,
  platziereReservierung,
  TischBereitsBelegtFehler,
} from "@/lib/belegung-persistenz";
import { prisma } from "@/lib/prisma";

function ziel(meldung: string, standortId: string, erfolgreich = false) {
  const parameter = new URLSearchParams({
    [erfolgreich ? "erfolg" : "fehler"]: meldung,
    standortId,
  });
  return `/belegungen?${parameter}`;
}

export async function reservierungPlatzieren(formular: FormData) {
  const reservierungId = String(formular.get("reservierungId") ?? "");
  const tischId = String(formular.get("tischId") ?? "");
  const standortId = String(formular.get("standortId") ?? "");
  let weiterleitung: string;

  if (!reservierungId || !tischId) {
    weiterleitung = ziel("Reservierung und Tisch fehlen.", standortId);
  } else {
    try {
      await platziereReservierung(prisma, reservierungId, tischId);
      revalidatePath("/belegungen");
      weiterleitung = ziel("Der Tisch wurde als belegt erfasst.", standortId, true);
    } catch (fehler) {
      if (fehler instanceof BelegungReferenzfehler || fehler instanceof TischBereitsBelegtFehler) {
        weiterleitung = ziel(fehler.message, standortId);
      } else {
        throw fehler;
      }
    }
  }
  redirect(weiterleitung);
}

export async function tischFreigeben(formular: FormData) {
  const belegungId = String(formular.get("belegungId") ?? "");
  const standortId = String(formular.get("standortId") ?? "");
  let weiterleitung: string;

  try {
    await gibTischFrei(prisma, belegungId);
    revalidatePath("/belegungen");
    weiterleitung = ziel("Der Tisch wurde freigegeben.", standortId, true);
  } catch (fehler) {
    if (fehler instanceof BelegungNichtOffenFehler) {
      weiterleitung = ziel(fehler.message, standortId);
    } else {
      throw fehler;
    }
  }
  redirect(weiterleitung);
}
