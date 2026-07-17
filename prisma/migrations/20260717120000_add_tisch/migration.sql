-- CreateTable
CREATE TABLE "Tisch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standortId" TEXT NOT NULL,
    "nummer" TEXT NOT NULL,
    "kapazitaet" INTEGER NOT NULL,
    "bereich" TEXT NOT NULL,
    "kombinierbar" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Tisch_standortId_fkey" FOREIGN KEY ("standortId") REFERENCES "Standort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Tisch_standortId_idx" ON "Tisch"("standortId");

-- CreateIndex
CREATE UNIQUE INDEX "Tisch_standortId_nummer_key" ON "Tisch"("standortId", "nummer");
