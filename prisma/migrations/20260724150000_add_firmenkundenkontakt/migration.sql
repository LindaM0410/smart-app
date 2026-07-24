CREATE TABLE "Firmenkundenkontakt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmenname" TEXT NOT NULL,
    "ansprechperson" TEXT NOT NULL,
    "kontaktdaten" TEXT NOT NULL,
    "notiz" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);
