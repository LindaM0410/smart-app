"use server";

import { revalidatePath } from "next/cache";

import {
  ArtikelangebotReferenzfehler,
  GrillangebotNichtErlaubtFehler,
  speichereArtikel,
} from "@/lib/artikelangebot-persistenz";
import {
  hatArtikelValidierungsfehler,
  validiereArtikel,
  type ArtikelEingabe,
  type ArtikelValidierungsfehler,
} from "@/lib/artikel";
import { prisma } from "@/lib/prisma";

export type ArtikelFormularStatus = {
  fehler: ArtikelValidierungsfehler;
  meldung?: string;
  erfolgreich?: boolean;
};

function leseEingabe(formular: FormData): ArtikelEingabe {
  return {
    name: String(formular.get("name") ?? "").trim(),
    kategorie: String(formular.get("kategorie") ?? "").trim(),
    preisCent: Number(formular.get("preisCent")),
    benoetigtGrill: formular.get("benoetigtGrill") === "on",
    aktiv: formular.get("aktiv") === "on",
  };
}

function fachfehler(error: unknown): ArtikelFormularStatus | undefined {
  if (error instanceof GrillangebotNichtErlaubtFehler) {
    return {
      fehler: { standortIds: "Grillartikel dürfen nur für Standorte mit Grill freigegeben werden." },
      meldung: "Bitte die Standortfreigaben prüfen.",
    };
  }
  if (error instanceof ArtikelangebotReferenzfehler) {
    return {
      fehler: { standortIds: "Mindestens ein gewählter Standort ist nicht mehr aktiv oder vorhanden." },
      meldung: "Bitte die Standortfreigaben prüfen.",
    };
  }
  return undefined;
}

async function speichern(id: string | undefined, formular: FormData): Promise<ArtikelFormularStatus> {
  const eingabe = leseEingabe(formular);
  const fehler = validiereArtikel(eingabe);
  if (hatArtikelValidierungsfehler(fehler)) {
    return { fehler, meldung: "Bitte die markierten Angaben prüfen." };
  }

  try {
    await speichereArtikel(prisma, id, eingabe, formular.getAll("standortIds").map(String));
  } catch (error) {
    const status = fachfehler(error);
    if (status) return status;
    throw error;
  }

  revalidatePath("/speisekarte");
  revalidatePath("/artikelangebot");
  return { fehler: {}, meldung: id ? "Änderungen wurden gespeichert." : "Artikel wurde angelegt.", erfolgreich: true };
}

export async function artikelAnlegen(_status: ArtikelFormularStatus, formular: FormData) {
  return speichern(undefined, formular);
}

export async function artikelBearbeiten(_status: ArtikelFormularStatus, formular: FormData) {
  const id = String(formular.get("id") ?? "");
  if (!id) return { fehler: {}, meldung: "Der Artikel konnte nicht gefunden werden." };
  return speichern(id, formular);
}
