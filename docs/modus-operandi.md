# Modus Operandi — Bella Vista Restaurant-App

_Stand: 3. Juli 2026_

## Zweck

Das Repository ist die gemeinsame, AI-lesbare Quelle für Anforderungen, Entscheidungen, Arbeitsstatus und Lernergebnisse. Die Struktur ist eine projektspezifische, reduzierte Übernahme aus [`jacekzawisza/modus-operandi`](https://github.com/jacekzawisza/modus-operandi).

## Dokumente und Verantwortlichkeit

| Artefakt | Zweck | Wann aktualisieren |
| --- | --- | --- |
| `AGENTS.md` | kurzer Einstieg und verbindliche Regeln | wenn zentrale Quellen oder Regeln wechseln |
| `docs/spec.md` | erhobene fachliche Ausgangslage | nur bei bestätigter fachlicher Korrektur |
| `docs/prd.md` | Problem, Scope, Phasen, Erfolg | bei Scope- oder Phasenänderung |
| `docs/architecture.md` | Systemgrenzen, Invarianten, Technik | bei Architekturentscheidung |
| `docs/backlog.md` | Features, IDs und Status | bei Planung, Start, Abschluss oder Verwerfen |
| `docs/decisions.md` | chronologisches Warum | bei relevanter Produkt-/Architekturentscheidung |
| `docs/meetings/` | destillierte Gesprächsergebnisse | unmittelbar nach relevantem Termin |
| `docs/results/` | reale Outcomes nach Go-live | 24 Stunden bis 7 Tage nach Pilot/Release |

## Priorität bei Widersprüchen

1. neuer, expliziter Eintrag in `docs/decisions.md`
2. fachliche Anforderungen in `docs/spec.md`
3. abgeleitete Planung in `docs/prd.md` und `docs/backlog.md`
4. technische Ausgestaltung in `docs/architecture.md`

Ein Widerspruch wird nicht still gelöst. Er wird als offene Frage oder Entscheidung sichtbar gemacht und anschließend in abhängigen Dokumenten synchronisiert.

## Feature-Workflow

1. **Klären:** Problem, Rolle und Akzeptanzkriterien gegen `spec.md` prüfen.
2. **Identifizieren:** bestehende `BV-NNN`-ID verwenden oder neue ID im Backlog vergeben.
3. **Planen:** Annahmen, Risiken und Verifikation festhalten; bei Architekturwirkung Entscheidung ergänzen.
4. **Bauen:** Backlog auf `in-progress`; kleinsten vollständigen vertikalen Slice umsetzen.
5. **Verifizieren:** relevante Unit-, Integrations-, Concurrency- und End-to-End-Tests ausführen.
6. **Abschließen:** erst danach `done`; Commit oder Release im Backlog notieren.
7. **Lernen:** bei nutzerwirksamen Änderungen Outcome unter `docs/results/BV-NNN.md` erfassen.

## Meeting-Workflow

Nur relevante Ergebnisse landen im Repository, keine unbereinigten Transkripte. Eine Meeting-Notiz enthält Entscheidungen, Action Items, offene Fragen und betroffene Feature-IDs. Bestätigte Änderungen werden anschließend in PRD, Architektur, Backlog oder Entscheidungslog übernommen.

## Qualitätsregeln

- Annahmen explizit machen und unklare Anforderungen nicht als Fakten implementieren.
- Einfachste Lösung wählen, die die Akzeptanzkriterien vollständig erfüllt.
- Änderungen auf den notwendigen Scope begrenzen.
- Erfolg vor Implementierung prüfbar definieren.
- Kritische Fachregeln durch Tests und maßgebliche Systemgrenzen absichern.
- Keine Secrets oder Produktionsdaten committen.

## Regelmäßige Reviews

- Vor jeder Session: `AGENTS.md`, betroffene Anforderung und offene Entscheidungen lesen.
- Bei Featureabschluss: Tests, Backlog, Architektur- und Entscheidungsdokumente synchronisieren.
- Vor Pilotstart: Security, Datenschutz, Backup/Restore und Rollenmodell prüfen.
- Nach Pilotstart: Ergebnisse statt Entwicklungsaufwand bewerten und in `docs/results/` dokumentieren.
