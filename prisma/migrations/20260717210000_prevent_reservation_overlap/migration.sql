CREATE TRIGGER "ReservierungTisch_keine_Doppelbuchung_insert"
BEFORE INSERT ON "ReservierungTisch"
WHEN EXISTS (
  SELECT 1
  FROM "Reservierung" AS neu
  JOIN "ReservierungTisch" AS zuordnung ON zuordnung."tischId" = NEW."tischId"
  JOIN "Reservierung" AS vorhanden ON vorhanden."id" = zuordnung."reservierungId"
  WHERE neu."id" = NEW."reservierungId"
    AND neu."status" IN ('angefragt', 'bestaetigt')
    AND vorhanden."status" IN ('angefragt', 'bestaetigt')
    AND vorhanden."id" <> neu."id"
    AND vorhanden."beginn" < neu."ende"
    AND vorhanden."ende" > neu."beginn"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_DOPPELBUCHUNG');
END;

CREATE TRIGGER "ReservierungTisch_keine_Doppelbuchung_update"
BEFORE UPDATE OF "tischId", "reservierungId" ON "ReservierungTisch"
WHEN EXISTS (
  SELECT 1
  FROM "Reservierung" AS neu
  JOIN "ReservierungTisch" AS zuordnung ON zuordnung."tischId" = NEW."tischId"
  JOIN "Reservierung" AS vorhanden ON vorhanden."id" = zuordnung."reservierungId"
  WHERE neu."id" = NEW."reservierungId"
    AND neu."status" IN ('angefragt', 'bestaetigt')
    AND vorhanden."status" IN ('angefragt', 'bestaetigt')
    AND vorhanden."id" <> neu."id"
    AND vorhanden."beginn" < neu."ende"
    AND vorhanden."ende" > neu."beginn"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_DOPPELBUCHUNG');
END;

CREATE TRIGGER "Reservierung_keine_Doppelbuchung_update"
BEFORE UPDATE OF "beginn", "ende", "status" ON "Reservierung"
WHEN NEW."status" IN ('angefragt', 'bestaetigt') AND EXISTS (
  SELECT 1
  FROM "ReservierungTisch" AS eigeneTische
  JOIN "ReservierungTisch" AS andereTische
    ON andereTische."tischId" = eigeneTische."tischId"
  JOIN "Reservierung" AS vorhanden ON vorhanden."id" = andereTische."reservierungId"
  WHERE eigeneTische."reservierungId" = NEW."id"
    AND vorhanden."id" <> NEW."id"
    AND vorhanden."status" IN ('angefragt', 'bestaetigt')
    AND vorhanden."beginn" < NEW."ende"
    AND vorhanden."ende" > NEW."beginn"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_DOPPELBUCHUNG');
END;
