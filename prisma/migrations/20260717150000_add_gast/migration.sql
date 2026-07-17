-- CreateTable
CREATE TABLE "Gast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "notiz" TEXT NOT NULL,
    "istStammgast" BOOLEAN NOT NULL DEFAULT false,
    "hatBellaCard" BOOLEAN NOT NULL DEFAULT false,
    "besuchsanzahl" INTEGER NOT NULL DEFAULT 0,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);
