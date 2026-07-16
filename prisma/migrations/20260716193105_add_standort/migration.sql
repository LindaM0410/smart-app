-- CreateTable
CREATE TABLE "Standort" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "sitzplaetze" INTEGER NOT NULL,
    "hatTerrasse" BOOLEAN NOT NULL,
    "hatGrill" BOOLEAN NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);
