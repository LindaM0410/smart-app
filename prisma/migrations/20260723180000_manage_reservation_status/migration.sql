CREATE TRIGGER "Reservierung_status_gueltig_insert"
BEFORE INSERT ON "Reservierung"
WHEN NEW."status" NOT IN ('angefragt', 'bestaetigt', 'storniert', 'noShow', 'abgeschlossen')
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_STATUS_UNGUELTIG');
END;

CREATE TRIGGER "Reservierung_statusfolge_update"
BEFORE UPDATE OF "status" ON "Reservierung"
WHEN NEW."status" <> OLD."status"
  AND NOT (
    (OLD."status" = 'angefragt' AND NEW."status" IN ('bestaetigt', 'storniert'))
    OR
    (OLD."status" = 'bestaetigt' AND NEW."status" IN ('storniert', 'noShow', 'abgeschlossen'))
  )
BEGIN
  SELECT RAISE(ABORT, 'RESERVIERUNG_STATUSWECHSEL_UNGUELTIG');
END;
