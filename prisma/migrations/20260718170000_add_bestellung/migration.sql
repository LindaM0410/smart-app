CREATE TABLE "Bestellung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standortId" TEXT NOT NULL,
    "tischId" TEXT NOT NULL,
    "reservierungId" TEXT,
    "aufgenommenVonMitarbeiterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bestellung_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bestellung_tischId_fkey" FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bestellung_reservierungId_fkey" FOREIGN KEY ("reservierungId") REFERENCES "Reservierung" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bestellung_aufgenommenVonMitarbeiterId_fkey" FOREIGN KEY ("aufgenommenVonMitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Bestellung_standortId_idx" ON "Bestellung"("standortId");
CREATE INDEX "Bestellung_tischId_idx" ON "Bestellung"("tischId");
CREATE INDEX "Bestellung_reservierungId_idx" ON "Bestellung"("reservierungId");
CREATE INDEX "Bestellung_aufgenommenVonMitarbeiterId_idx" ON "Bestellung"("aufgenommenVonMitarbeiterId");

CREATE TRIGGER "Bestellung_nur_gueltiger_Standortkontext"
BEFORE INSERT ON "Bestellung"
WHEN NEW."status" <> 'offen' OR NOT EXISTS (
  SELECT 1
  FROM "Standort" AS standort
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  JOIN "Mitarbeiter" AS mitarbeiter ON mitarbeiter."id" = NEW."aufgenommenVonMitarbeiterId"
  WHERE standort."id" = NEW."standortId"
    AND standort."aktiv" = 1
    AND tisch."standortId" = NEW."standortId"
    AND tisch."aktiv" = 1
    AND mitarbeiter."hauptstandortId" = NEW."standortId"
    AND mitarbeiter."aktiv" = 1
    AND (NEW."reservierungId" IS NULL OR EXISTS (
      SELECT 1 FROM "Reservierung" AS reservierung
      WHERE reservierung."id" = NEW."reservierungId"
        AND reservierung."standortId" = NEW."standortId"
    ))
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLUNG_UNGUELTIG');
END;

CREATE TRIGGER "Bestellung_gueltigen_Standortkontext_bewahren"
BEFORE UPDATE OF "standortId", "tischId", "reservierungId", "aufgenommenVonMitarbeiterId", "status" ON "Bestellung"
WHEN NEW."status" <> 'offen' OR NOT EXISTS (
  SELECT 1
  FROM "Standort" AS standort
  JOIN "Tisch" AS tisch ON tisch."id" = NEW."tischId"
  JOIN "Mitarbeiter" AS mitarbeiter ON mitarbeiter."id" = NEW."aufgenommenVonMitarbeiterId"
  WHERE standort."id" = NEW."standortId"
    AND standort."aktiv" = 1
    AND tisch."standortId" = NEW."standortId"
    AND tisch."aktiv" = 1
    AND mitarbeiter."hauptstandortId" = NEW."standortId"
    AND mitarbeiter."aktiv" = 1
    AND (NEW."reservierungId" IS NULL OR EXISTS (
      SELECT 1 FROM "Reservierung" AS reservierung
      WHERE reservierung."id" = NEW."reservierungId"
        AND reservierung."standortId" = NEW."standortId"
    ))
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLUNG_UNGUELTIG');
END;
