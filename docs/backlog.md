# Backlog — Bella Vista Restaurant-App

_Stand: 3. Juli 2026_

_Stabile Feature-IDs. IDs werden nicht umnummeriert oder wiederverwendet. Quelle aller initialen Einträge: `docs/spec.md`._

## Statuswerte

| Status | Bedeutung |
| --- | --- |
| `hypo` | Annahme, noch nicht mit Nutzer bestätigt |
| `validated` | fachlich bestätigt, noch nicht implementiert |
| `in-progress` | aktuell in Umsetzung |
| `done` | implementiert und verifiziert |
| `killed` | verworfen; Begründung in `decisions.md` |

Die Anforderungen sind aus der Spezifikation übernommen, aber noch nicht durch Nutzerinterviews oder einen Pilot validiert. Deshalb starten sie als `hypo`.

## Features

| ID | Name | Phase | Status | Akzeptanzkern |
| --- | --- | ---: | --- | --- |
| BV-001 | Standorte verwalten | 1 | hypo | Kreuzberg und Spandau mit Kapazität und Ausstattung abbilden |
| BV-002 | Tische verwalten | 1 | hypo | Tische mit Standort, Nummer, Kapazität, Bereich und Kombinierbarkeit pflegen |
| BV-003 | Tischkombinationen | 1 | hypo | nur konfigurierte Kombinationen desselben Standorts zulassen |
| BV-004 | Gäste verwalten | 1 | hypo | Gast über Name/Telefon erfassen und wiederfinden |
| BV-005 | Reservierungen erfassen | 1 | hypo | Gast, Standort, Zeitraum, Personenzahl, Status und Notiz speichern |
| BV-006 | Tischzuordnung | 1 | hypo | einer Reservierung einen oder mehrere passende Tische zuordnen |
| BV-007 | Doppelbuchungen verhindern | 1 | hypo | auch bei gleichzeitigen Anfragen höchstens eine überlappende aktive Buchung zulassen |
| BV-008 | Zeitabhängige Tischübersicht | 1 | hypo | frei grün, innerhalb 60 Minuten reserviert gelb, real besetzt rot anzeigen |
| BV-009 | Walk-ins | 1 | hypo | spontane Gäste nur innerhalb passender freier Zeitfenster platzieren |
| BV-010 | Verspätung und No-Show | 1 | hypo | No-Show ab ca. 15–20 Minuten markieren und Tisch wieder freigeben können |
| BV-011 | Konfliktwarnung bei Belegung | 1 | hypo | 20 Minuten vor Folgereservierung bei fortbestehender Belegung warnen |
| BV-012 | Gruppenreservierung | 1 | hypo | ab 8 Personen als Gruppe behandeln und Gruppenmenü vorsehen |
| BV-013 | Rollen und Berechtigungen | 1 | hypo | Inhaber, Manager, Bedienung und Küche gemäß Spezifikation autorisieren |
| BV-014 | Bestellungen pro Tisch | 2 | hypo | Bedienung kann Bestellung an einem Tisch eröffnen und pflegen |
| BV-015 | Bestellpositionen | 2 | hypo | Artikel, Menge, Sonderwunsch und Positionsstatus verwalten |
| BV-016 | Küchenansicht | 2 | hypo | neue/geänderte Positionen und Stornos zeitnah sichtbar machen |
| BV-017 | Rechnungen erzeugen | 2 | hypo | Rechnung aus nicht stornierten Positionen korrekt berechnen |
| BV-018 | Bella-Card-Rabatt | 2 | hypo | 15 % nur für berechtigten Zahler mit berechtigter Freigabe anwenden |
| BV-019 | Storno-Freigabe | 2 | hypo | Bedienung kann ohne Inhaber/Manager kein Storno wirksam freigeben |
| BV-020 | Speisekarte verwalten | 3 | hypo | Inhaber/Manager können Artikel anlegen, ändern und deaktivieren |
| BV-021 | Standortangebot | 3 | hypo | nur am Standort aktive Artikel bestellen; keine Grillartikel in Spandau |
| BV-022 | Firmenkunden | 3 | hypo | Firma, Kontaktperson und Kontaktdaten pflegen und wiederfinden |
| BV-023 | Catering-Aufträge | 3 | hypo | Auftrag mit Firma, Eventdaten, Menü, Preis und Status verwalten |
| BV-024 | Catering-Statusfolge | 3 | hypo | angefragt → bestätigt → geliefert → bezahlt kontrolliert durchlaufen |
| BV-025 | Audit kritischer Aktionen | 1 | hypo | Freigaben, Rabatte, Stornos und sensible Änderungen nachvollziehbar protokollieren |

## Pflege

- Neue Features erhalten die nächste freie `BV-NNN`-ID.
- Featurebeginn: Status auf `in-progress`, Branch oder Plan referenzieren.
- Fertigstellung: Status erst nach Tests auf `done`, Commit referenzieren.
- Verworfen: Status `killed`, Begründung in `decisions.md`; Zeile bleibt bestehen.
- Nutzerwirksame `done`-Features erhalten nach dem Pilot eine Outcome-Notiz unter `docs/results/BV-NNN.md`.
