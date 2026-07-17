"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { abmelden, SITZUNGS_COOKIE } from "@/lib/authentifizierung";
import { prisma } from "@/lib/prisma";

export async function abmeldenAction() {
  const cookieSpeicher = await cookies();
  await abmelden(prisma, cookieSpeicher.get(SITZUNGS_COOKIE)?.value);
  cookieSpeicher.delete(SITZUNGS_COOKIE);
  redirect("/anmeldung");
}
