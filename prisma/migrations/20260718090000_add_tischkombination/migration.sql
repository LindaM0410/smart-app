CREATE TABLE "TischKombination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standortId" TEXT NOT NULL,
    "schluessel" TEXT NOT NULL,
    CONSTRAINT "TischKombination_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TischKombinationTisch" (
    "kombinationId" TEXT NOT NULL,
    "tischId" TEXT NOT NULL,
    PRIMARY KEY ("kombinationId", "tischId"),
    CONSTRAINT "TischKombinationTisch_kombinationId_fkey" FOREIGN KEY ("kombinationId") REFERENCES "TischKombination" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TischKombinationTisch_tischId_fkey" FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TischKombination_schluessel_key" ON "TischKombination"("schluessel");
CREATE INDEX "TischKombination_standortId_idx" ON "TischKombination"("standortId");
CREATE INDEX "TischKombinationTisch_tischId_idx" ON "TischKombinationTisch"("tischId");

CREATE TRIGGER "TischKombinationTisch_nur_gueltige_Tische"
BEFORE INSERT ON "TischKombinationTisch"
WHEN NOT EXISTS (
  SELECT 1
  FROM "TischKombination" AS kombination
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  WHERE kombination."id" = NEW."kombinationId"
    AND kombination."standortId" = tisch."standortId"
    AND tisch."aktiv" = 1
    AND tisch."kombinierbar" = 1
)
BEGIN
  SELECT RAISE(ABORT, 'TISCHKOMBINATION_UNGUELTIGER_TISCH');
END;

CREATE TRIGGER "TischKombinationTisch_gueltigkeit_bewahren"
BEFORE UPDATE OF "kombinationId", "tischId" ON "TischKombinationTisch"
WHEN NOT EXISTS (
  SELECT 1
  FROM "TischKombination" AS kombination
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  WHERE kombination."id" = NEW."kombinationId"
    AND kombination."standortId" = tisch."standortId"
    AND tisch."aktiv" = 1
    AND tisch."kombinierbar" = 1
)
BEGIN
  SELECT RAISE(ABORT, 'TISCHKOMBINATION_UNGUELTIGER_TISCH');
END;

CREATE TRIGGER "Tisch_Kombinationsgueltigkeit_bewahren"
BEFORE UPDATE OF "standortId", "aktiv", "kombinierbar" ON "Tisch"
WHEN EXISTS (
  SELECT 1
  FROM "TischKombinationTisch" AS mitglied
  JOIN "TischKombination" AS kombination ON kombination."id" = mitglied."kombinationId"
  WHERE mitglied."tischId" = OLD."id"
    AND (NEW."standortId" <> kombination."standortId" OR NEW."aktiv" <> 1 OR NEW."kombinierbar" <> 1)
)
BEGIN
  SELECT RAISE(ABORT, 'TISCH_WIRD_IN_KOMBINATION_VERWENDET');
END;
