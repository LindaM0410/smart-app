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

function ziel(meldung: string, erfolgreich = false) {
  return `/belegungen?${erfolgreich ? "erfolg" : "fehler"}=${encodeURIComponent(meldung)}`;
}

export async function reservierungPlatzieren(formular: FormData) {
  const reservierungId = String(formular.get("reservierungId") ?? "");
  const tischId = String(formular.get("tischId") ?? "");
  let weiterleitung: string;

  if (!reservierungId || !tischId) {
    weiterleitung = ziel("Reservierung und Tisch fehlen.");
  } else {
    try {
      await platziereReservierung(prisma, reservierungId, tischId);
      revalidatePath("/belegungen");
      weiterleitung = ziel("Der Tisch wurde als belegt erfasst.", true);
    } catch (fehler) {
      if (fehler instanceof BelegungReferenzfehler || fehler instanceof TischBereitsBelegtFehler) {
        weiterleitung = ziel(fehler.message);
      } else {
        throw fehler;
      }
    }
  }
  redirect(weiterleitung);
}

export async function tischFreigeben(formular: FormData) {
  const belegungId = String(formular.get("belegungId") ?? "");
  let weiterleitung: string;

  try {
    await gibTischFrei(prisma, belegungId);
    revalidatePath("/belegungen");
    weiterleitung = ziel("Der Tisch wurde freigegeben.", true);
  } catch (fehler) {
    if (fehler instanceof BelegungNichtOffenFehler) {
      weiterleitung = ziel(fehler.message);
    } else {
      throw fehler;
    }
  }
  redirect(weiterleitung);
}
