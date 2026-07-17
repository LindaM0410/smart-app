CREATE TABLE "Mitarbeiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "benutzername" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "hauptstandortId" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Mitarbeiter_hauptstandortId_fkey" FOREIGN KEY ("hauptstandortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mitarbeiter_rolle_check" CHECK ("rolle" IN ('inhaber', 'manager', 'bedienung', 'kueche'))
);

CREATE UNIQUE INDEX "Mitarbeiter_benutzername_key" ON "Mitarbeiter"("benutzername");
CREATE INDEX "Mitarbeiter_hauptstandortId_idx" ON "Mitarbeiter"("hauptstandortId");
