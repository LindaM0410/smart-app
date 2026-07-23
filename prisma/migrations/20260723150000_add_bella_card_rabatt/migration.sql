ALTER TABLE "Rechnung" ADD COLUMN "zahlerGastId" TEXT REFERENCES "Gast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Rechnung" ADD COLUMN "rabattbetragCent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Rechnung" ADD COLUMN "endbetragCent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Rechnung" ADD COLUMN "rabattFreigegebenVonMitarbeiterId" TEXT REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Rechnung" SET "endbetragCent" = "bruttobetragCent";

CREATE INDEX "Rechnung_zahlerGastId_idx" ON "Rechnung"("zahlerGastId");
CREATE INDEX "Rechnung_rabattFreigegebenVonMitarbeiterId_idx" ON "Rechnung"("rabattFreigegebenVonMitarbeiterId");

DROP TRIGGER "Rechnung_gueltigen_Snapshot_anlegen";
DROP TRIGGER "Rechnung_nur_bezahlen";

CREATE TRIGGER "Rechnung_gueltigen_Snapshot_anlegen"
BEFORE INSERT ON "Rechnung"
WHEN NEW."status" <> 'offen'
  OR NEW."zahlungsart" IS NOT NULL
  OR NEW."bezahltAm" IS NOT NULL
  OR NEW."zahlerGastId" IS NOT NULL
  OR NEW."rabattbetragCent" <> 0
  OR NEW."endbetragCent" <> NEW."bruttobetragCent"
  OR NEW."rabattFreigegebenVonMitarbeiterId" IS NOT NULL
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

CREATE TRIGGER "Rechnung_nur_gueltig_aendern"
BEFORE UPDATE ON "Rechnung"
WHEN NEW."id" <> OLD."id"
  OR NEW."bestellungId" <> OLD."bestellungId"
  OR NEW."bruttobetragCent" <> OLD."bruttobetragCent"
  OR NEW."erstelltAm" <> OLD."erstelltAm"
  OR (
    NEW."status" = 'offen'
    AND (
      OLD."status" <> 'offen'
      OR NEW."zahlungsart" IS NOT NULL
      OR NEW."bezahltAm" IS NOT NULL
      OR (
        NEW."zahlerGastId" IS NULL
        AND (
          NEW."rabattbetragCent" <> 0
          OR NEW."endbetragCent" <> NEW."bruttobetragCent"
          OR NEW."rabattFreigegebenVonMitarbeiterId" IS NOT NULL
        )
      )
      OR (
        NEW."zahlerGastId" IS NOT NULL
        AND (
          NOT EXISTS (
            SELECT 1 FROM "Gast"
            WHERE "id" = NEW."zahlerGastId" AND "aktiv" = 1
          )
          OR (
            NEW."rabattFreigegebenVonMitarbeiterId" IS NULL
            AND (
              NEW."rabattbetragCent" <> 0
              OR NEW."endbetragCent" <> NEW."bruttobetragCent"
            )
          )
          OR (
            NEW."rabattFreigegebenVonMitarbeiterId" IS NOT NULL
            AND (
              NOT EXISTS (
                SELECT 1 FROM "Gast"
                WHERE "id" = NEW."zahlerGastId" AND "hatBellaCard" = 1
              )
              OR NEW."rabattbetragCent" <> (
                (NEW."bruttobetragCent" / 100) * 15
                + (((NEW."bruttobetragCent" % 100) * 15 + 50) / 100)
              )
              OR NEW."endbetragCent" <> NEW."bruttobetragCent" - NEW."rabattbetragCent"
              OR NOT EXISTS (
                SELECT 1 FROM "Mitarbeiter"
                WHERE "id" = NEW."rabattFreigegebenVonMitarbeiterId"
                  AND "aktiv" = 1
                  AND "rolle" IN ('inhaber', 'manager')
              )
            )
          )
        )
      )
    )
  )
  OR (
    NEW."status" = 'bezahlt'
    AND (
      OLD."status" <> 'offen'
      OR NEW."zahlungsart" NOT IN ('bar', 'karte')
      OR NEW."bezahltAm" IS NULL
      OR NEW."zahlerGastId" IS NOT OLD."zahlerGastId"
      OR NEW."rabattbetragCent" <> OLD."rabattbetragCent"
      OR NEW."endbetragCent" <> OLD."endbetragCent"
      OR NEW."rabattFreigegebenVonMitarbeiterId" IS NOT OLD."rabattFreigegebenVonMitarbeiterId"
    )
  )
  OR NEW."status" NOT IN ('offen', 'bezahlt')
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_AENDERUNG_UNGUELTIG');
END;
