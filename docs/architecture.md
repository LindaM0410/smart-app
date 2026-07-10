# Architektur — Bella Vista Restaurant-App

_Stand: 3. Juli 2026 · Status: fachliche Architektur definiert, Tech-Stack offen_

## 1. Architekturziele

1. Reservierungskonflikte auch bei gleichzeitigen Schreibzugriffen zuverlässig verhindern.
2. Rollen und Freigaben zentral erzwingen und nachvollziehbar machen.
3. Standortgrenzen und standortabhängiges Angebot konsistent halten.
4. Reservierung, reale Belegung, Bestellung und Rechnung fachlich getrennt modellieren.
5. Den MVP ohne Vorfestlegung auf unbestätigte Betriebsanforderungen bauen.

## 2. Systemkontext

Die App ist ein internes System für Inhaber, Manager, Bedienung und Küche. Externe Gäste, Online-Reservierungsportale, Kassensysteme, Zahlungsanbieter, Marketing-Tools und Lieferdienste liegen im MVP außerhalb der Systemgrenze.

## 3. Fachliche Module

| Modul | Verantwortung |
| --- | --- |
| Identität und Berechtigung | Mitarbeiter, Rollen, Login, Freigaben |
| Standorte und Tische | Standorte, Tische, Bereiche, Kombinationen, Öffnungszeiten |
| Gäste und Reservierungen | Gastdaten, Zeitfenster, Tischzuordnung, Status, Walk-ins |
| Belegung | tatsächliches Platzieren und Freigeben eines Tisches, Warnungen |
| Menü und Verfügbarkeit | Artikel, Preise, Standortzuordnung, Grillregel |
| Bestellungen und Küche | Bestellung, Positionen, Sonderwünsche, Statusänderungen |
| Rechnung | berechenbare Positionen, Zahler, Bella-Card-Rabatt, Zahlungsstatus |
| Catering | Firmenkunden und Catering-Statusprozess |
| Audit | sensible Änderungen, Freigaben und Stornos nachvollziehbar protokollieren |

Module beschreiben fachliche Grenzen. Sie erzwingen weder Microservices noch eine bestimmte Ordnerstruktur. Für den MVP ist ein modularer Monolith die bevorzugte Ausgangshypothese, solange keine Betriebsanforderung dagegen spricht.

## 4. Domänenmodell

Die Entitäten aus `spec.md` bleiben maßgeblich. Für eine umsetzbare Architektur sind folgende Ergänzungen erforderlich:

| Objekt / Feld | Zweck |
| --- | --- |
| Reservierung.beginn, Reservierung.ende | explizites Zeitintervall statt getrenntem Datum/Uhrzeit; Ende standardmäßig Beginn + 2 Stunden |
| Reservierung.typ | `reservierung` oder `walkIn` |
| Belegung | reale Tischbelegung getrennt von der geplanten Reservierung |
| TischKombination | konfigurierbare zulässige Kombinationen innerhalb eines Standorts |
| ArtikelStandort | n:m-Zuordnung von Artikeln zu Standorten |
| AuditEintrag | Akteur, Aktion, Objekt, Zeitpunkt und relevante Änderung |

Die Ergänzungen präzisieren die Spezifikation, ändern aber nicht deren Scope. Sie müssen vor Implementierung als Datenmodell-Entscheidung bestätigt werden.

## 5. Zentrale Invarianten

### Reservierung

- Zeitfenster sind halb-offen: `[beginn, ende)`.
- `ende` muss nach `beginn` liegen; Standarddauer sind zwei Stunden.
- Ein zugeordneter Tisch gehört zum Standort der Reservierung.
- Für keinen Tisch dürfen sich aktive Reservierungsintervalle überschneiden.
- `storniert` und `noShow` blockieren nach wirksamer Statusänderung kein zukünftiges Zeitfenster mehr.
- Ein Statuswechsel muss als atomare Fachoperation erfolgen.

Die Konfliktprüfung darf nicht ausschließlich als vorherige Leseabfrage implementiert werden. Datenbank-Constraint, Sperrstrategie oder serialisierbare Transaktion müssen konkurrierende Buchungen sicher auflösen.

### Belegung

- Planungsende und reale Freigabe sind verschiedene Sachverhalte.
- Eine laufende Belegung endet nicht automatisch nach zwei Stunden.
- 20 Minuten vor einer Folgereservierung wird bei fortbestehender Belegung gewarnt.

