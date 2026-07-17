"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { anmelden, SITZUNGS_COOKIE } from "@/lib/authentifizierung";
import { prisma } from "@/lib/prisma";

export type AnmeldeStatus = { meldung?: string };

export async function anmeldenAction(_status: AnmeldeStatus, formular: FormData): Promise<AnmeldeStatus> {
  const ergebnis = await anmelden(
    prisma,
    String(formular.get("benutzername") ?? ""),
    String(formular.get("passwort") ?? ""),
  );
  if (!ergebnis) return { meldung: "Benutzername oder Passwort ist nicht gültig." };

  const cookieSpeicher = await cookies();
  cookieSpeicher.set(SITZUNGS_COOKIE, ergebnis.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: ergebnis.gueltigBis,
    path: "/",
  });
  redirect("/");
}
