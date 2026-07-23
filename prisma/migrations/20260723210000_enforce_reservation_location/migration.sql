CREATE TRIGGER "ReservierungTisch_nur_eigener_Standort_insert"
BEFORE INSERT ON "ReservierungTisch"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Reservierung" AS reservierung
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  WHERE reservierung."id" = NEW."reservierungId"
    AND reservierung."standortId" = tisch."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_TISCH_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "ReservierungTisch_nur_eigener_Standort_update"
BEFORE UPDATE OF "reservierungId", "tischId" ON "ReservierungTisch"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Reservierung" AS reservierung
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  WHERE reservierung."id" = NEW."reservierungId"
    AND reservierung."standortId" = tisch."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_TISCH_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Reservierung_Standortbindung_bewahren"
BEFORE UPDATE OF "standortId" ON "Reservierung"
WHEN EXISTS (
  SELECT 1
  FROM "ReservierungTisch" AS zuordnung
  JOIN "Tisch" AS tisch ON tisch."id" = zuordnung."tischId"
  WHERE zuordnung."reservierungId" = OLD."id"
    AND tisch."standortId" <> NEW."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_TISCH_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Tisch_Reservierungsstandort_bewahren"
BEFORE UPDATE OF "standortId" ON "Tisch"
WHEN EXISTS (
  SELECT 1
  FROM "ReservierungTisch" AS zuordnung
  JOIN "Reservierung" AS reservierung ON reservierung."id" = zuordnung."reservierungId"
  WHERE zuordnung."tischId" = OLD."id"
    AND reservierung."standortId" <> NEW."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_TISCH_STANDORT_UNGUELTIG');
END;

DROP TRIGGER "ReservierungTisch_keine_Doppelbuchung_insert";
DROP TRIGGER "ReservierungTisch_keine_Doppelbuchung_update";
DROP TRIGGER "Reservierung_keine_Doppelbuchung_update";

CREATE TRIGGER "ReservierungTisch_keine_Doppelbuchung_insert"
BEFORE INSERT ON "ReservierungTisch"
WHEN EXISTS (
  SELECT 1
  FROM "Reservierung" AS neu
  JOIN "Tisch" AS neuerTisch
    ON neuerTisch."id" = NEW."tischId"
    AND neuerTisch."standortId" = neu."standortId"
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
  JOIN "Tisch" AS neuerTisch
    ON neuerTisch."id" = NEW."tischId"
    AND neuerTisch."standortId" = neu."standortId"
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
WHEN NEW."status" IN ('angefragt', 'bestaetigt')
  AND NOT EXISTS (
    SELECT 1
    FROM "ReservierungTisch" AS eigeneTische
    JOIN "Tisch" AS tisch ON tisch."id" = eigeneTische."tischId"
    WHERE eigeneTische."reservierungId" = NEW."id"
      AND tisch."standortId" <> NEW."standortId"
  )
  AND EXISTS (
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
