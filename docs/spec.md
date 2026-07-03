# SPEC.md – Bella Vista Restaurant-App

## 1. Kontext und Ziel

Bella Vista ist ein italienisches Restaurant mit zwei Standorten in Berlin:

* Kreuzberg
* Spandau

Der Inhaber möchte die aktuelle Zettelwirtschaft im Restaurantbetrieb reduzieren. Besonders problematisch sind Reservierungen, Tischplanung, Bestellungen, Abrechnung, Stammgäste und Catering-Aufträge.

Das Ziel der Anwendung ist eine interne Restaurant-App für Mitarbeitende. Die App soll die wichtigsten Geschäftsobjekte, Beziehungen und Regeln so abbilden, dass Reservierungen, Tischverfügbarkeit, Bestellungen und Abrechnung zuverlässiger funktionieren.

Die wichtigste Priorität ist die Reservierungs- und Tischübersicht, weil dort aktuell der größte Schaden entsteht: doppelte Tischvergaben, fehlende Standortübersicht und unklare Verfügbarkeit.

---

## 2. Scope der ersten Version

Die erste Version der App konzentriert sich auf:

1. Verwaltung von Standorten und Tischen
2. Reservierungen mit Tischzuordnung und Status
3. Vermeidung von Doppelbuchungen
4. Walk-ins und zeitabhängige Tischverfügbarkeit
5. Digitale Bestellungen pro Tisch
6. Rechnungen aus Bestellungen
7. Stammgäste und Bella-Card-Rabatte
8. Grundlegende Verwaltung von Catering-Aufträgen und Firmenkunden

Nicht im Fokus der ersten Version:

* öffentliche Gast-App
* Online-Reservierung durch Gäste
* vollständige Kassenintegration
* automatische Marketingfunktionen
* vollständige Personalplanung
* Lieferdienst

---

## 3. Rollen

### 3.1 Inhaber

Der Inhaber darf alle Daten sehen und bearbeiten. Er darf Rabatte, Stornos, Speisekarte, Catering-Aufträge und Firmenkunden verwalten.

### 3.2 Manager

Manager dürfen Reservierungen planen, größere Gruppen koordinieren, Stornos und Rabatte freigeben sowie Gerichte, Getränke, Catering-Aufträge und Firmenkunden pflegen.

### 3.3 Bedienung

Bedienungen dürfen Reservierungen aufnehmen, Tische zuweisen, Gäste platzieren und Bestellungen aufnehmen oder ändern.

Bedienungen dürfen keine Rabatte oder Stornos ohne Freigabe durchführen.

### 3.4 Küche

Die Küche sieht Bestellungen, Änderungen und Stornos. Die Küche verwaltet keine Reservierungen, Rabatte oder Stammdaten.

---

## 4. Hauptentitäten

## 4.1 Standort

Ein Standort ist ein Bella-Vista-Restaurant.

| Attribut         | Beschreibung           |
| ---------------- | ---------------------- |
| standortId       | eindeutige ID          |
| name             | Kreuzberg oder Spandau |
| sitzplatzAnzahl  | Anzahl der Sitzplätze  |
| hatAussenbereich | ja/nein                |
| hatGrill         | ja/nein                |

Bekannte Ausprägungen:

* Kreuzberg: ca. 80 Sitzplätze, Innen- und Außenbereich, Terrasse, mehr Laufkundschaft
* Spandau: ca. 50 Sitzplätze, nur innen, kein Grill, ruhiger

---

## 4.2 Tisch

Ein Tisch ist ein reservierbarer Platz an einem Standort.

| Attribut     | Beschreibung               |
| ------------ | -------------------------- |
| tischId      | eindeutige ID              |
| standortId   | zugehöriger Standort       |
| nummer       | sichtbare Tischnummer      |
| sitzplaetze  | maximale Personenzahl      |
| bereich      | innen, außen oder terrasse |
| kombinierbar | ja/nein                    |

Tischkombinationen werden als konfigurierbare Stammdaten behandelt. Ein Tisch kann mit anderen Tischen kombinierbar sein, damit größere Gruppen platziert werden können. Die konkrete Kombination wird durch Inhaber oder Manager gepflegt.

---

## 4.3 Gast

Ein Gast ist eine Person, die reserviert, spontan kommt oder Stammgast ist.

| Attribut       | Beschreibung                |
| -------------- | --------------------------- |
| gastId         | eindeutige ID               |
| name           | Name des Gasts              |
| telefonnummer  | Kontakt und Wiedererkennung |
| istStammgast   | ja/nein                     |
| bellaCardAktiv | ja/nein                     |

