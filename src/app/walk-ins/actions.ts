"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  platziereWalkIn,
  WalkInKapazitaetsfehler,
  WalkInReferenzfehler,
  WalkInZeitfensterfehler,
} from "@/lib/walk-in-persistenz";
import { validiereWalkIn } from "@/lib/walk-ins";

function ziel(meldung: string, erfolgreich = false) {
  return `/walk-ins?${erfolgreich ? "erfolg" : "fehler"}=${encodeURIComponent(meldung)}`;
}

export async function walkInPlatzieren(formular: FormData) {
  const eingabe = {
    gastId: String(formular.get("gastId") ?? "").trim(),
    standortId: String(formular.get("standortId") ?? "").trim(),
    tischId: String(formular.get("tischId") ?? "").trim(),
    personenanzahl: Number(formular.get("personenanzahl")),
    notiz: String(formular.get("notiz") ?? "").trim(),
  };
  const fehler = Object.values(validiereWalkIn(eingabe));
  let weiterleitung: string;

  if (fehler.length > 0) {
    weiterleitung = ziel(fehler[0]);
  } else {
    try {
      await platziereWalkIn(prisma, eingabe);
      revalidatePath("/walk-ins");
      revalidatePath("/belegungen");
      revalidatePath("/tischuebersicht");
      weiterleitung = ziel("Der Walk-in wurde platziert.", true);
    } catch (error) {
      if (
        error instanceof WalkInReferenzfehler ||
        error instanceof WalkInKapazitaetsfehler ||
        error instanceof WalkInZeitfensterfehler
      ) {
        weiterleitung = ziel(error.message);
      } else {
        throw error;
      }
    }
  }
  redirect(weiterleitung);
}
