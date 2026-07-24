export const FAEHIGKEITEN = {
  stammdatenPflegen: "stammdatenPflegen",
  operativeAblaeufeNutzen: "operativeAblaeufeNutzen",
  gruppenreservierungenPlanen: "gruppenreservierungenPlanen",
  kuechenstatusPflegen: "kuechenstatusPflegen",
  bestellpositionStornieren: "bestellpositionStornieren",
  rechnungErzeugen: "rechnungErzeugen",
  rechnungBezahlen: "rechnungBezahlen",
  bellaCardRabattAnwenden: "bellaCardRabattAnwenden",
} as const;

export type Faehigkeit = (typeof FAEHIGKEITEN)[keyof typeof FAEHIGKEITEN];

const rollenFaehigkeiten: Record<string, readonly Faehigkeit[]> = {
  inhaber: [FAEHIGKEITEN.stammdatenPflegen, FAEHIGKEITEN.operativeAblaeufeNutzen, FAEHIGKEITEN.gruppenreservierungenPlanen, FAEHIGKEITEN.kuechenstatusPflegen, FAEHIGKEITEN.bestellpositionStornieren, FAEHIGKEITEN.rechnungErzeugen, FAEHIGKEITEN.rechnungBezahlen, FAEHIGKEITEN.bellaCardRabattAnwenden],
  manager: [FAEHIGKEITEN.stammdatenPflegen, FAEHIGKEITEN.operativeAblaeufeNutzen, FAEHIGKEITEN.gruppenreservierungenPlanen, FAEHIGKEITEN.kuechenstatusPflegen, FAEHIGKEITEN.bestellpositionStornieren, FAEHIGKEITEN.rechnungErzeugen, FAEHIGKEITEN.rechnungBezahlen, FAEHIGKEITEN.bellaCardRabattAnwenden],
  bedienung: [FAEHIGKEITEN.operativeAblaeufeNutzen, FAEHIGKEITEN.rechnungErzeugen, FAEHIGKEITEN.rechnungBezahlen],
  kueche: [FAEHIGKEITEN.kuechenstatusPflegen],
};

export class ZugriffVerweigertFehler extends Error {
  constructor() {
    super("Für diese Funktion fehlt die erforderliche Berechtigung.");
    this.name = "ZugriffVerweigertFehler";
  }
}

export function hatFaehigkeit(mitarbeiter: { rolle: string }, faehigkeit: Faehigkeit): boolean {
  return rollenFaehigkeiten[mitarbeiter.rolle]?.includes(faehigkeit) ?? false;
}

export function pruefeFaehigkeit(
  mitarbeiter: { rolle: string } | null,
  faehigkeit: Faehigkeit,
): asserts mitarbeiter is { rolle: string } {
  if (!mitarbeiter || !hatFaehigkeit(mitarbeiter, faehigkeit)) {
    throw new ZugriffVerweigertFehler();
  }
}

export function pruefeGruppenreservierungPlanung(
  mitarbeiter: { rolle: string } | null,
  vorherIstGruppe: boolean,
  nachherIstGruppe: boolean,
) {
  if (vorherIstGruppe || nachherIstGruppe) {
    pruefeFaehigkeit(mitarbeiter, FAEHIGKEITEN.gruppenreservierungenPlanen);
  }
}

export function faehigkeitFuerPfad(pfad: string): Faehigkeit | null {
  const erstesSegment = `/${pfad.split(/[/?#]/).filter(Boolean)[0] ?? ""}`;
  if (["/standorte", "/tische", "/mitarbeiter", "/speisekarte", "/artikelangebot", "/firmenkundenkontakte"].includes(erstesSegment)) {
    return FAEHIGKEITEN.stammdatenPflegen;
  }
  if (["/gaeste", "/reservierungen", "/tischuebersicht", "/walk-ins", "/belegungen", "/bestellungen"].includes(erstesSegment)) {
    return FAEHIGKEITEN.operativeAblaeufeNutzen;
  }
  if (erstesSegment === "/kueche") return FAEHIGKEITEN.kuechenstatusPflegen;
  return null;
}

export function sitzungsAkteurId(mitarbeiter: { id: string }, _clientBehauptung?: unknown): string {
  return mitarbeiter.id;
}
