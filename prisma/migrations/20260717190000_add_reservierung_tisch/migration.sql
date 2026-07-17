CREATE TABLE "ReservierungTisch" (
    "reservierungId" TEXT NOT NULL,
    "tischId" TEXT NOT NULL,
    PRIMARY KEY ("reservierungId", "tischId"),
    CONSTRAINT "ReservierungTisch_reservierungId_fkey" FOREIGN KEY ("reservierungId") REFERENCES "Reservierung" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReservierungTisch_tischId_fkey" FOREIGN KEY ("tischId") REFERENCES "Tisch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ReservierungTisch_tischId_idx" ON "ReservierungTisch"("tischId");
