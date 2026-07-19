ALTER TABLE "Bestellposition" ADD COLUMN "storniertAm" DATETIME;
ALTER TABLE "Bestellposition" ADD COLUMN "storniertVonMitarbeiterId" TEXT REFERENCES "Mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Bestellposition_storniertVonMitarbeiterId_idx"
ON "Bestellposition"("storniertVonMitarbeiterId");

DROP TRIGGER "Bestellposition_gueltigen_Kontext_bewahren";

CREATE TRIGGER "Bestellposition_gueltigen_Kontext_bewahren"
BEFORE UPDATE ON "Bestellposition"
WHEN NEW."bestellungId" <> OLD."bestellungId"
  OR NEW."artikelId" <> OLD."artikelId"
  OR NEW."einzelpreisCent" <> OLD."einzelpreisCent"
  OR typeof(NEW."menge") <> 'integer'
  OR NEW."menge" <= 0
  OR (
    NEW."status" <> OLD."status"
    AND (NEW."menge" <> OLD."menge" OR NEW."sonderwunsch" <> OLD."sonderwunsch")
  )
  OR (
    NEW."status" <> OLD."status"
    AND NOT (
      (OLD."status" = 'offen' AND NEW."status" = 'inZubereitung'
        AND NEW."storniertAm" IS NULL AND NEW."storniertVonMitarbeiterId" IS NULL)
      OR (OLD."status" = 'inZubereitung' AND NEW."status" = 'serviert'
        AND NEW."storniertAm" IS NULL AND NEW."storniertVonMitarbeiterId" IS NULL)
      OR (
        OLD."status" IN ('offen', 'inZubereitung')
        AND NEW."status" = 'storniert'
        AND NEW."storniertAm" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM "Mitarbeiter" AS mitarbeiter
          WHERE mitarbeiter."id" = NEW."storniertVonMitarbeiterId"
            AND mitarbeiter."aktiv" = 1
            AND mitarbeiter."rolle" IN ('manager', 'inhaber')
        )
      )
    )
  )
  OR (
    NEW."status" = OLD."status"
    AND (
      OLD."status" <> 'offen'
      OR NEW."storniertAm" IS NOT OLD."storniertAm"
      OR NEW."storniertVonMitarbeiterId" IS NOT OLD."storniertVonMitarbeiterId"
    )
  )
  OR NOT EXISTS (
    SELECT 1
    FROM "Bestellung" AS bestellung
    JOIN "Artikel" AS artikel ON artikel."id" = NEW."artikelId"
    JOIN "ArtikelStandort" AS angebot
      ON angebot."artikelId" = artikel."id"
      AND angebot."standortId" = bestellung."standortId"
    JOIN "Standort" AS standort ON standort."id" = bestellung."standortId"
    WHERE bestellung."id" = NEW."bestellungId"
      AND bestellung."status" = 'offen'
      AND standort."aktiv" = 1
  )
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_UNGUELTIG');
END;
