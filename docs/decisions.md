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
