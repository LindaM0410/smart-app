"use client";

import { useActionState } from "react";

import { anmeldenAction, type AnmeldeStatus } from "./actions";

const initialerStatus: AnmeldeStatus = {};

export function AnmeldeFormular() {
  const [status, action, ausstehend] = useActionState(anmeldenAction, initialerStatus);
  return (
    <form action={action} className="anmelde-formular">
      <label>Benutzername<input name="benutzername" autoComplete="username" required /></label>
      <label>Passwort<input name="passwort" type="password" autoComplete="current-password" required /></label>
      {status.meldung ? <p className="fehler" role="alert">{status.meldung}</p> : null}
      <button disabled={ausstehend} type="submit">{ausstehend ? "Anmeldung läuft …" : "Anmelden"}</button>
    </form>
  );
}
