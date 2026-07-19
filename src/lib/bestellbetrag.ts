export type BerechenbareBestellposition = {
  menge: number;
  einzelpreisCent: number;
  status: string;
};

export function berechneBruttobetragCent(positionen: readonly BerechenbareBestellposition[]) {
  let bruttobetragCent = 0;

  for (const position of positionen) {
    if (position.status === "storniert") continue;

    if (!Number.isSafeInteger(position.menge) || !Number.isSafeInteger(position.einzelpreisCent)) {
      throw new RangeError("Menge und Einzelpreis müssen sichere Ganzzahlen sein.");
    }

    const positionsbetragCent = position.menge * position.einzelpreisCent;
    if (!Number.isSafeInteger(positionsbetragCent)) {
      throw new RangeError("Der Positionsbetrag überschreitet den sicher berechenbaren Centbereich.");
    }

    const neueSummeCent = bruttobetragCent + positionsbetragCent;
    if (!Number.isSafeInteger(neueSummeCent)) {
      throw new RangeError("Der Bruttobetrag überschreitet den sicher berechenbaren Centbereich.");
    }
    bruttobetragCent = neueSummeCent;
  }

  return bruttobetragCent;
}
