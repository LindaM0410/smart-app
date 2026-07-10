# Modus Operandi — Bella Vista Restaurant-App

_Stand: 3. Juli 2026_

## Zweck

Das Repository ist die AI-lesbare Quelle für Anforderungen, Entscheidungen und Arbeitsstatus. Die Struktur ist eine projektspezifische Solo-Variante von [`jacekzawisza/modus-operandi`](https://github.com/jacekzawisza/modus-operandi).

## Dokumente und Verantwortlichkeit

| Artefakt | Zweck | Wann aktualisieren |
| --- | --- | --- |
| `AGENTS.md` | kurzer Einstieg und verbindliche Regeln | wenn zentrale Quellen oder Regeln wechseln |
| `docs/spec.md` | Produktquelle: Problem, Ziele, Scope, Rollen, Regeln und MVP | bei bestätigter Produkt- oder Anforderungsänderung |
| `docs/architecture.md` | Systemgrenzen, Invarianten, Technik | bei Architekturentscheidung |
| `docs/backlog.md` | Features, IDs und Status | bei Planung, Start, Abschluss oder Verwerfen |
| `docs/decisions.md` | chronologisches Warum | bei relevanter Produkt-/Architekturentscheidung |

Bewusst nicht vorhanden: separates PRD, Mission-Dokumente, `INBOX.md`, Meeting- und Results-Ordner. Sie würden im aktuellen sequenziellen Solo-Workflow nur Doppelpflege erzeugen. Wenn parallele Bearbeitung oder ein konkreter Lernprozess entsteht, wird ihre Einführung zuerst in `decisions.md` festgehalten.

## Priorität bei Widersprüchen

1. neuer, expliziter Eintrag in `docs/decisions.md`
2. fachliche Anforderungen in `docs/spec.md`
3. operative Planung in `docs/backlog.md`
4. technische Ausgestaltung in `docs/architecture.md`

Ein Widerspruch wird nicht still gelöst. Er wird als offene Frage oder Entscheidung sichtbar gemacht und anschließend in abhängigen Dokumenten synchronisiert.

## Feature-Workflow

1. **Klären:** Problem, Rolle und Akzeptanzkriterien gegen `spec.md` prüfen.
2. **Identifizieren:** bestehende `BV-NNN`-ID verwenden oder neue ID im Backlog vergeben.
3. **Planen:** Annahmen, Risiken und Verifikation festhalten; bei Architekturwirkung Entscheidung ergänzen.
4. **Bauen:** Backlog auf `in-progress`; kleinsten vollständigen vertikalen Slice umsetzen.
5. **Verifizieren:** relevante Unit-, Integrations-, Concurrency- und End-to-End-Tests ausführen.
6. **Abschließen:** erst danach `done`; Commit oder Release im Backlog notieren.

Änderungen an Produktanforderungen werden direkt in `spec.md` vorgenommen. Relevante Produkt- oder Architekturentscheidungen erhalten zusätzlich einen chronologischen Eintrag in `decisions.md`; Statusänderungen gehören ins Backlog.

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
- Nach Pilotstart: Produktannahmen gegen beobachtete Nutzung prüfen und bestätigte Änderungen in `spec.md`, Backlog und Entscheidungslog übernehmen.