Stammgäste werden vor allem über Name und Telefonnummer wiedererkannt. Der Bella-Card-Status ist wichtig für Rabatte.

---

## 4.4 Mitarbeiter

Ein Mitarbeiter ist eine interne Person mit einer Rolle in der App.

| Attribut        | Beschreibung                            |
| --------------- | --------------------------------------- |
| mitarbeiterId   | eindeutige ID                           |
| name            | Name                                    |
| benutzername    | Login-Name für die App                  |
| rolle           | inhaber, manager, bedienung oder kueche |
| stammstandortId | normaler Standort                       |
| aktiv           | ja/nein                                 |

Mitarbeitende können zwischen Kreuzberg und Spandau wechseln.

---

## 4.5 Reservierung

Eine Reservierung blockiert einen oder mehrere Tische für einen Zeitraum.

| Attribut       | Beschreibung                              |
| -------------- | ----------------------------------------- |
| reservierungId | eindeutige ID                             |
| gastId         | reservierender Gast                       |
| standortId     | Standort                                  |
| datum          | Datum                                     |
| uhrzeit        | Beginn                                    |
| personenAnzahl | Anzahl der Gäste                          |
| status         | bestätigt, storniert oder noShow          |
| notiz          | z. B. Fensterplatz, Allergie, Innen/Außen |

---

## 4.6 Bestellung

Eine Bestellung entsteht an einem Tisch und wird durch eine Bedienung aufgenommen.

| Attribut       | Beschreibung                            |
| -------------- | --------------------------------------- |
| bestellungId   | eindeutige ID                           |
| tischId        | zugehöriger Tisch                       |
| standortId     | Standort                                |
| aufgenommenVon | Mitarbeiter-ID                          |
| status         | offen, serviert, bezahlt oder storniert |
| zeitpunkt      | Zeitpunkt der Aufnahme                  |

Eine Bestellung enthält mehrere Bestellpositionen.

---

## 4.7 Firmenkunde

Ein Firmenkunde ist ein externer Kunde, der Catering-Aufträge anfragt oder regelmäßig bucht.

| Attribut       | Beschreibung                                      |
| -------------- | ------------------------------------------------- |
| firmenkundeId  | eindeutige ID                                     |
| firmenname     | Name der Firma                                    |
| ansprechperson | Kontaktperson                                     |
| telefon        | Telefonnummer                                     |
| email          | E-Mail-Adresse                                    |
| notiz          | z. B. frühere Veranstaltungen oder Besonderheiten |

Firmenkunden werden gespeichert, damit wiederkehrende Kontakte und frühere Catering-Aufträge leichter gefunden werden können.

---

## 4.8 CateringAuftrag

Ein Catering-Auftrag beschreibt eine externe Firmenveranstaltung.

| Attribut       | Beschreibung                                 |
| -------------- | -------------------------------------------- |
| cateringId     | eindeutige ID                                |
| firmenkundeId  | zugehöriger Firmenkunde                      |
| eventAdresse   | Veranstaltungsort                            |
| datum          | Eventdatum                                   |
| personenAnzahl | Anzahl der Personen                          |
| menue          | gewähltes Menü/Buffet                        |
| gesamtpreis    | Gesamtpreis                                  |
| status         | angefragt, bestätigt, geliefert oder bezahlt |

Catering ist kein normaler Lieferdienst, sondern ein wachsender Zusatzprozess für Firmenveranstaltungen.

---

## 5. Unterstützende Objekte und Stammdaten

Diese Objekte sind für die Umsetzung wichtig, werden aber nicht als Hauptentitäten gezählt.

### 5.1 ReservierungsTisch

ReservierungsTisch löst die n:m-Beziehung zwischen Reservierung und Tisch auf.

| Attribut             | Beschreibung            |
| -------------------- | ----------------------- |
| reservierungsTischId | eindeutige ID           |
| reservierungId       | zugehörige Reservierung |
| tischId              | zugehöriger Tisch       |

---

### 5.2 Bestellposition

Bestellposition löst die n:m-Beziehung zwischen Bestellung und Artikel auf.

| Attribut     | Beschreibung                   |
| ------------ | ------------------------------ |
| positionId   | eindeutige ID                  |
| bestellungId | zugehörige Bestellung          |
| artikelId    | Gericht/Getränk                |
| menge        | Anzahl                         |
| sonderwunsch | z. B. ohne Nüsse               |
| status       | offen, serviert oder storniert |

