# PRD — Bella Vista Restaurant-App

_Product Requirements Document. Definiert, was gebaut wird und warum._

_Stand: 3. Juli 2026_

## 1. Problem und Motivation

Bella Vista betreibt Restaurants in Kreuzberg und Spandau. Reservierungen, Tischplanung, Bestellungen, Abrechnung, Stammgastdaten und Catering werden derzeit mit Papier und uneinheitlichen Abläufen verwaltet. Dadurch entstehen Doppelbuchungen, fehlende Standortübersicht, unklare Tischverfügbarkeit und vermeidbare Fehler in Service und Abrechnung.

Der größte unmittelbare Schaden entsteht in der Reservierungs- und Tischplanung. Die erste Produktphase konzentriert sich deshalb auf eine belastbare, zeitabhängige Tischübersicht.

## 2. Zielgruppe

| Rolle | Nutzungskontext | Wichtigster Bedarf |
| --- | --- | --- |
| Inhaber | standortübergreifende Steuerung | vollständiger Zugriff, Freigaben und Stammdaten |
| Manager | operative Planung | Reservierungen, Gruppen, Freigaben, Menü und Catering |
| Bedienung | Service am Standort | Gäste platzieren, Bestellungen aufnehmen und ändern |
| Küche | laufende Zubereitung | aktuelle Positionen, Änderungen und Stornos sehen |

Die Anwendung ist ausschließlich für Mitarbeitende. Gäste erhalten im MVP keinen eigenen Zugang.

## 3. Produktvision

Bella Vista nutzt eine gemeinsame interne Anwendung als verlässliche Quelle für Tischbelegung und operative Restaurantabläufe. Mitarbeitende erkennen standortbezogen, welcher Tisch wann verfügbar ist, und führen Reservierung, Bestellung und Rechnung ohne Medienbruch durch.

## 4. Nicht-Ziele

- öffentliche Gast-App oder Online-Selbstreservierung
- vollständige Kassenintegration oder Ersatz einer Kassensoftware
- Lieferdienst
- automatische Marketingfunktionen
- vollständige Personalplanung
- Migration alter Reservierungen und Bestellungen
- vollständige Catering- oder CRM-Suite

## 5. Tech-Stack

Der Tech-Stack ist noch nicht entschieden. Auswahlkriterien und offene Entscheidungen stehen in [`architecture.md`](architecture.md). Eine konkrete Technologie wird erst nach Klärung von Betrieb, Endgeräten, Offline-Bedarf, Authentifizierung und Datenschutz festgelegt.

## 6. Roadmap

Konkrete Features und Status stehen ausschließlich in [`backlog.md`](backlog.md).

### Phase 1: Reservierung und Tischübersicht

Standorte, Tische, Gäste und Reservierungen bilden eine belastbare Planungsgrundlage. Doppelbuchungen werden atomar verhindert; Walk-ins und Gruppen lassen sich anhand realer Zeitfenster einplanen. Die Phase ist abgeschlossen, wenn Service und Management die Papierübersicht für den laufenden Reservierungsbetrieb ersetzen können.

### Phase 2: Bestellung, Küche und Rechnung

Bestellungen werden tischbezogen aufgenommen und Änderungen erscheinen für Küche und Service. Rechnungen entstehen nachvollziehbar aus nicht stornierten Positionen; Bella-Card-Rabatte und Stornos folgen den Rollenregeln.

### Phase 3: Stammdaten und Catering

Inhaber und Manager verwalten das standortabhängige Angebot. Firmenkunden und Catering-Aufträge werden mit einem einfachen, nachvollziehbaren Statusprozess abgebildet.

## 7. Erfolgskriterien

- [ ] Kein Tisch kann in überlappenden aktiven Zeitfenstern doppelt gebucht werden.
- [ ] Mitarbeitende sehen Tischstatus und kommende Reservierungen standortbezogen in einer Ansicht.
- [ ] Walk-ins können nur in tatsächlich passenden freien Zeitfenstern platziert werden.
- [ ] Küche und Service sehen Bestelländerungen und Stornos konsistent.
- [ ] Rechnungen enthalten keine stornierten Positionen und berechnen Rabatte korrekt.
- [ ] Nicht berechtigte Rollen können Rabatte, Stornos und geschützte Stammdatenänderungen nicht freigeben.
- [ ] Standortregeln verhindern Grillartikel in Spandau.

Messbare Betriebs-KPIs (z. B. Doppelbuchungen pro Monat, Erfassungszeit und Korrekturrate) müssen vor Pilotbeginn mit dem Inhaber festgelegt und als Baseline erhoben werden.

## 8. Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
| --- | --- | --- | --- |
| Reale Tischbelegung weicht von der 2-Stunden-Planung ab | hoch | hoch | Belegungsstatus getrennt modellieren und vor Folgereservierung warnen |
| Gleichzeitige Buchungen erzeugen Race Conditions | mittel | hoch | Konfliktprüfung transaktional in der maßgeblichen Datenhaltung erzwingen |
| Unklare Endgeräte oder Netzqualität führen zur falschen Architektur | mittel | hoch | Betriebsumgebung vor Stack-Entscheidung erheben |
| Rollen werden nur in der Oberfläche geprüft | mittel | hoch | Autorisierung serverseitig testen und erzwingen |
| Personenbezogene Daten werden zu lange oder unnötig gespeichert | mittel | hoch | Datenschutz- und Löschkonzept vor Pilot festlegen |
| Catering erweitert den MVP unkontrolliert | mittel | mittel | erst nach Kernabläufen, nur einfacher Statusprozess |

## 9. Offene Fragen

- Welche Endgeräte werden an beiden Standorten eingesetzt?
- Muss die Anwendung bei Internetausfall weiterarbeiten?
- Wo und durch wen wird die Anwendung betrieben?
- Welche Öffnungszeiten und Reservierungsgrenzen gelten je Standort?
- Welche konkreten Tischkombinationen sind zulässig?
- Wie wird eine reale Belegung begonnen und beendet?
- Sind Teilrechnungen oder mehrere Zahler pro Bestellung erforderlich?
- Welche MwSt.-, Beleg- und Kassenanforderungen gelten trotz fehlender Kassenintegration?
- Wie werden Nutzerkonten angelegt und Freigaben revisionssicher protokolliert?
- Welche Lösch- und Aufbewahrungsfristen gelten für Gast- und Mitarbeiterdaten?

---

_Grundlage: `docs/spec.md`. Noch nicht mit realen Nutzern challenged; offene Fragen sind vor Implementierungsstart zu priorisieren._
