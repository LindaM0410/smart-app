import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import type { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const SCHLUESSELLAENGE = 64;
const MINDESTLAENGE = 12;
export const SITZUNGS_COOKIE = "bella_vista_sitzung";
export const SITZUNGSDAUER_MS = 12 * 60 * 60 * 1000;

type Datenbank = Pick<PrismaClient, "mitarbeiter" | "mitarbeiterAuthentifizierung" | "mitarbeiterSitzung">;

export type AngemeldeterMitarbeiter = {
  id: string;
  name: string;
  benutzername: string;
  rolle: string;
  hauptstandortId: string;
};

export class UngueltigesPasswort extends Error {}

export async function hashePasswort(passwort: string): Promise<string> {
  if (passwort.length < MINDESTLAENGE) {
    throw new UngueltigesPasswort(`Das Passwort muss mindestens ${MINDESTLAENGE} Zeichen lang sein.`);
  }
  const salt = randomBytes(16);
  const schluessel = (await scrypt(passwort, salt, SCHLUESSELLAENGE)) as Buffer;
  return `scrypt:${salt.toString("base64")}:${schluessel.toString("base64")}`;
}

export async function pruefePasswort(passwort: string, gespeichert: string): Promise<boolean> {
  const [verfahren, saltText, hashText] = gespeichert.split(":");
  if (verfahren !== "scrypt" || !saltText || !hashText) return false;
  try {
    const erwartet = Buffer.from(hashText, "base64");
    const erhalten = (await scrypt(passwort, Buffer.from(saltText, "base64"), erwartet.length)) as Buffer;
    return erwartet.length === erhalten.length && timingSafeEqual(erwartet, erhalten);
  } catch {
    return false;
  }
}

export async function setzePasswort(datenbank: Datenbank, benutzername: string, passwort: string) {
  const mitarbeiter = await datenbank.mitarbeiter.findUnique({ where: { benutzername } });
  if (!mitarbeiter) throw new Error("Mitarbeiter nicht gefunden.");
  const passwortHash = await hashePasswort(passwort);
  await datenbank.mitarbeiterAuthentifizierung.upsert({
    where: { mitarbeiterId: mitarbeiter.id },
    create: { mitarbeiterId: mitarbeiter.id, passwortHash },
    update: { passwortHash },
  });
  await datenbank.mitarbeiterSitzung.deleteMany({ where: { mitarbeiterId: mitarbeiter.id } });
}

function hasheToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function anmelden(
  datenbank: Datenbank,
  benutzername: string,
  passwort: string,
  jetzt = new Date(),
): Promise<{ token: string; gueltigBis: Date } | null> {
  const mitarbeiter = await datenbank.mitarbeiter.findUnique({
    where: { benutzername: benutzername.trim() },
    include: { authentifizierung: true },
  });
  if (!mitarbeiter?.aktiv || !mitarbeiter.authentifizierung) return null;
  if (!(await pruefePasswort(passwort, mitarbeiter.authentifizierung.passwortHash))) return null;

  const token = randomBytes(32).toString("base64url");
  const gueltigBis = new Date(jetzt.getTime() + SITZUNGSDAUER_MS);
  await datenbank.mitarbeiterSitzung.create({
    data: { tokenHash: hasheToken(token), mitarbeiterId: mitarbeiter.id, gueltigBis },
  });
  return { token, gueltigBis };
}

export async function ladeAngemeldetenMitarbeiter(
  datenbank: Datenbank,
  token: string | undefined,
  jetzt = new Date(),
): Promise<AngemeldeterMitarbeiter | null> {
  if (!token) return null;
  const sitzung = await datenbank.mitarbeiterSitzung.findUnique({
    where: { tokenHash: hasheToken(token) },
    include: { mitarbeiter: true },
  });
  if (!sitzung || sitzung.gueltigBis <= jetzt || !sitzung.mitarbeiter.aktiv) {
    if (sitzung) await datenbank.mitarbeiterSitzung.delete({ where: { id: sitzung.id } });
    return null;
  }
  const { id, name, benutzername, rolle, hauptstandortId } = sitzung.mitarbeiter;
  return { id, name, benutzername, rolle, hauptstandortId };
}

export async function abmelden(datenbank: Datenbank, token: string | undefined) {
  if (!token) return;
  await datenbank.mitarbeiterSitzung.deleteMany({ where: { tokenHash: hasheToken(token) } });
}
