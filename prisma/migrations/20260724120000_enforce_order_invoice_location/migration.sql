CREATE TRIGGER "Tisch_Bestellstandort_bewahren"
BEFORE UPDATE OF "standortId" ON "Tisch"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellung"
  WHERE "tischId" = OLD."id"
    AND "standortId" <> NEW."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLUNG_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Reservierung_Bestellstandort_bewahren"
BEFORE UPDATE OF "standortId" ON "Reservierung"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellung"
  WHERE "reservierungId" = OLD."id"
    AND "standortId" <> NEW."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLUNG_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Mitarbeiter_Bestellstandort_bewahren"
BEFORE UPDATE OF "hauptstandortId" ON "Mitarbeiter"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellung"
  WHERE "aufgenommenVonMitarbeiterId" = OLD."id"
    AND "standortId" <> NEW."hauptstandortId"
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLUNG_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "ArtikelStandort_Bestellpositionen_bewahren"
BEFORE DELETE ON "ArtikelStandort"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellposition" AS position
  JOIN "Bestellung" AS bestellung ON bestellung."id" = position."bestellungId"
  WHERE position."artikelId" = OLD."artikelId"
    AND bestellung."standortId" = OLD."standortId"
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "ArtikelStandort_Aenderung_mit_Bestellpositionen_sperren"
BEFORE UPDATE OF "artikelId", "standortId" ON "ArtikelStandort"
WHEN EXISTS (
  SELECT 1
  FROM "Bestellposition" AS position
  JOIN "Bestellung" AS bestellung ON bestellung."id" = position."bestellungId"
  WHERE position."artikelId" = OLD."artikelId"
    AND bestellung."standortId" = OLD."standortId"
    AND (
      NEW."artikelId" <> OLD."artikelId"
      OR NEW."standortId" <> OLD."standortId"
    )
)
BEGIN
  SELECT RAISE(ABORT, 'BESTELLPOSITION_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Rechnung_nur_standortkonsistente_Bestellung"
BEFORE INSERT ON "Rechnung"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Bestellung" AS bestellung
  JOIN "Tisch" AS tisch ON tisch."id" = bestellung."tischId"
  JOIN "Mitarbeiter" AS mitarbeiter
    ON mitarbeiter."id" = bestellung."aufgenommenVonMitarbeiterId"
  WHERE bestellung."id" = NEW."bestellungId"
    AND tisch."standortId" = bestellung."standortId"
    AND mitarbeiter."hauptstandortId" = bestellung."standortId"
    AND (
      bestellung."reservierungId" IS NULL
      OR EXISTS (
        SELECT 1
        FROM "Reservierung" AS reservierung
        WHERE reservierung."id" = bestellung."reservierungId"
          AND reservierung."standortId" = bestellung."standortId"
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "Bestellposition" AS position
      WHERE position."bestellungId" = bestellung."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "ArtikelStandort" AS angebot
          WHERE angebot."artikelId" = position."artikelId"
            AND angebot."standortId" = bestellung."standortId"
        )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_STANDORT_UNGUELTIG');
END;

CREATE TRIGGER "Rechnung_Standortkontext_bewahren"
BEFORE UPDATE ON "Rechnung"
WHEN NOT EXISTS (
  SELECT 1
  FROM "Bestellung" AS bestellung
  JOIN "Tisch" AS tisch ON tisch."id" = bestellung."tischId"
  JOIN "Mitarbeiter" AS mitarbeiter
    ON mitarbeiter."id" = bestellung."aufgenommenVonMitarbeiterId"
  WHERE bestellung."id" = NEW."bestellungId"
    AND tisch."standortId" = bestellung."standortId"
    AND mitarbeiter."hauptstandortId" = bestellung."standortId"
    AND (
      bestellung."reservierungId" IS NULL
      OR EXISTS (
        SELECT 1
        FROM "Reservierung" AS reservierung
        WHERE reservierung."id" = bestellung."reservierungId"
          AND reservierung."standortId" = bestellung."standortId"
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "Bestellposition" AS position
      WHERE position."bestellungId" = bestellung."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "ArtikelStandort" AS angebot
          WHERE angebot."artikelId" = position."artikelId"
            AND angebot."standortId" = bestellung."standortId"
        )
    )
)
BEGIN
  SELECT RAISE(ABORT, 'RECHNUNG_STANDORT_UNGUELTIG');
END;
