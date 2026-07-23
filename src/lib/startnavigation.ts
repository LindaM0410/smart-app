export const arbeitsbereichIds = ["administratives", "alltag", "abrechnung", "kueche"] as const;

export type ArbeitsbereichId = (typeof arbeitsbereichIds)[number];

export function gewaehlterArbeitsbereich(
  wert: string | undefined,
  erlaubteBereiche: readonly ArbeitsbereichId[],
): ArbeitsbereichId | undefined {
  return erlaubteBereiche.find((bereich) => bereich === wert);
}
