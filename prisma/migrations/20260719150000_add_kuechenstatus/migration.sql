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
    AND NOT (
      (OLD."status" = 'offen' AND NEW."status" = 'inZubereitung')
      OR (OLD."status" = 'inZubereitung' AND NEW."status" = 'serviert')
    )
  )
  OR (NEW."status" = OLD."status" AND OLD."status" <> 'offen')
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
