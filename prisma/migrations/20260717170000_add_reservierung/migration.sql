CREATE TABLE "Reservierung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gastId" TEXT NOT NULL,
    "standortId" TEXT NOT NULL,
    "beginn" DATETIME NOT NULL,
    "ende" DATETIME NOT NULL,
    "personenanzahl" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notiz" TEXT NOT NULL,
    "istGruppe" BOOLEAN NOT NULL DEFAULT false,
    "erstelltVonMitarbeiterId" TEXT NOT NULL,
    CONSTRAINT "Reservierung_gastId_fkey" FOREIGN KEY ("gastId") REFERENCES "Gast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservierung_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Reservierung_gastId_idx" ON "Reservierung"("gastId");
CREATE INDEX "Reservierung_standortId_idx" ON "Reservierung"("standortId");
CREATE INDEX "Reservierung_beginn_ende_idx" ON "Reservierung"("beginn", "ende");
