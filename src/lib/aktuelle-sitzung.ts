import { cookies } from "next/headers";

import { ladeAngemeldetenMitarbeiter, SITZUNGS_COOKIE } from "./authentifizierung";
import { prisma } from "./prisma";

export async function aktuellerMitarbeiter() {
  const cookieSpeicher = await cookies();
  return ladeAngemeldetenMitarbeiter(prisma, cookieSpeicher.get(SITZUNGS_COOKIE)?.value);
}
