export const FAEHIGKEITEN = {
  stammdatenPflegen: "stammdatenPflegen",
  operativeAblaeufeNutzen: "operativeAblaeufeNutzen",
  kuechenstatusPflegen: "kuechenstatusPflegen",
  bestellpositionStornieren: "bestellpositionStornieren",
} as const;

export type Faehigkeit = (typeof FAEHIGKEITEN)[keyof typeof FAEHIGKEITEN];

const rollenFaehigkeiten: Record<string, readonly Faehigkeit[]> = {
  inhaber: [FAEHIGKEITEN.stammdatenPflegen, FAEHIGKEITEN.operativeAblaeufeNutzen, FAEHIGKEITEN.kuechenstatusPflegen, FAEHIGKEITEN.bestellpositionStornieren],
  manager: [FAEHIGKEITEN.stammdatenPflegen, FAEHIGKEITEN.operativeAblaeufeNutzen, FAEHIGKEITEN.kuechenstatusPflegen, FAEHIGKEITEN.bestellpositionStornieren],
  bedienung: [FAEHIGKEITEN.operativeAblaeufeNutzen],
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

export function faehigkeitFuerPfad(pfad: string): Faehigkeit | null {
  const erstesSegment = `/${pfad.split(/[/?#]/).filter(Boolean)[0] ?? ""}`;
  if (["/standorte", "/tische", "/mitarbeiter", "/speisekarte", "/artikelangebot"].includes(erstesSegment)) {
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
