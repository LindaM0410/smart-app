# Entscheidungen — Bella Vista Restaurant-App

_Chronologisches Log für Architektur- und Produktentscheidungen. Neue Einträge werden unten ergänzt; bestehende Einträge nicht rückwirkend umdeuten._

## 2026-07-03 — Dokumentationsgetriebene Projektstruktur

**Kontext:** Das Projekt bestand nur aus der fachlichen `spec.md`. Für agentengestützte Entwicklung werden klare Quellen für Produkt, Architektur, Status und Entscheidungen benötigt.

### Entscheidung

Das Projekt übernimmt ein leichtgewichtiges, Markdown-basiertes Operating Model nach `jacekzawisza/modus-operandi`: `AGENTS.md` als Einstieg, PRD, Architektur, stabiles Backlog, Entscheidungslog, Meeting-Notizen und Ergebnisdokumente. `docs/spec.md` bleibt die fachliche Ausgangsquelle.

### Alternativen verworfen

- Nur `spec.md`: trennt Anforderungen, Umsetzungsstatus und Entscheidungen nicht.
- Externes PM-Tool als primäre Quelle: wäre für den aktuellen Projektumfang zusätzliche Doppelpflege.

### Konsequenzen

- Agenten und Menschen erhalten einen kurzen, reproduzierbaren Einstieg.
- Dokumente müssen bei Scope-, Architektur- und Statusänderungen aktiv gepflegt werden.

## 2026-07-03 — Zeitfenster als Planungsregel

**Kontext:** Die Spezifikation nennt eine zweistündige Reservierungsdauer, verbietet aber die automatische Annahme, dass ein real belegter Tisch danach frei ist.

### Entscheidung

Reservierungen besitzen ein explizites Planungsintervall mit standardmäßig zwei Stunden. Reale Belegung wird getrennt geführt und endet nur durch eine explizite Aktion. Vor einer kollidierenden Folgereservierung wird gewarnt.

### Konsequenzen

- Tischverfügbarkeit kann deterministisch geplant werden.
- Die Anwendung benötigt zusätzlich zur Reservierung einen realen Belegungszustand.

## 2026-07-03 — Zahlerbezogener Bella-Card-Rabatt

**Kontext:** Bestellungen sind tischbezogen, die Rabattberechtigung gehört aber zu einem Gast.

### Entscheidung

Die Bestellung bleibt tischbezogen. Eine Rechnung kann optional einen Gast als Zahler referenzieren. Nur bei aktiver Bella-Card und Freigabe durch Inhaber oder Manager werden 15 % Rabatt angewendet.

### Konsequenzen

- Bestellaufnahme bleibt unabhängig von einzelnen Gästen.
- Rechnungslogik muss Zahler, Berechtigung und Freigabe nachvollziehbar speichern.

## 2026-07-03 — Tech-Stack bleibt vorerst offen

**Kontext:** Die Spezifikation enthält keine Angaben zu Endgeräten, Betrieb, Netzqualität, Offline-Anforderung oder vorhandener Infrastruktur.

### Entscheidung

Es wird noch kein Framework, Datenbanksystem oder Hosting festgelegt. Zuerst werden die Betriebsanforderungen aus `spec.md` und `architecture.md` geklärt.

### Konsequenzen

- Es wird keine Scheinsicherheit durch einen voreiligen Stack erzeugt.
- Vor dem ersten Anwendungscode ist eine dokumentierte Stack-Entscheidung erforderlich.

## 2026-07-03 — Solo-Projekt mit `spec.md` als Produktquelle

**Kontext:** Die erste Übernahme der Methodik legte zusätzlich ein PRD sowie Meeting- und Results-Ordner an. Für dieses sequenziell bearbeitete Solo-Projekt erzeugen diese Artefakte Doppelpflege; die vorhandene `spec.md` enthält bereits Problem, Ziele, Scope, Rollen, Regeln und MVP-Anforderungen.

### Entscheidung

`docs/spec.md` übernimmt die Rolle des PRD und ist die einzige fachliche Produktquelle. `docs/prd.md` wird nicht weitergeführt. Team-spezifische Missionen, `INBOX.md`, Meeting-Notizen und Results-Ordner entfallen. Der operative Status bleibt im Backlog, technische Wahrheit in der Architektur und das Warum relevanter Änderungen im Entscheidungslog.

### Alternativen verworfen

- `spec.md` und PRD parallel pflegen: führt zu überlappenden Produktquellen und Drift.
- Team-Artefakte vorsorglich behalten: lösen im aktuellen Solo-Workflow kein bestehendes Problem.

### Konsequenzen

- Agenten laden weniger redundanten Kontext.
- Produktänderungen werden direkt in `spec.md` dokumentiert und in Backlog, Architektur und Entscheidungslog synchronisiert.
- Outcome-Dokumentation kann später als neue Entscheidung eingeführt werden, wenn reale Lernzyklen dies rechtfertigen.

