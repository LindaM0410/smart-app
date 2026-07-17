CREATE TABLE "Belegung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tischId" TEXT NOT NULL,
    "reservierungId" TEXT NOT NULL,
    "beginn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ende" DATETIME,
    CONSTRAINT "Belegung_tischId_fkey" FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Belegung_reservierungId_fkey" FOREIGN KEY ("reservierungId") REFERENCES "Reservierung" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Belegung_tischId_ende_idx" ON "Belegung"("tischId", "ende");
CREATE INDEX "Belegung_reservierungId_idx" ON "Belegung"("reservierungId");

CREATE UNIQUE INDEX "Belegung_eine_offene_pro_Tisch"
ON "Belegung"("tischId")
WHERE "ende" IS NULL;

CREATE TRIGGER "Belegung_nur_zugeordneter_aktiver_Tisch"
BEFORE INSERT ON "Belegung"
WHEN NOT EXISTS (
  SELECT 1
  FROM "ReservierungTisch" AS zuordnung
  JOIN "Tisch" AS tisch ON tisch."id" = zuordnung."tischId"
  WHERE zuordnung."reservierungId" = NEW."reservierungId"
    AND zuordnung."tischId" = NEW."tischId"
    AND tisch."aktiv" = 1
)
BEGIN
  SELECT RAISE(ABORT, 'BELEGUNG_UNGUELTIGE_ZUORDNUNG');
END;