---

### 5.3 Rechnung

Eine Rechnung entsteht aus einer Bestellung.

| Attribut         | Beschreibung          |
| ---------------- | --------------------- |
| rechnungId       | eindeutige ID         |
| bestellungId     | zugehörige Bestellung |
| zahlerGastId     | optionaler Zahler     |
| gesamtbetrag     | Betrag                |
| rabattAngewendet | ja/nein               |
| zahlungsart      | bar oder karte        |
| status           | offen oder bezahlt    |

---

### 5.4 Artikel

Ein Gericht oder Getränk ist ein bestellbarer Artikel der Speisekarte.

| Attribut       | Beschreibung               |
| -------------- | -------------------------- |
| artikelId      | eindeutige ID              |
| name           | Name des Gerichts/Getränks |
| kategorie      | speise oder getraenk       |
| preis          | Verkaufspreis              |
| benoetigtGrill | ja/nein                    |
| aktiv          | ja/nein                    |

Die vollständige Speisekarte wurde nicht als feste Liste erhoben. Deshalb wird sie als pflegbarer Stammdatenbereich modelliert.

Inhaber und Manager dürfen Gerichte/Getränke anlegen, ändern, deaktivieren und Standorten zuordnen. Bedienungen dürfen Artikel nur für Bestellungen auswählen.

---

## 6. Beziehungen

| Nr. | Beziehung                          | Kardinalität | Beschreibung                                                                                                                                                            |
| --- | ---------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Standort hat Tische                | 1:n          | Ein Standort besitzt mehrere Tische. Ein Tisch gehört zu genau einem Standort.                                                                                          |
| 2   | Standort hat Reservierungen        | 1:n          | Eine Reservierung gehört zu genau einem Standort.                                                                                                                       |
| 3   | Gast macht Reservierungen          | 1:n          | Ein Gast kann mehrere Reservierungen haben.                                                                                                                             |
| 4   | Reservierung blockiert Tisch(e)    | n:m          | Eine Reservierung kann mehrere Tische blockieren; ein Tisch kann über verschiedene Zeitfenster in mehreren Reservierungen vorkommen. Umsetzung über ReservierungsTisch. |
| 5   | Tisch hat Bestellungen             | 1:n          | Ein Tisch kann mehrere Bestellungen haben.                                                                                                                              |
| 6   | Mitarbeiter nimmt Bestellungen auf | 1:n          | Eine Bedienung kann mehrere Bestellungen aufnehmen.                                                                                                                     |
| 7   | Bestellung enthält Artikel         | n:m          | Eine Bestellung enthält mehrere Artikel; ein Artikel kann in vielen Bestellungen vorkommen. Umsetzung über Bestellposition.                                             |
| 8   | Rechnung hat Zahler                | n:0..1       | Eine Rechnung kann optional einem Gast als Zahler zugeordnet sein, z. B. für Bella-Card-Rabatt.                                                                         |
| 9   | Firmenkunde hat CateringAufträge   | 1:n          | Ein Firmenkunde kann mehrere Catering-Aufträge haben. Ein Catering-Auftrag gehört zu genau einem Firmenkunden.                                                          |

---

## 7. Business Rules

### BR1 – Reservierungsdauer und Doppelbuchung

Wenn eine Reservierung angelegt wird, blockiert sie den zugeordneten Tisch standardmäßig für 2 Stunden.

Ein Tisch darf am selben Standort im gleichen Zeitfenster nicht doppelt vergeben werden.

---

### BR2 – Reale Belegung, Verspätung und No-Show

Wenn ein Tisch 20 Minuten vor der nächsten Reservierung noch besetzt ist, muss die App einen Warnhinweis anzeigen.

Wenn Gäste ca. 15 bis 20 Minuten nach Reservierungsbeginn nicht erscheinen, darf die Reservierung als noShow markiert werden. Bei vollem Haus darf der Tisch danach weitergegeben werden.

---

### BR3 – Bestellungen und Rechnungen

Eine Bestellung besteht aus mindestens einer Bestellposition.

Stornierte Bestellpositionen dürfen nicht auf einer Rechnung erscheinen.

Änderungen und Stornos müssen für Küche und Service sichtbar sein.

---

### BR4 – Berechtigungen, Bella-Card und Speisekarte

Rabatte und Stornos dürfen nur durch Inhaber oder Manager freigegeben werden.

Bella-Card gewährt 15 Prozent Rabatt für einen berechtigten Zahler.

