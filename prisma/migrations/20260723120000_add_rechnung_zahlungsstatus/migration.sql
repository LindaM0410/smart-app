ALTER TABLE "Rechnung" ADD COLUMN "zahlungsart" TEXT;
ALTER TABLE "Rechnung" ADD COLUMN "bezahltAm" DATETIME;

DROP TRIGGER "Rechnung_gueltigen_Snapshot_anlegen";
DROP TRIGGER "Rechnung_Snapshot_unveraenderlich";

CREATE TRIGGER "Rechnung_gueltigen_Snapshot_anlegen"
BEFORE INSERT ON "Rechnung"
WHEN NEW."status" <> 'offen'
  OR NEW."zahlungsart" IS NOT NULL
  OR NEW."bezahltAm" IS NOT NULL
  OR typeof(NEW."bruttobetragCent") <> 'integer'
  OR NEW."bruttobetragCent" < 0
  OR NOT EXISTS (
    SELECT 1 FROM "Bestellposition"
    WHERE "bestellungId" = NEW."bestellungId" AND "status" <> 'storniert'
  )
  OR NEW."bruttobetragCent" <> (
    SELECT COALESCE(SUM("menge" * "einzelpreisCent"), 0)
    FROM "Bestellposition"
    WHERE "bestellungId" = NEW."bestellungId" AND "status" <> 'storniert'
  )
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_UNGUELTIG');
END;

CREATE TRIGGER "Rechnung_nur_bezahlen"
BEFORE UPDATE ON "Rechnung"
WHEN OLD."status" <> 'offen'
  OR NEW."status" <> 'bezahlt'
  OR NEW."zahlungsart" NOT IN ('bar', 'karte')
  OR NEW."bezahltAm" IS NULL
  OR NEW."id" <> OLD."id"
  OR NEW."bestellungId" <> OLD."bestellungId"
  OR NEW."bruttobetragCent" <> OLD."bruttobetragCent"
  OR NEW."erstelltAm" <> OLD."erstelltAm"
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_ZAHLUNG_UNGUELTIG');
END;
