export const TISCHSTATUS = ["frei", "baldReserviert", "belegt"] as const;

export type Tischstatus = (typeof TISCHSTATUS)[number];

type Statusgrundlage = {
  hatOffeneBelegung: boolean;
  reservierungsbeginne: Date[];
};

const SECHZIG_MINUTEN = 60 * 60 * 1000;

export function ermittleTischstatus(
  grundlage: Statusgrundlage,
  referenzzeit: Date,
): Tischstatus {
  if (grundlage.hatOffeneBelegung) return "belegt";

  const grenze = referenzzeit.getTime() + SECHZIG_MINUTEN;
  const istBaldReserviert = grundlage.reservierungsbeginne.some((beginn) =>
    beginn.getTime() >= referenzzeit.getTime() && beginn.getTime() <= grenze
  );

  return istBaldReserviert ? "baldReserviert" : "frei";
}

const berlinFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function berlinTeile(zeitpunkt: Date) {
  const teile = Object.fromEntries(
    berlinFormat.formatToParts(zeitpunkt).map((teil) => [teil.type, teil.value]),
  );
  return `${teile.year}-${teile.month}-${teile.day}T${teile.hour}:${teile.minute}`;
}

export function berlinZeitpunkt(datum: string, uhrzeit: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}$/.test(uhrzeit)) return null;

  const [jahr, monat, tag] = datum.split("-").map(Number);
  const [stunde, minute] = uhrzeit.split(":").map(Number);
  const lokalerUtcWert = Date.UTC(jahr, monat - 1, tag, stunde, minute);
  let ergebnis = new Date(lokalerUtcWert);

  for (let versuch = 0; versuch < 2; versuch += 1) {
    const teile = Object.fromEntries(
      berlinFormat.formatToParts(ergebnis).map((teil) => [teil.type, teil.value]),
    );
    const dargestellterUtcWert = Date.UTC(
      Number(teile.year), Number(teile.month) - 1, Number(teile.day),
      Number(teile.hour), Number(teile.minute),
    );
    ergebnis = new Date(ergebnis.getTime() + lokalerUtcWert - dargestellterUtcWert);
  }

  return berlinTeile(ergebnis) === `${datum}T${uhrzeit}` ? ergebnis : null;
}

export function folgetag(datum: string) {
  const [jahr, monat, tag] = datum.split("-").map(Number);
  const morgen = new Date(Date.UTC(jahr, monat - 1, tag + 1));
  return morgen.toISOString().slice(0, 10);
}

