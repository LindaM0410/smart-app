import { type NextRequest, NextResponse } from "next/server";

import { ladeAngemeldetenMitarbeiter, SITZUNGS_COOKIE } from "@/lib/authentifizierung";
import { prisma } from "@/lib/prisma";

export async function proxy(anfrage: NextRequest) {
  const token = anfrage.cookies.get(SITZUNGS_COOKIE)?.value;
  const mitarbeiter = await ladeAngemeldetenMitarbeiter(prisma, token);
  if (mitarbeiter) return NextResponse.next();

  const ziel = new URL("/anmeldung", anfrage.url);
  return NextResponse.redirect(ziel);
}

export const config = {
  matcher: ["/((?!anmeldung|_next/static|_next/image|favicon.ico).*)"],
};
