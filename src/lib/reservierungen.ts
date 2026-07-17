export const RESERVIERUNGSSTATUS = [
  "angefragt",
  "bestaetigt",
  "storniert",
  "noShow",
  "abgeschlossen",
] as const;

export type Reservierungsstatus = (typeof RESERVIERUNGSSTATUS)[number];

export type ReservierungEingabe = {
  gastId: string;
  standortId: string;
  beginn: Date;
  ende?: Date;
  personenanzahl: number;
  status: string;
  notiz: string;
  erstelltVonMitarbeiterId: string;
  tischIds: string[];
};

export type NormalisierteReservierungEingabe = Omit<
  ReservierungEingabe,
  "ende" | "status"
> & {
  ende: Date;
  status: Reservierungsstatus;
  istGruppe: boolean;
};

export type ReservierungValidierungsfehler = Partial<
  Record<
    | "gastId"
    | "standortId"
    | "beginn"
    | "ende"
    | "personenanzahl"
    | "status"
    | "erstelltVonMitarbeiterId"
    | "tischIds",
    string
  >
>;

const ZWEI_STUNDEN_IN_MS = 2 * 60 * 60 * 1000;

export function normalisiereReservierung(
  eingabe: ReservierungEingabe,
): NormalisierteReservierungEingabe {
  return {
    ...eingabe,
    ende: eingabe.ende ?? new Date(eingabe.beginn.getTime() + ZWEI_STUNDEN_IN_MS),
    status: eingabe.status as Reservierungsstatus,
    istGruppe: eingabe.personenanzahl >= 8,
  };
}

export function validiereReservierung(
  eingabe: ReservierungEingabe,
): ReservierungValidierungsfehler {
  const fehler: ReservierungValidierungsfehler = {};
  const normalisiert = normalisiereReservierung(eingabe);

  if (eingabe.gastId.trim().length === 0) {
    fehler.gastId = "Bitte einen Gast wählen.";
  }
  if (eingabe.standortId.trim().length === 0) {
    fehler.standortId = "Bitte einen Standort wählen.";
  }
  if (Number.isNaN(eingabe.beginn.getTime())) {
    fehler.beginn = "Bitte einen gültigen Beginn angeben.";
  }
  if (Number.isNaN(normalisiert.ende.getTime())) {
    fehler.ende = "Bitte ein gültiges Ende angeben.";
  } else if (!fehler.beginn && normalisiert.ende <= eingabe.beginn) {
    fehler.ende = "Das Ende muss nach dem Beginn liegen.";
  }
  if (!Number.isInteger(eingabe.personenanzahl) || eingabe.personenanzahl <= 0) {
    fehler.personenanzahl = "Die Personenanzahl muss eine positive ganze Zahl sein.";
  }
  if (!RESERVIERUNGSSTATUS.includes(eingabe.status as Reservierungsstatus)) {
    fehler.status = "Bitte einen gültigen Reservierungsstatus wählen.";
  }
  if (eingabe.erstelltVonMitarbeiterId.trim().length === 0) {
    fehler.erstelltVonMitarbeiterId = "Bitte die Mitarbeiterkennung angeben.";
  }
  if (new Set(eingabe.tischIds).size !== eingabe.tischIds.length) {
    fehler.tischIds = "Jeder Tisch darf nur einmal zugeordnet werden.";
  }

  return fehler;
}

export function hatReservierungValidierungsfehler(
  fehler: ReservierungValidierungsfehler,
): boolean {
  return Object.keys(fehler).length > 0;
}
