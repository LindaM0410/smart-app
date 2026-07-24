CREATE TABLE "CateringAuftrag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmenkundenkontaktId" TEXT NOT NULL,
    "lieferadresse" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "uhrzeit" TEXT NOT NULL,
    "personenanzahl" INTEGER NOT NULL,
    "menueBeschreibung" TEXT NOT NULL,
    "preisGesamtCent" INTEGER NOT NULL,
    "notiz" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'angefragt',
    CONSTRAINT "CateringAuftrag_firmenkundenkontaktId_fkey"
      FOREIGN KEY ("firmenkundenkontaktId")
      REFERENCES "Firmenkundenkontakt" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
);

CREATE INDEX "CateringAuftrag_firmenkundenkontaktId_idx"
ON "CateringAuftrag"("firmenkundenkontaktId");

CREATE INDEX "CateringAuftrag_datum_idx"
ON "CateringAuftrag"("datum");