### Bestellung und Rechnung

- Eine Bestellung hat mindestens eine Position, sobald sie verbindlich an die Küche übergeben wird.
- Mitarbeiter, Tisch und Bestellung müssen zum selben aktiven Standortkontext passen.
- Stornierte Positionen tragen nicht zum Rechnungsbetrag bei.
- Rechnungsbeträge werden aus unveränderlichen Preis-Snapshots der Positionen berechnet; spätere Menüpreisänderungen verändern alte Bestellungen nicht.
- Geld wird als Dezimalwert bzw. kleinste Währungseinheit gespeichert, nie als Float.
- Bella-Card-Rabatt beträgt 15 % und erfordert einen berechtigten Zahler plus berechtigte Freigabe.

### Standort und Angebot

- Tischkombinationen enthalten nur Tische desselben Standorts.
- Ein Artikel ist nur bestellbar, wenn er für den Standort aktiv freigegeben ist.
- Ein Artikel mit `benoetigtGrill = true` ist an einem Standort ohne Grill nicht freigebbar.

## 6. Berechtigungen

| Fähigkeit | Inhaber | Manager | Bedienung | Küche |
| --- | :---: | :---: | :---: | :---: |
| Reservierungen lesen/planen | ja | ja | ja | nein |
| Gäste platzieren / Belegung ändern | ja | ja | ja | nein |
| Bestellungen aufnehmen/ändern | ja | ja | ja | Ansicht |
| Storno oder Rabatt freigeben | ja | ja | nein | nein |
| Menü und Standortangebot pflegen | ja | ja | nein | nein |
| Catering/Firmenkunden pflegen | ja | ja | nein | nein |
| Mitarbeiter und Rollen verwalten | ja | offen | nein | nein |

`offen` ist vor Implementierung zu entscheiden. Autorisierung wird an jeder schreibenden Systemgrenze geprüft; ausgeblendete UI-Elemente sind kein Schutz.

## 7. Qualitäts- und Teststrategie

- Unit-Tests für Zeitintervall-, Preis-, Rabatt- und Statuslogik.
- Integrationstests für Datenbank-Invarianten und rollenbasierte Autorisierung.
- Concurrency-Test: zwei gleichzeitige Reservierungen desselben Tisches, genau eine darf erfolgreich sein.
- End-to-End-Tests für Reservierung → Belegung → Bestellung → Rechnung.
- Zeitzonentests mit `Europe/Berlin`, einschließlich Sommerzeitwechsel.
- Audit-Tests für Stornos, Rabattfreigaben und sensible Stammdatenänderungen.

## 8. Sicherheits- und Datenschutzleitplanken

- So wenig personenbezogene Daten wie fachlich nötig speichern.
- Passwörter nie im Klartext speichern oder protokollieren.
- Rollen serverseitig erzwingen; Sitzungen sicher widerrufbar machen.
- Telefonnummern und Gastdaten nicht in technische Logs schreiben.
- Backups, Verschlüsselung, Löschung und Aufbewahrung vor Pilot dokumentieren.
- Produktionsdaten nicht für lokale Entwicklung oder Tests kopieren.

## 9. Vorgesehene Projektstruktur

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   ├── spec.md
│   ├── architecture.md
│   ├── backlog.md
│   ├── decisions.md
│   └── modus-operandi.md
└── src/                 # erst nach Stack-Entscheidung konkretisieren
```

Die spätere Code-Struktur richtet sich an den fachlichen Modulen aus. Framework-spezifische Verzeichnisse werden erst nach einer dokumentierten Stack-Entscheidung angelegt.

## 10. Offene Architekturentscheidungen

- Client-/Server- und UI-Technologie
- relationale Datenbank und konkrete Konflikt-Constraint-Strategie
- Hosting, Backups, Monitoring und Deployment
- Authentifizierung, Session-Modell und Benutzerverwaltung
- Geräte, Browserunterstützung und responsives Bedienkonzept
- Netzwerkausfall und möglicher Offline-Modus
- Echtzeit-Aktualisierung für Küche und Service
- Audit- und Datenschutzkonzept
- Schnittstellen zu Kasse oder Reservierungsportalen nach dem MVP