Gerichte und Getränke dürfen nur durch Inhaber oder Manager angelegt, geändert oder deaktiviert werden.

---

### BR5 – Standortregeln, Gruppen und Catering

Ein Gericht oder Getränk darf nur an Standorten bestellt werden, an denen es verfügbar ist. Grillgerichte dürfen in Spandau nicht bestellbar sein, weil Spandau keinen Grill hat.

Wenn eine Reservierung mindestens 8 Personen umfasst, gilt sie als Gruppenreservierung. Dann soll ein Gruppenmenü statt einzelner à-la-carte-Bestellungen verwendet werden.

Ein Catering-Auftrag durchläuft die Status: angefragt → bestätigt → geliefert → bezahlt. Geliefert bedeutet nicht automatisch bezahlt.

---

## 8. Widersprüche und Auflösungen

## Widerspruch 1 – 2-Stunden-Regel vs. reale Tischbelegung

Aussage A: Eine Reservierung blockiert einen Tisch standardmäßig für 2 Stunden.

Aussage B: Gäste werden nicht einfach nach 2 Stunden rausgeworfen.

### Auflösung

Die 2-Stunden-Regel ist eine Planungsregel, keine harte Räumungsregel.

Die App darf einen Tisch nach 2 Stunden nicht automatisch als tatsächlich frei behandeln. Stattdessen soll sie bei Konflikten warnen, besonders 20 Minuten vor einer Folgereservierung.

---

## Widerspruch 2 – Tischbasierte Bestellung vs. gastbezogener Bella-Card-Rabatt

Aussage A: Normalerweise laufen Bestellung und Rechnung über den Tisch.

Aussage B: Bella-Card-Rabatt hängt am Stammgast bzw. Zahler.

### Auflösung

Der Normalfall bleibt eine tischbezogene Bestellung.

Für Rechnungen muss optional ein Zahler gespeichert werden. Wenn der Zahler Bella-Card-berechtigt ist, kann der Rabatt angewendet werden.

Dadurch bleibt die Tischlogik einfach, aber der Rabatt fachlich korrekt.

---

## 9. MVP-Anforderungen

Die erste baubare Version soll folgende Funktionen enthalten:

* Standorte Kreuzberg und Spandau verwalten
* Tische je Standort mit Kapazität, Bereich und Kombinierbarkeit speichern
* Tischkombinationen für Gruppenreservierungen berücksichtigen
* Reservierungen mit Gast, Telefon, Datum, Uhrzeit, Personenzahl und Status erfassen
* Tischverfügbarkeit zeitabhängig anzeigen
* Tischübersicht mit farblichem Status anzeigen:

  * frei = grün
  * bald reserviert = gelb, wenn innerhalb der nächsten 60 Minuten eine Reservierung folgt
  * besetzt = rot
* Doppelbuchungen verhindern
* Walk-ins anhand freier Zeitfenster ermöglichen
* Reservierungen als bestätigt, storniert oder noShow markieren
* Bestellungen pro Tisch erfassen
* Bestellpositionen mit Menge und Sonderwunsch erfassen
* Küche über neue oder geänderte Bestellungen informieren
* Rechnungen aus Bestellungen erzeugen
* Stornierte Positionen von Rechnungen ausschließen
* Gäste mit Stammgast- und Bella-Card-Status speichern
* Bella-Card-Rabatt nur bei berechtigtem Zahler anwenden
* Speisekarte als pflegbare Stammdaten verwalten
* Standortabhängige Artikelverfügbarkeit berücksichtigen
* Catering-Aufträge mit einfachem Status verwalten
* Firmenkundenkontakte für Catering speichern

---

## 10. Abgrenzungen und Annahmen

* Die App ist zunächst nur für interne Mitarbeitende gedacht.
* Gäste nutzen die App in der ersten Version nicht selbst.
* Die vollständige Speisekarte wird nicht fest in der SPEC aufgelistet, sondern durch berechtigte Nutzer gepflegt.
* Alte Reservierungen und alte Bestellungen werden nicht migriert.
* Stammgäste, Bella-Card-Status und wichtige Firmenkundenkontakte sollen übernommen oder neu eingetragen werden.
* Die App ersetzt in der ersten Version keine vollständige Kassensoftware.
* Catering wird berücksichtigt, aber niedriger priorisiert als Reservierungen, Tischübersicht und Bestellungen.
* Öffnungszeiten und konkrete Tischkombinationen werden als konfigurierbare Stammdaten behandelt und durch Inhaber oder Manager gepflegt.
