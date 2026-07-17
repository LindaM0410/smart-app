import { prisma } from "../src/lib/prisma.ts";
import { setzePasswort } from "../src/lib/authentifizierung.ts";

const benutzername = process.argv[2]?.trim();
const passwort = process.env.BELLA_VISTA_NEUES_PASSWORT;

if (!benutzername || !passwort) {
  console.error("Verwendung: BELLA_VISTA_NEUES_PASSWORT='…' npm run passwort-setzen -- <benutzername>");
  process.exitCode = 1;
} else {
  try {
    await setzePasswort(prisma, benutzername, passwort);
    console.log(`Passwort für ${benutzername} wurde gesetzt; bestehende Sitzungen wurden beendet.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Passwort konnte nicht gesetzt werden.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
