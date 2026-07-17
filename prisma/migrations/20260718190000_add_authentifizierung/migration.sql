CREATE TABLE "MitarbeiterAuthentifizierung" (
    "mitarbeiterId" TEXT NOT NULL PRIMARY KEY,
    "passwortHash" TEXT NOT NULL,
    "aktualisiertAm" DATETIME NOT NULL,
    CONSTRAINT "MitarbeiterAuthentifizierung_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "MitarbeiterSitzung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "mitarbeiterId" TEXT NOT NULL,
    "gueltigBis" DATETIME NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MitarbeiterSitzung_mitarbeiterId_fkey" FOREIGN KEY ("mitarbeiterId") REFERENCES "Mitarbeiter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MitarbeiterSitzung_tokenHash_key" ON "MitarbeiterSitzung"("tokenHash");
CREATE INDEX "MitarbeiterSitzung_mitarbeiterId_idx" ON "MitarbeiterSitzung"("mitarbeiterId");
CREATE INDEX "MitarbeiterSitzung_gueltigBis_idx" ON "MitarbeiterSitzung"("gueltigBis");
