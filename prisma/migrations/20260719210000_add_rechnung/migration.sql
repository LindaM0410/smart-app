CREATE TABLE "Rechnung" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bestellungId" TEXT NOT NULL,
  "bruttobetragCent" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'offen',
  "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rechnung_bestellungId_fkey"
    FOREIGN KEY ("bestellungId") REFERENCES "Bestellung" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Rechnung_bestellungId_key" ON "Rechnung"("bestellungId");

CREATE TRIGGER "Rechnung_gueltigen_Snapshot_anlegen"
BEFORE INSERT ON "Rechnung"
WHEN NEW."status" <> 'offen'
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

CREATE TRIGGER "Rechnung_Snapshot_unveraenderlich"
BEFORE UPDATE ON "Rechnung"
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_UNVERAENDERLICH');
END;