## 2026-07-15 — Next.js mit Prisma und SQLite für das technische Grundgerüst

**Kontext:** Für den ersten Anwendungscode benötigt das Projekt einen dokumentierten, lokal ausführbaren Stack. Gleichzeitig sind Hosting, Mehrinstanzbetrieb und Betriebsanforderungen noch nicht entschieden.

### Entscheidung

Die Anwendung wird als Next.js-Modulmonolith mit TypeScript und App Router aufgebaut. Die lokale Persistenz erfolgt über Prisma ORM mit SQLite. Das Prisma-Schema startet bewusst ohne fachliche Modelle; diese folgen nur zusammen mit den zugehörigen Features und Invarianten.

### Konsequenzen

- Das Projekt kann lokal mit einem einheitlichen Web- und Server-Stack weiterentwickelt werden.
- SQLite ist auf lokale Entwicklung und einen einzelnen Anwendungsprozess begrenzt; für produktiven Mehrinstanzbetrieb ist später eine erneute Datenbankentscheidung nötig.
- Die Reservierungskonfliktstrategie bleibt eine eigene, vor der Umsetzung von BV-007 zu konkretisierende Datenbank- und Transaktionsentscheidung.

## 2026-07-16 — Standortverwaltung als erster fachlicher Slice (BV-001)

**Kontext:** Nach dem technischen Grundgerüst ist die Standortzugehörigkeit die Grundlage für Tische, Reservierungen und weitere operative Daten. BV-001 soll Standorte vollständig verwaltbar machen, ohne den noch offenen Umfang von Authentifizierung und Rollen vorwegzunehmen.

### Entscheidung

Standorte werden als erstes fachliches Prisma-Modell mit Name, Adresse, Sitzplatzanzahl, Terrassenstatus, Grillfähigkeit und Aktivstatus persistiert. Anlage und Bearbeitung erfolgen über serverseitige Aktionen; Pflichtangaben und eine positive ganzzahlige Sitzplatzanzahl werden an dieser Systemgrenze validiert. Standorte werden deaktiviert statt gelöscht, damit ihre Kennung für spätere Beziehungen erhalten bleiben kann.

Die Verwaltung ist bis zur Umsetzung von BV-013 und BV-027 noch nicht rollen- oder anmeldungsgebunden. Diese offene Sicherheitsgrenze wird durch BV-001 nicht stillschweigend entschieden.

### Konsequenzen

- Nachfolgende Features können den Standort über eine stabile ID referenzieren.
- Kreuzberg und Spandau können einschließlich ihrer unterschiedlichen Kapazität und Ausstattung gepflegt werden.
- Inaktive Standorte bleiben gespeichert und können wieder aktiviert werden.
- Validierung, Anlage und Bearbeitung sind automatisiert getestet; Prisma-Schema, TypeScript-Prüfung und Produktions-Build wurden erfolgreich verifiziert.

## 2026-07-17 — Standortgebundene Tischverwaltung (BV-002)

**Kontext:** Tische sind die Grundlage für Tischzuordnung, Doppelbuchungsschutz und operative Übersichten. BV-002 soll die Tischstammdaten pflegbar machen, ohne Tischkombinationen aus BV-003 vorwegzunehmen.

### Entscheidung

Ein Tisch wird als eigenes Prisma-Modell mit Standort, Nummer, Kapazität, Bereich, Kombinierbarkeit und Aktivstatus persistiert. Jede Tisch-ID referenziert genau einen vorhandenen Standort; die Tischnummer ist innerhalb eines Standorts eindeutig. Pflichtangaben, positive ganzzahlige Kapazität und die Bereiche `innen`, `außen`, `fenster` und `bar` werden an der serverseitigen Systemgrenze validiert. Tische werden deaktiviert statt gelöscht.

Die Eigenschaft `kombinierbar` kennzeichnet nur die grundsätzliche Eignung. Erlaubte konkrete Tischkombinationen bleiben dem separaten Feature BV-003 vorbehalten. Wie bei BV-001 bleibt die Verwaltung bis zur Umsetzung von BV-013 und BV-027 noch ohne Rollen- und Anmeldungsprüfung.

### Konsequenzen

- Nachfolgende Reservierungsfeatures können Tische über stabile IDs und eine erzwungene Standortbeziehung referenzieren.
- Doppelte Tischnummern an unterschiedlichen Standorten bleiben möglich, am selben Standort werden sie datenbankseitig verhindert.
- Anlage, Bearbeitung, Validierung, Standortbindung und Eindeutigkeit sind automatisiert getestet; TypeScript-Prüfung und Produktions-Build wurden erfolgreich verifiziert.
