CREATE TABLE "Bestellposition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bestellungId" TEXT NOT NULL,
    "artikelId" TEXT NOT NULL,
    "menge" INTEGER NOT NULL,
    "einzelpreisCent" INTEGER NOT NULL,
    "sonderwunsch" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    CONSTRAINT "Bestellposition_bestellungId_fkey" FOREIGN KEY ("bestellungId") REFERENCES "Bestellung" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bestellposition_artikelId_fkey" FOREIGN KEY ("artikelId") REFERENCES "Artikel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Bestellposition_bestellungId_idx" ON "Bestellposition"("bestellungId");
CREATE INDEX "Bestellposition_artikelId_idx" ON "Bestellposition"("artikelId");

CREATE TRIGGER "Bestellposition_nur_gueltiger_Kontext"
BEFORE INSERT ON "Bestellposition"
WHEN NEW."status" <> 'offen'
  OR typeof(NEW."menge") <> 'integer'
  OR NEW."menge" <= 0
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
      AND artikel."aktiv" = 1
      AND standort."aktiv" = 1
      AND artikel."preisCent" = NEW."einzelpreisCent"
  )
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_UNGUELTIG');
END;

CREATE TRIGGER "Bestellposition_gueltigen_Kontext_bewahren"
BEFORE UPDATE ON "Bestellposition"
WHEN NEW."bestellungId" <> OLD."bestellungId"
  OR NEW."artikelId" <> OLD."artikelId"
  OR NEW."einzelpreisCent" <> OLD."einzelpreisCent"
  OR NEW."status" <> OLD."status"
  OR NEW."status" <> 'offen'
  OR typeof(NEW."menge") <> 'integer'
  OR NEW."menge" <= 0
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
      AND artikel."aktiv" = 1
      AND standort."aktiv" = 1
  )
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_UNGUELTIG');
END;

CREATE TRIGGER "Bestellung_Angebot_der_Positionen_bewahren"
BEFORE UPDATE OF "standortId", "status" ON "Bestellung"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellposition" AS position
  JOIN "Artikel" AS artikel ON artikel."id" = position."artikelId"
  WHERE position."bestellungId" = OLD."id"
    AND (
      NEW."status" <> 'offen'
      OR artikel."aktiv" <> 1
      OR NOT EXISTS (
        SELECT 1 FROM "ArtikelStandort" AS angebot
        WHERE angebot."artikelId" = position."artikelId"
          AND angebot."standortId" = NEW."standortId"
      )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_UNGUELTIG');
END;
