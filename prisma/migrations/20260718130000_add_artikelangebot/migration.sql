CREATE TABLE "Artikel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "preisCent" INTEGER NOT NULL,
    "benoetigtGrill" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ArtikelStandort" (
    "artikelId" TEXT NOT NULL,
    "standortId" TEXT NOT NULL,
    PRIMARY KEY ("artikelId", "standortId"),
    CONSTRAINT "ArtikelStandort_artikelId_fkey" FOREIGN KEY ("artikelId") REFERENCES "Artikel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArtikelStandort_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ArtikelStandort_standortId_idx" ON "ArtikelStandort"("standortId");

CREATE TRIGGER "ArtikelStandort_nur_gueltiges_Angebot"
BEFORE INSERT ON "ArtikelStandort"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Artikel" AS artikel
  JOIN "Standort" AS standort ON standort."id" = NEW."standortId"
  WHERE artikel."id" = NEW."artikelId"
    AND artikel."aktiv" = 1
    AND standort."aktiv" = 1
    AND (artikel."benoetigtGrill" = 0 OR standort."hatGrill" = 1)
)
BEGIN
  SELECT RAISE(ABORT, 'ARTIKELANGEBOT_UNGUELTIG');
END;

CREATE TRIGGER "ArtikelStandort_gueltigkeit_bewahren"
BEFORE UPDATE OF "artikelId", "standortId" ON "ArtikelStandort"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Artikel" AS artikel
  JOIN "Standort" AS standort ON standort."id" = NEW."standortId"
  WHERE artikel."id" = NEW."artikelId"
    AND artikel."aktiv" = 1
    AND standort."aktiv" = 1
    AND (artikel."benoetigtGrill" = 0 OR standort."hatGrill" = 1)
)
BEGIN
  SELECT RAISE(ABORT, 'ARTIKELANGEBOT_UNGUELTIG');
END;

CREATE TRIGGER "Artikel_Angebotsgueltigkeit_bewahren"
BEFORE UPDATE OF "aktiv", "benoetigtGrill" ON "Artikel"
WHEN EXISTS (
  SELECT 1
  FROM "ArtikelStandort" AS angebot
  JOIN "Standort" AS standort ON standort."id" = angebot."standortId"
  WHERE angebot."artikelId" = OLD."id"
    AND (NEW."aktiv" <> 1 OR (NEW."benoetigtGrill" = 1 AND standort."hatGrill" <> 1))
)
BEGIN
  SELECT RAISE(ABORT, 'ARTIKEL_WIRD_ANGEBOTEN');
END;

CREATE TRIGGER "Standort_Angebotsgueltigkeit_bewahren"
BEFORE UPDATE OF "aktiv", "hatGrill" ON "Standort"
WHEN EXISTS (
  SELECT 1
  FROM "ArtikelStandort" AS angebot
  JOIN "Artikel" AS artikel ON artikel."id" = angebot."artikelId"
  WHERE angebot."standortId" = OLD."id"
    AND (NEW."aktiv" <> 1 OR (NEW."hatGrill" <> 1 AND artikel."benoetigtGrill" = 1))
)
BEGIN
  SELECT RAISE(ABORT, 'STANDORT_HAT_ARTIKELANGEBOT');
END;
