import { redirect } from "next/navigation";

import { aktuellerMitarbeiter } from "@/lib/aktuelle-sitzung";

import { AnmeldeFormular } from "./anmelde-formular";

export default async function AnmeldeSeite() {
  if (await aktuellerMitarbeiter()) redirect("/");
  return <main><header className="seitenkopf"><p className="kennung">Interne Restaurant-App</p><h1>Anmeldung</h1><p>Mit dem persönlichen Bella-Vista-Zugang anmelden.</p></header><section className="karte"><AnmeldeFormular /></section></main>;
}
