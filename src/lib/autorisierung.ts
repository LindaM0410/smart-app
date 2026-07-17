import { aktuellerMitarbeiter } from "./aktuelle-sitzung";
import { pruefeFaehigkeit, type Faehigkeit } from "./berechtigungen";

export * from "./berechtigungen";

export async function verlangeFaehigkeit(faehigkeit: Faehigkeit) {
  const mitarbeiter = await aktuellerMitarbeiter();
  pruefeFaehigkeit(mitarbeiter, faehigkeit);
  return mitarbeiter;
}
