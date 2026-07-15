# Architektur — Bella Vista Restaurant-App

_Stand: 15. Juli 2026 · Status: fachliche Architektur und technisches Grundgerüst definiert_

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

## 4. Technischer Stack

Das Projekt ist als modularer Monolith eingerichtet:

| Bereich | Wahl | Zweck und Grenze |
| --- | --- | --- |
| Web-Anwendung | Next.js mit TypeScript und App Router | Server- und Bedienoberflächen in einem Projekt; fachliche Schreiboperationen gehören an serverseitige Systemgrenzen. |
| Persistenz | SQLite über Prisma ORM | Lokale, relationale Entwicklungs- und MVP-Datenbank mit versionskontrolliertem Prisma-Schema. |
| Laufzeit | Node.js 22 oder neuer | Lokale Entwicklung und Ausführung der Next.js-Anwendung. |

Die SQLite-Datei ist ausschließlich für lokale Entwicklung und einen einzelnen Anwendungsprozess vorgesehen. Deployment, Backups und ein möglicher Wechsel auf eine serverbasierte relationale Datenbank bleiben offen. Die spätere Konfliktstrategie für Reservierungen muss aktive Zeitfenster in einer atomaren Schreiboperation prüfen und speichern; eine reine Vorab-Leseabfrage genügt nicht.

Das Grundgerüst enthält absichtlich noch kein fachliches Prisma-Datenmodell, keine Authentifizierung und keine Migration. Diese werden erst mit den jeweils zugehörigen Features und ihren Invarianten ergänzt.

## 5. Domänenmodell

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

## 6. Zentrale Invarianten

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

## 7. Berechtigungen

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

## 8. Qualitäts- und Teststrategie

- Unit-Tests für Zeitintervall-, Preis-, Rabatt- und Statuslogik.
- Integrationstests für Datenbank-Invarianten und rollenbasierte Autorisierung.
- Concurrency-Test: zwei gleichzeitige Reservierungen desselben Tisches, genau eine darf erfolgreich sein.
- End-to-End-Tests für Reservierung → Belegung → Bestellung → Rechnung.
- Zeitzonentests mit `Europe/Berlin`, einschließlich Sommerzeitwechsel.
- Audit-Tests für Stornos, Rabattfreigaben und sensible Stammdatenänderungen.

## 9. Sicherheits- und Datenschutzleitplanken

- So wenig personenbezogene Daten wie fachlich nötig speichern.
- Passwörter nie im Klartext speichern oder protokollieren.
- Rollen serverseitig erzwingen; Sitzungen sicher widerrufbar machen.
- Telefonnummern und Gastdaten nicht in technische Logs schreiben.
- Backups, Verschlüsselung, Löschung und Aufbewahrung vor Pilot dokumentieren.
- Produktionsdaten nicht für lokale Entwicklung oder Tests kopieren.

## 10. Projektstruktur

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
├── prisma/
│   └── schema.prisma     # Datenbankschema und spätere Migrationen
└── src/
    ├── app/              # Next.js-Routen und Bedienoberflächen
    └── lib/              # gemeinsame technische Infrastruktur
```

Die spätere Code-Struktur richtet sich innerhalb dieser technischen Verzeichnisse an den fachlichen Modulen aus.

## 11. Offene Architekturentscheidungen

- Hosting, Backups, Monitoring und Deployment
- Authentifizierung, Session-Modell und Benutzerverwaltung
- Geräte, Browserunterstützung und responsives Bedienkonzept
- Netzwerkausfall und möglicher Offline-Modus
- Echtzeit-Aktualisierung für Küche und Service
- Audit- und Datenschutzkonzept
- Schnittstellen zu Kasse oder Reservierungsportalen nach dem MVP
