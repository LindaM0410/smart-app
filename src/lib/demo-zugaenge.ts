import type { PrismaClient } from "@prisma/client";
import { setzePasswort } from "./authentifizierung.ts";

const DEMO_PASSWORT = "BellaVista2026!";
export const DEMO_MITARBEITENDE = [
  { name: "Chef Bella", benutzername: "chef.inhaber", rolle: "inhaber" },
  { name: "Lorenzo Manager", benutzername: "lorenzo.manager", rolle: "manager" },
  { name: "Bedienung Demo", benutzername: "bedienung.demo", rolle: "bedienung" },
  { name: "Küche Demo", benutzername: "kueche.demo", rolle: "kueche" },
] as const;

export async function bootstrapDemoZugaenge(datenbank: PrismaClient) {
  let kreuzberg = await datenbank.standort.findFirst({ where: { name: "Kreuzberg" } });
  if (kreuzberg && !kreuzberg.aktiv) kreuzberg = await datenbank.standort.update({ where: { id: kreuzberg.id }, data: { aktiv: true } });
  if (!kreuzberg) kreuzberg = await datenbank.standort.create({ data: { name: "Kreuzberg", adresse: "Lokaler Demo-Standort", sitzplaetze: 80, hatTerrasse: true, hatGrill: true, aktiv: true } });

  for (const person of DEMO_MITARBEITENDE) {
    await datenbank.mitarbeiter.upsert({
      where: { benutzername: person.benutzername },
      create: { ...person, hauptstandortId: kreuzberg.id, aktiv: true },
      update: { ...person, hauptstandortId: kreuzberg.id, aktiv: true },
    });
    await setzePasswort(datenbank, person.benutzername, DEMO_PASSWORT);
  }
  return DEMO_MITARBEITENDE.map(({ benutzername }) => benutzername);
}
