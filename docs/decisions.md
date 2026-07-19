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

## 2026-07-17 — Gästeverwaltung ohne vorgezogene Aufbewahrungsregel (BV-004)

**Kontext:** Gäste sind die notwendige Grundlage für Reservierungen, Stammgastkennzeichnung und die spätere Bella-Card-Prüfung. Die konkreten Datenschutz- und Aufbewahrungsfristen sind noch offen.

### Entscheidung

Ein Gast wird als eigenes Prisma-Modell mit Name, Telefonnummer, Notiz, Stammgaststatus, Bella-Card-Status, Besuchsanzahl und Aktivstatus persistiert. Nur der Name ist fachlich verpflichtend; Telefonnummer und Notiz bleiben optional erfassbar. Die Besuchsanzahl muss an der serverseitigen Systemgrenze eine nicht negative ganze Zahl sein. Gäste werden deaktiviert statt gelöscht.

Eine automatische Löschung oder Aufbewahrungsfrist wird nicht vorweggenommen. Wie bei BV-001 und BV-002 bleibt die Verwaltung bis zur Umsetzung von BV-013 und BV-027 noch ohne Rollen- und Anmeldungsprüfung.

### Konsequenzen

- Reservierungen können künftig einen stabilen Gastdatensatz referenzieren.
- Stammgast- und Bella-Card-Informationen können gepflegt werden, ohne die spätere Rabattfreigabe aus BV-018 vorwegzunehmen.
- Vor einem Pilotbetrieb müssen Löschung und Aufbewahrung weiterhin geklärt und dokumentiert werden.
- Anlage, Bearbeitung und Validierung sind automatisiert getestet; Prisma-Schema, Migration, TypeScript-Prüfung und Produktions-Build wurden erfolgreich verifiziert.

## 2026-07-17 — Reservierungserfassung als eigenständiger Planungsslice (BV-005)

**Kontext:** Nach Standorten und Gästen sollen Reservierungsdaten erstmals persistent erfasst werden. Tischplanung, Konfliktprüfung, operative Übersichten und Autorisierung sind nicht Teil dieses Slices und dürfen nicht vorweggenommen werden.

### Entscheidung

Eine Reservierung wird mit Gast, Standort, Beginn, Ende, Personenanzahl, Status, Notiz, Gruppenkennzeichen und Erstellerkennung persistiert. Gast und Standort werden relational gebunden und müssen beim Schreiben aktiv sein. Ohne explizites Ende setzt die serverseitige Domänenlogik das Planungsende auf Beginn plus zwei Stunden; ein explizites Ende muss nach dem Beginn liegen. Das Gruppenkennzeichen wird ab acht Personen serverseitig abgeleitet und nicht als frei änderbare Formulareingabe akzeptiert.

Bis ein Mitarbeitermodell vorhanden ist, wird die verpflichtende Erstellerkennung als String gespeichert. Daraus werden weder Identität noch Rolle oder Berechtigung abgeleitet. Reservierungen erhalten in diesem Slice keine Tischbeziehung, Konfliktprüfung oder Statusübergangslogik.

### Konsequenzen

- Reservierungen können über eine deutsche Oberfläche angelegt und bearbeitet werden.
- Nur vorhandene aktive Gäste und Standorte können für neue Schreibvorgänge verwendet werden.
- Standarddauer, Zeitvalidierung, Personenzahl, Statuswerte, Gruppenkennzeichen und Persistenz sind automatisiert getestet.
- Migration, vollständige Testsuite, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Explizite Tischzuordnung für Reservierungen (BV-006)

**Kontext:** Reservierungen und Tische sind bereits standortgebunden vorhanden. BV-006 soll Reservierungen einen oder mehreren Tischen zuordnen, ohne Regeln für erlaubte Tischkombinationen oder zeitliche Reservierungskonflikte vorwegzunehmen.

### Entscheidung

Die n:m-Beziehung zwischen Reservierung und Tisch wird über die explizite Verbindung `ReservierungTisch` mit einem eindeutigen Paar aus Reservierungs- und Tisch-ID persistiert. Beim Schreiben werden ausschließlich vorhandene aktive Tische akzeptiert, die zum Standort der Reservierung gehören. Eine Reservierung darf ohne Tischzuordnung gespeichert werden; vorhandene Zuordnungen können vollständig ersetzt oder entfernt werden.

Die Eigenschaft `kombinierbar`, erlaubte konkrete Tischkombinationen sowie zeitliche Überschneidungen werden in BV-006 weder ausgewertet noch validiert.

### Konsequenzen

- Reservierungen können über die deutsche Oberfläche einem oder mehreren standortgleichen Tischen zugeordnet werden.
- Doppelte Zuordnungen werden an der serverseitigen Systemgrenze und durch den zusammengesetzten Primärschlüssel verhindert.
- Tischkombinationsregeln und Doppelbuchungsschutz bleiben getrennten späteren Features vorbehalten.
- Vollständige Migrationskette, Testsuite, TypeScript-Prüfung und Produktions-Build wurden erfolgreich verifiziert.

## 2026-07-17 — Atomarer Doppelbuchungsschutz für SQLite (BV-007)

**Kontext:** Aktive Reservierungen mit den Status `angefragt` oder `bestaetigt` dürfen sich für denselben Tisch zeitlich nicht überschneiden. Eine reine Vorab-Abfrage an der Anwendungsschicht schützt nicht vor konkurrierenden Schreibzugriffen. Der aktuelle SQLite-Einsatz ist auf lokale Entwicklung und einen einzelnen Anwendungsprozess begrenzt.

### Entscheidung

Die Reservierungspersistenz prüft Konflikte innerhalb einer Transaktion und meldet den betroffenen Tisch sowie das bestehende Zeitfenster. Zusätzlich erzwingen SQLite-Trigger die Invariante atomar beim Anlegen oder Ändern einer Tischzuordnung sowie bei Änderungen von Beginn, Ende oder Status einer Reservierung. Überschneidungen werden mit `vorhanden.beginn < neu.ende` und `vorhanden.ende > neu.beginn` geprüft, sodass die halb-offenen Intervalle `[Beginn, Ende)` direkt aufeinanderfolgende Reservierungen erlauben.

Die Datenbankprüfung gilt ausschließlich für die blockierenden Status `angefragt` und `bestaetigt`. `storniert`, `noShow` und `abgeschlossen` bleiben nicht blockierend. Bei einem späteren Wechsel des Datenbanksystems muss die Triggerstrategie durch einen gleichwertigen atomaren Mechanismus des Zielsystems ersetzt werden.

### Konsequenzen

- Doppelbuchungen werden auch bei konkurrierenden Schreibversuchen nicht persistiert.
- Formularfehler können Tisch und Konfliktzeitraum verständlich benennen.
- Anlage, Bearbeitung, Statuswirkung, mehrere Tische, Intervallgrenzen und parallele Schreibversuche sind automatisiert getestet.

## 2026-07-17 — Reale Tischbelegung als eigener Lebenszyklus (BV-028)

**Kontext:** Das geplante Ende einer Reservierung bedeutet nicht, dass der Tisch tatsächlich frei ist. BV-028 soll Platzierung und Freigabe erfassen, ohne Tischübersicht, Walk-ins, Warnungen, No-Show-Automatik, Rollen oder Statusfolgen vorwegzunehmen.

### Entscheidung

Eine reale Belegung wird als eigener Datensatz mit Tisch, zugehöriger Reservierung, Beginn und optionalem Ende persistiert. In diesem Slice kann ausschließlich ein aktiver Tisch platziert werden, der der Reservierung bereits zugeordnet ist. Pro Tisch darf datenbankseitig höchstens eine Belegung ohne Endzeit bestehen. Die Freigabe setzt explizit die Endzeit; weder das geplante Reservierungsende noch eine Änderung des Reservierungsstatus beendet eine Belegung automatisch.

Belegungen werden nicht gelöscht, damit Beginn und tatsächliche Freigabe erhalten bleiben. Walk-ins erhalten in BV-028 bewusst keinen alternativen Platzierungsweg; dieser bleibt BV-009 vorbehalten. Die Bedienseite führt konkrete Platzierungs- und Freigabeaktionen aus, berechnet aber keine Zustände der Tischübersicht aus BV-008.

### Konsequenzen

- Planungszeitraum und reale Nutzung eines Tisches sind technisch und fachlich getrennt.
- Gleichzeitige offene Belegungen desselben Tisches werden durch einen partiellen eindeutigen SQLite-Index verhindert.
- Die Reservierung-Tisch-Zuordnung und der Aktivstatus des Tisches werden beim Anlegen an der serverseitigen Systemgrenze und zusätzlich durch einen SQLite-Trigger geprüft.
- Platzierung, Doppelbelegung, explizite Freigabe, Historie und Fortbestand über Planungsende beziehungsweise Statusänderung hinaus sind automatisiert getestet.

## 2026-07-17 — Punktbezogene Tischübersicht pro Standort und Tag (BV-008)

**Kontext:** Die Spezifikation verlangt eine einfache Übersicht, die Tische pro Standort und Tag als frei, innerhalb der nächsten 60 Minuten reserviert oder real belegt kennzeichnet. Öffnungszeiten und eine vollständige Tageszeitleiste sind noch nicht festgelegt beziehungsweise nicht Teil dieses Slices. Damit der Zustand auch für einen gewählten Tag eindeutig berechnet werden kann, benötigt die Ansicht neben dem Datum einen konkreten Betrachtungszeitpunkt.

### Entscheidung

Die Tischübersicht ist eine reine serverseitige Leseansicht mit Auswahl von aktivem Standort, Datum und Uhrzeit. Sie zeigt ausschließlich aktive Tische des gewählten Standorts. Eine offene reale Belegung ergibt unabhängig vom geplanten Reservierungsende den Zustand `belegt` und hat Vorrang vor allen Reservierungsinformationen. Ohne offene Belegung gilt ein Tisch als `bald reserviert`, wenn eine blockierende Reservierung am gewählten Tag ab dem Betrachtungszeitpunkt innerhalb der nächsten 60 Minuten einschließlich der Zeitgrenze beginnt. Andernfalls ist der Tisch `frei`.

Die Tagesgrenze wird als halb-offen behandelt; eine Reservierung genau um Mitternacht gehört nicht mehr zum gewählten Vortag. Datum und Uhrzeit werden in `Europe/Berlin` ausgewertet. Die Oberfläche vermittelt jeden Zustand sowohl durch deutschen Text als auch durch Grün, Gelb oder Rot, sodass Farbe nicht die einzige Information trägt.

Die Ansicht nimmt keine Platzierung oder andere Schreiboperation vor. Sie führt weder Walk-ins, Rollenautorisierung, No-Show-Automatik, Folgereservierungswarnungen, Öffnungszeitenlogik noch eine vollständige Tageszeitleiste ein.

### Konsequenzen

- Der operative Tischzustand kann für einen eindeutigen Zeitpunkt eines gewählten Tages und Standorts abgefragt werden.
- Nicht blockierende Reservierungsstatus, inaktive Tische und Daten anderer Standorte beeinflussen die Übersicht nicht.
- Sommerzeit, Winterzeit, 60-Minuten-Grenzen, Zustandspriorität, Statusfilterung, Standorttrennung und Tageswechsel sind automatisiert getestet.
- Die vollständige Testsuite, TypeScript-Prüfung und der Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Manuelle No-Show-Markierung nach 15 Minuten (BV-010)

**Kontext:** Die Spezifikation erlaubt, eine bestätigte Reservierung nach 15 bis 20 Minuten Verspätung als No-Show zu markieren. Für eine deterministische serverseitige Prüfung benötigt die Anwendung eine eindeutige Frist.

### Entscheidung

Eine bestätigte Reservierung darf frühestens 15 Minuten nach ihrem geplanten Beginn manuell als `noShow` markiert werden. Maßgeblich ist der Zeitpunkt der serverseitigen Fachoperation. Es gibt keine automatische No-Show-Erkennung.

Die Statusänderung beendet die planende Blockierwirkung der Reservierung. Eine gegebenenfalls vorhandene reale Tischbelegung bleibt bestehen und kann weiterhin nur ausdrücklich freigegeben werden.

### Konsequenzen

- Vor Erreichen der Frist und bei jedem anderen Ausgangsstatus wird die Statusänderung serverseitig abgewiesen.
- Die Reservierung kann nach erfolgreicher Markierung keine zeitlich überlappende aktive Reservierung mehr blockieren.
- Rollenautorisierung, Walk-in-Logik und Änderungen an der Tischübersicht sind nicht Bestandteil dieser Entscheidung.
- Exakte Fristgrenze, Ausgangsstatus, gesperrte Umgehungswege, Planungsfreigabe und Fortbestand realer Belegung sind automatisiert getestet; vollständige Testsuite, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Walk-in als atomarer Reservierungs- und Belegungsablauf (BV-009)

**Kontext:** Ein spontaner Gast darf nur platziert werden, wenn ein einzelner Tisch ab dem serverseitigen Erfassungszeitpunkt für die zweistündige Standarddauer ausreichend frei ist. Eine teilweise gespeicherte Reservierung ohne reale Belegung wäre betrieblich irreführend.

### Entscheidung

Walk-ins werden als bestätigte Reservierungen mit dem Typ `walkIn` und dem halb-offenen Planungsintervall `[Erfassungszeitpunkt, Erfassungszeitpunkt + 2 Stunden)` gespeichert. Der Ablauf verwendet einen vorhandenen aktiven Gast sowie genau einen aktiven Tisch mit ausreichender Kapazität am gewählten aktiven Standort. Eine exakt am Planungsende beginnende Reservierung ist zulässig; jede frühere aktive Folgereservierung und jede offene reale Belegung verhindern die Platzierung.

Reservierung, Tischzuordnung und reale Belegung entstehen in einer gemeinsamen Datenbanktransaktion. Die vorhandenen Datenbankregeln für Doppelbuchungen und offene Belegungen sichern den Ablauf zusätzlich bei konkurrierenden Schreibzugriffen. Fehler rollen alle Teilschritte zurück.

Rollen, Tischkombinationen, Folgereservierungswarnungen, allgemeine Statusfolgen, Öffnungszeiten und das Anlegen neuer Gäste innerhalb des Walk-in-Ablaufs sind nicht Bestandteil von BV-009.

### Konsequenzen

- Walk-ins sind von regulären Reservierungen unterscheidbar, nutzen aber dieselben Zeitfenster- und Standortinvarianten.
- Die reale Belegung beginnt ausdrücklich mit der erfolgreichen Walk-in-Erfassung und endet weiterhin nur durch Freigabe.
- Freies Zeitfenster, exakte Intervallgrenze, Kapazität, Standortbindung, offene Belegung, Rollback und konkurrierende Platzierung sind automatisiert getestet; 49 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Punktbezogene Warnung vor Folgereservierungen (BV-011)

**Kontext:** Eine reale Tischbelegung kann über das geplante Reservierungsende hinaus fortbestehen. Beginnt kurz darauf eine weitere Reservierung für denselben Tisch, benötigt das Personal in der bestehenden Tischübersicht einen deutlichen Hinweis. Öffnungszeiten sind weiterhin nicht festgelegt und dürfen für diese Warnung nicht vorausgesetzt werden.

### Entscheidung

Die Tischübersicht warnt bei einer offenen realen Belegung, wenn eine blockierende Folgereservierung für denselben Tisch ab dem gewählten Betrachtungszeitpunkt innerhalb der nächsten 20 Minuten einschließlich beider Grenzen beginnt. Maßgeblich sind ausschließlich die Status `angefragt` und `bestaetigt`. Nicht blockierende Reservierungsstatus, Reservierungen anderer Tische oder Standorte und Tische ohne offene reale Belegung erzeugen keine Warnung.

Die Warnung wird als abgeleitete Information der bestehenden serverseitigen Leseansicht berechnet und nicht separat persistiert. Sie nennt die Uhrzeit der nächsten relevanten Reservierung und wird zusätzlich zum Tischstatus deutlich in Textform angezeigt. Nach ausdrücklicher Freigabe des Tisches verschwindet sie.

Es werden keine Öffnungszeiten, Rollen, Bestellungen, Rabatte, Rechnungen oder Tischkombinationen eingeführt oder ausgewertet.

### Konsequenzen

- Das Personal erkennt in der Tischübersicht unmittelbar, wenn eine reale Belegung eine in höchstens 20 Minuten beginnende Folgereservierung gefährdet.
- Die Warnung bleibt konsistent mit der bestehenden Standort-, Status- und Belegungsfilterung und benötigt kein neues Datenmodell.
- Grenzwerte, fehlende Belegung, nicht blockierende Status, Standorttrennung und das Verschwinden nach Freigabe sind automatisiert getestet.
- Die vollständige Testsuite mit 52 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Konfigurierbare erlaubte Tischkombinationen (BV-003)

**Kontext:** Das Tischmodell kennzeichnet bislang nur, ob ein Tisch grundsätzlich kombinierbar ist. Für eine verbindliche Konfiguration muss zusätzlich gespeichert werden, welche Mengen aus mindestens zwei Tischen tatsächlich gemeinsam genutzt werden dürfen. Die konkreten Kombinationen der Standorte sind noch offen und dürfen nicht vorgegeben werden.

### Entscheidung

Eine erlaubte Tischkombination wird als standortgebundener Datensatz mit einer n:m-Zuordnung zu mindestens zwei unterschiedlichen Tischen persistiert. Beim Anlegen werden Tisch-IDs sortiert und zu einem kanonischen Schlüssel zusammengeführt, sodass dieselbe Tischmenge unabhängig von ihrer Auswahlreihenfolge nur einmal gespeichert werden kann.

Alle Mitgliedstische müssen vorhanden, aktiv, grundsätzlich kombinierbar und demselben Standort wie die Kombination zugeordnet sein. Die serverseitige Fachoperation prüft diese Regeln in einer Transaktion. Datenbanktrigger schützen Standortbindung, Aktivstatus und Kombinierbarkeit zusätzlich und verhindern, dass ein verwendeter Tisch nachträglich eine bestehende Kombination ungültig macht. Kombinationen können ausdrücklich entfernt werden.

Es werden keine Kombinationen als Stammdaten vorgegeben. Die Konfiguration wird weder für Gruppenplanung noch für automatische Tischzuordnung oder Reservierungsprüfung verwendet.

### Konsequenzen

- Erlaubte Kombinationen beliebig vieler Tische können in der Tischverwaltung angelegt, angezeigt und entfernt werden.
- Standortfremde, inaktive, nicht kombinierbare und doppelte Tischmengen werden abgewiesen.
- Bestehende Kombinationen müssen vor einer widersprechenden Änderung ihrer Mitgliedstische zuerst entfernt werden.
- Migration, vollständige Testsuite mit 58 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Standortreine operative Übersichten (BV-029)

**Kontext:** Die Tischübersicht war bereits standortbezogen, während Reservierungsliste, reale Belegungen und Walk-in-Erfassung Daten beider Standorte gemeinsam luden. Im laufenden Betrieb sollen Mitarbeitende einen Standort betrachten, ohne operative Daten des anderen Standorts in derselben Ansicht zu sehen oder auszuwählen.

### Entscheidung

Reservierungen, reale Belegungen und Walk-in-Erfassung erhalten einen serverseitig ausgewerteten Standortfilter. Ohne Parameter wird der erste aktive Standort gewählt; eine übergebene ID wird nur akzeptiert, wenn sie zu einem aktiven Standort aus der verfügbaren Auswahl gehört. Reservierungen, Tische, offene Belegungen und platzierbare Tischzuordnungen werden bereits in der Datenbankabfrage auf diesen Standort begrenzt.

Der gewählte Standort bleibt nach operativen Aktionen in der Ziel-URL erhalten. Die bestehende Tischübersicht wird nicht verändert, weil sie Standortauswahl und Standorttrennung bereits erfüllt.

Es werden keine Rollen, Reservierungsstatusfolgen, Bestellungen, Rabatte oder Rechnungen eingeführt oder verändert.

### Konsequenzen

- Die betroffenen operativen Ansichten zeigen und verwenden jeweils Daten genau eines aktiven Standorts.
- Standortfremde Reservierungen, Tische, Belegungen und Platzierungsoptionen werden serverseitig ausgeschlossen.
- Ungültige oder inaktive Standortparameter führen nicht zu einer vermischten Ansicht.
- Standortauswahl und Standorttrennung sind automatisiert getestet; 61 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Mitarbeiterstammdaten ohne Anmeldung oder Autorisierung (BV-026)

**Kontext:** Mitarbeitende benötigen stabile Stammdaten für spätere Identitäts- und Berechtigungsfunktionen. Das Verfahren für Benutzerkonten und Anmeldung ist weiterhin offen und gehört nicht zu BV-026.

### Entscheidung

Ein Mitarbeiter wird mit Name, global eindeutigem Benutzernamen, Rolle, Hauptstandort und Aktivstatus persistiert. Zulässig sind ausschließlich die Rollen `inhaber`, `manager`, `bedienung` und `kueche`. Der Hauptstandort muss bei jedem Anlegen oder Bearbeiten vorhanden und aktiv sein. Mitarbeitende werden deaktiviert statt gelöscht, damit stabile Kennungen und spätere historische Beziehungen erhalten bleiben können.

Der Benutzername ist in BV-026 ausschließlich ein Stammdatum. Es werden keine Passwörter, Konten, Sitzungen, Anmeldung oder Rechteprüfung eingeführt. Aus der gepflegten Rolle entsteht noch keine Autorisierung.

### Konsequenzen

- Mitarbeiterstammdaten können über eine deutsche Verwaltungsoberfläche angelegt und bearbeitet werden.
- Eindeutigkeit des Benutzernamens, Rollenmenge und Standortrelation sind datenbankseitig abgesichert; der aktive Hauptstandort wird zusätzlich an der serverseitigen Schreibgrenze geprüft.
- Anmeldung und Autorisierung bleiben vollständig den separaten späteren Features vorbehalten.
- Migration, vollständige Testsuite mit 69 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Standortabhängiges Artikelangebot mit Grillinvariante (BV-021)

**Kontext:** Artikel sollen nur an ausdrücklich freigegebenen Standorten angeboten werden. Grillartikel dürfen insbesondere in Spandau nicht angeboten werden. Eine allgemeine Speisekartenverwaltung, Bestellungen und Rollenprüfungen sind nicht Teil dieses Slices.

### Entscheidung

Ein Artikel wird minimal mit Name, ganzzahligem Preis in Cent, Grillbedarf und Aktivstatus persistiert. Die ausdrückliche Standortfreigabe wird als eindeutige n:m-Zuordnung zwischen Artikel und Standort gespeichert. Eine Zuordnung ist nur zwischen einem aktiven Artikel und einem aktiven Standort zulässig. Benötigt der Artikel einen Grill, muss der Standort `hatGrill = true` besitzen; die Regel wird nicht an einen Standortnamen gekoppelt.

Die Fachoperation prüft Referenzen, Aktivstatus und Grillfähigkeit innerhalb einer Transaktion. SQLite-Trigger erzwingen dieselben Regeln zusätzlich bei direkten Zuordnungen und verhindern, dass nachträgliche Änderungen an Artikel oder Standort ein bestehendes Angebot ungültig machen. Die Bedienoberfläche ist ausschließlich eine standortbezogene Leseansicht; Artikelpflege und Angebotsänderungen werden nicht über die UI bereitgestellt.

### Konsequenzen

- Das gültige aktive Artikelangebot kann getrennt pro aktivem Standort gelesen werden.
- Grillartikel können in Spandau und an jedem anderen Standort ohne Grill weder über die Fachoperation noch direkt in der Datenbank freigegeben werden.
- Preise werden ohne Fließkommazahlen als Centbeträge gespeichert.
- Eine widersprechende Deaktivierung oder Änderung von Grillbedarf beziehungsweise Grillfähigkeit setzt voraus, dass betroffene Standortfreigaben zuvor entfernt werden.
- Migration, vollständige Testsuite mit 75 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-17 — Speisekartenverwaltung auf dem bestehenden Artikelangebot (BV-020)

**Kontext:** BV-021 hat Artikel und ihre standortabhängige Freigabe minimal persistiert, die allgemeine Pflege aber ausdrücklich ausgespart. BV-020 ergänzt diese Bedien- und Schreibgrenze, ohne Bestellungen, Rollen oder weitere Menüstrukturen vorwegzunehmen.

### Entscheidung

Artikel werden um eine verpflichtende freie Kategorie ergänzt. Name und Kategorie dürfen nicht leer sein; der Preis wird weiterhin als nicht negativer sicherer Ganzzahl-Centbetrag verarbeitet. Über eine deutsche Verwaltungsoberfläche können Artikel angelegt, bearbeitet und durch Setzen des Aktivstatus deaktiviert werden. Ein Löschen von Artikeln wird nicht angeboten.

Standortfreigaben werden gemeinsam mit den Artikeldaten in einer Transaktion gepflegt. Es können ausschließlich aktive Standorte ausgewählt werden; Grillartikel dürfen nur Grillstandorten zugeordnet werden. Beim Deaktivieren werden vorhandene Standortfreigaben vor der Statusänderung atomar entfernt, sodass die BV-021-Invariante erhalten bleibt. Rollenprüfung und Anmeldung bleiben den dafür vorgesehenen separaten Features vorbehalten.

### Konsequenzen

- Die Speisekarte kann einschließlich Kategorie, Centpreis, Grillbedarf, Aktivstatus und gültigen Standortfreigaben vollständig gepflegt werden.
- Ungültige Standort- oder Grillzuordnungen hinterlassen keine teilweise gespeicherten Änderungen.
- Es werden keine Kategorienentität, Bestellungen, Bestellpositionen, Rechnungen oder Beispiel- und Seed-Daten eingeführt.
- Migration, vollständige Testsuite mit 78 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-18 — Euro-und-Cent-Eingabe für Speisekartenpreise (BV-020)

**Kontext:** Die Speisekartenverwaltung verlangte von Mitarbeitenden einen technischen Centbetrag wie `1250`, obwohl Preise fachlich als `12,50 €` erfasst werden sollen. Die Speicherung als ganzzahliger Centbetrag bleibt für exakte Geldberechnungen richtig.

### Entscheidung

Die Speisekarte nimmt nicht negative Preise im deutschen Dezimalformat mit Komma und höchstens zwei Nachkommastellen entgegen. Die serverseitige Eingabegrenze wandelt die Zeichenfolge ohne Fließkommarechnung in einen ganzzahligen Centbetrag um; Anzeige und Bearbeitungsformular stellen den Betrag mit zwei Nachkommastellen dar. Die Persistenz bleibt unverändert in Cent.

### Konsequenzen

- Ein Preis kann beispielsweise als `12,50` eingegeben und als `12,50 €` angezeigt werden.
- Leere, negative, nicht numerische Eingaben und mehr als zwei Nachkommastellen werden abgewiesen.
- Preisberechnung und Persistenz verwenden weiterhin keine Fließkommazahlen.
- Vollständige Testsuite mit 80 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-18 — Leere offene Bestellung als standortgebundener Einstieg (BV-014)

**Kontext:** Nach Tisch-, Reservierungs-, Mitarbeiter- und Speisekartenstammdaten soll erstmals eine Bestellung eröffnet werden können. Bestellpositionen, Preis-Snapshots und weitere Bestellstatus gehören ausdrücklich zu späteren, getrennten Features.

### Entscheidung

Eine Bestellung wird mit Standort, aktivem Tisch, optionaler Reservierung, aktivem aufnehmendem Mitarbeiter, Status und Erstellzeitpunkt persistiert. Tisch und Hauptstandort des Mitarbeiters müssen dem aktiven Standort der Bestellung entsprechen; eine gewählte Reservierung muss ebenfalls zu diesem Standort gehören. Die Fachoperation prüft den vollständigen Kontext innerhalb einer Transaktion. Datenbanktrigger schützen dieselben Regeln bei Anlage und Bearbeitung.

BV-014 erzeugt und pflegt ausschließlich leere Bestellungen mit dem Status `offen`. Der Status ist weder in der Oberfläche wählbar noch über diesen Slice änderbar. Die Mitarbeiterreferenz dient nur der fachlichen Erstellerkennung und führt keine Anmeldung, Sitzung oder Rollenprüfung ein.

### Konsequenzen

- Leere Bestellungen können über eine deutsche, standortbezogene Oberfläche eröffnet und ihre Tisch-, Reservierungs- und Mitarbeiterzuordnung gepflegt werden.
- Ungültige, inaktive oder standortfremde Referenzen werden ohne teilweise gespeicherte Änderungen zurückgewiesen.
- Bestellpositionen, Artikel, Preis-Snapshots, Küche, Rechnungen, Zahlungen, Rabatte, Stornos sowie Seed- und Beispieldaten sind nicht enthalten.
- Migration, vollständige Testsuite mit 85 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-18 — Widerrufbare interne Mitarbeitersitzung ohne Autorisierung (BV-027)

**Kontext:** BV-026 stellt Mitarbeiterstammdaten mit Benutzername, Rolle, Hauptstandort und Aktivstatus bereit, beweist aber keine Identität. Rollen- oder Standortrechte dürfen nicht auf einer vom Client behaupteten Mitarbeiterkennung aufbauen.

### Entscheidung

Authentifizierungsdaten werden in einer eigenen 1:1-Beziehung zum vorhandenen Mitarbeiter gespeichert. Passwörter haben mindestens zwölf Zeichen und werden mit Node.js `scrypt`, einem individuellen zufälligen Salt und einem 64-Byte-Schlüssel gehasht. Ein lokales Kommando setzt oder ersetzt das Passwort ausschließlich für einen vorhandenen Benutzernamen; es legt weder Mitarbeitende noch Beispieldaten an und widerruft beim Zurücksetzen alle Sitzungen der Person.

Eine erfolgreiche Anmeldung erzeugt ein kryptografisch zufälliges Token mit zwölf Stunden Gültigkeit. Der Browser erhält es als `HttpOnly`-, `SameSite=Strict`-Cookie; die Datenbank speichert nur seinen SHA-256-Hash. Jede geschützte Anfrage löst die Sitzung serverseitig auf und lädt den Mitarbeiter neu. Unbekannte, abgelaufene oder manipulierte Sitzungen sowie Sitzungen inzwischen deaktivierter Mitarbeitender werden abgelehnt. Die Abmeldung entfernt Sitzung und Cookie.

Rolle und Hauptstandort werden zusammen mit der bestätigten Mitarbeiteridentität bereitgestellt, aber in diesem Slice nicht als Berechtigung ausgewertet. Alle angemeldeten Rollen erreichen deshalb weiterhin dieselben vorhandenen Funktionen.

### Konsequenzen

- Die Anwendung kennt einen eindeutig angemeldeten aktiven Mitarbeiter und zeigt Name sowie Rolle an.
- Direkte App-Aufrufe ohne gültige Sitzung werden zur deutschen Anmeldeseite geleitet.
- Deaktivierung und Passwort-Reset machen bestehende Sitzungen ohne Client-Vertrauen unwirksam.
- Rollenrechte, Standortberechtigungen, fachliche Freigaben, Auditierung und Seed-Daten werden nicht eingeführt.
- Migration, 90 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-18 — Kontrollierter lokaler Demo-Zugangs-Bootstrap (Ergänzung zu BV-027)

**Kontext:** Das einzelne Setzen von Passwörtern per CLI ist für die wiederholte manuelle Demonstration aller vier Rollen unnötig aufwendig. Rollenrechte aus BV-013 bleiben weiterhin außerhalb des Scopes.

### Entscheidung

Ein ausdrücklich manuell gestartetes Entwicklungskommando richtet die vier fest dokumentierten Demo-Mitarbeitenden für Inhaber, Manager, Bedienung und Küche ein. Es aktualisiert vorhandene Datensätze anhand des eindeutigen Benutzernamens, aktiviert sie, bindet sie an Kreuzberg und setzt das gemeinsame Demo-Passwort über die bestehende `scrypt`-Hashing-Logik. Falls Kreuzberg fehlt, wird nur der vom Schema verlangte minimale aktive Standort angelegt; ein vorhandener inaktiver Standort wird reaktiviert. Das Kommando verweigert die Ausführung bei `NODE_ENV=production`.

### Konsequenzen

- Wiederholte Ausführung erzeugt weder doppelte Mitarbeitende noch doppelte Standorte.
- Passwortwerte stehen nur in der lokalen Bootstrap-Definition und Dokumentation, niemals als Klartext in der Datenbank; bestehende Sitzungen der vier Konten werden widerrufen.
- Reservierungen, Tische, Gäste, Bestellungen, Artikel, Rechnungen und Rollenautorisierung werden nicht ergänzt.
- Dies ist ausschließlich eine lokale Testhilfe und kein Verfahren zur produktiven Kontenbereitstellung.
- 92 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-18 — Rollenbasierte Zugriffskontrolle als erster Fähigkeitenslice (BV-013)

**Kontext:** BV-027 stellt eine serverseitig bestätigte Mitarbeiteridentität mit Rolle bereit, wertet die Rolle aber noch nicht aus. Alle vier Rollen konnten deshalb dieselben Seiten und Serveroperationen erreichen. Eine Küchenansicht, Standortberechtigungen und fachliche Freigaben sind noch nicht Bestandteil dieses Slices.

### Entscheidung

Die erste Autorisierung unterscheidet zentral die expliziten Fähigkeiten `stammdatenPflegen` und `operativeAblaeufeNutzen`. Inhaber und Manager besitzen beide Fähigkeiten. Bedienung besitzt ausschließlich die operative Fähigkeit. Küche besitzt zunächst keine der beiden Fähigkeiten und erreicht nur die eingeschränkte Startseite mit Sitzungsinformation und Abmeldung.

Standorte, Tische, Tischkombinationen, Mitarbeitende, Speisekarte, Artikelangebot und Standortfreigaben benötigen die Stammdatenfähigkeit. Gäste, Reservierungen, Tischzuweisung, Tischübersicht, Walk-ins, reale Belegungen und bestehende Bestellungen benötigen die operative Fähigkeit. Bekannte Seitenpfade werden bereits vor dem Rendern geprüft; die Seiten und alle zugehörigen Server Actions prüfen zusätzlich selbst. Unbekannte Rollen erhalten standardmäßig keine Fähigkeit.

Rolle und Mitarbeiteridentität werden ausschließlich aus der bei jeder Anfrage serverseitig validierten Sitzung übernommen. Reservierungen und Bestellungen verwenden für ihre gespeicherte Mitarbeiterkennung den Sitzungsmitarbeiter; gleichnamige Formularwerte werden nicht ausgewertet.

### Konsequenzen

- Direkte URLs und direkte Server-Action-Aufrufe umgehen die Rollenprüfung nicht.
- Die Navigation zeigt nur Funktionen, für die die angemeldete Rolle eine Fähigkeit besitzt.
- Manager dürfen in diesem Slice ausdrücklich auch Mitarbeiterstammdaten pflegen.
- Standortberechtigungen, Hauptstandort-Beschränkungen, Gruppenfreigaben, Rabatte, Stornos, Auditierung, Küche, Bestellpositionen, Rechnungen und Catering bleiben außerhalb von BV-013.
- Rollenmatrix, Pfadschutz, Serveroperationsprüfung und ignorierte Clientbehauptungen sind automatisiert getestet; 98 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-19 — Offene Bestellposition mit serverseitigem Preis-Snapshot (BV-015)

**Kontext:** BV-014 kann leere offene Bestellungen führen; Artikel, Centpreise und standortabhängige Angebote bestehen bereits. Für die operative Bestellaufnahme fehlen Positionen, ohne dabei Küchenstatus, Storno oder Abrechnung vorwegzunehmen.

### Entscheidung

Eine Bestellposition referenziert genau eine Bestellung und einen Artikel und speichert positive ganzzahlige Menge, optionalen Sonderwunsch, Status sowie den Einzelpreis als ganzzahligen Cent-Snapshot. Positionen können ausschließlich zu offenen Bestellungen angelegt und bearbeitet werden. Beim Anlegen wird nur ein aktiver Artikel akzeptiert, der dem aktiven Standort der Bestellung ausdrücklich angeboten wird. Der Einzelpreis wird innerhalb der serverseitigen Transaktion aus dem Artikel gelesen und niemals aus Formular- oder Clientdaten übernommen.

Neue Positionen erhalten ausschließlich den Status `offen`. Beim Bearbeiten können nur Menge und Sonderwunsch geändert werden; Artikel, Bestellung, Preis-Snapshot und Status bleiben unverändert. Datenbanktrigger sichern dieselben Regeln gegen direkte Schreibzugriffe und verhindern einen Standortwechsel der Bestellung, wenn dadurch ihr vorhandenes Artikelangebot ungültig würde. Die bestehenden Seiten und Server Actions verwenden weiterhin die Fähigkeit `operativeAblaeufeNutzen`.

### Konsequenzen

- Bedienung, Manager und Inhaber können in der bestehenden Bestellansicht Positionen hinzufügen, sehen und bearbeiten.
- Spätere Artikelpreisänderungen verändern vorhandene Preis-Snapshots nicht.
- Küchenansicht, weitere Positionsstatus, Storno, Rechnung, Zahlung, Rabatt, Auditierung sowie Seed- und Beispieldaten werden nicht eingeführt.
- Migration, vollständige Testsuite mit 103 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich verifiziert.

## 2026-07-19 — Getrennte Küchenansicht mit linearer Statusfolge (BV-016)

**Kontext:** Offene Bestellpositionen sind vorhanden, der Küche fehlt jedoch eine auf die Zubereitung begrenzte Arbeitsansicht. Die bestehende operative Fähigkeit würde der Küche zugleich Zugriff auf fachfremde Funktionen geben.

### Entscheidung

Die neue Fähigkeit `kuechenstatusPflegen` wird ausschließlich Küche, Manager und Inhaber zugeordnet. Sie schützt sowohl die Seite `/kueche` als auch die zugehörige Server Action und wird bei jeder Anfrage aus der serverseitig validierten Mitarbeitersitzung geprüft. Bedienung erhält diese Fähigkeit nicht.

Die Ansicht zeigt ausschließlich Positionen mit Status `offen` oder `inZubereitung` und nennt Standort, Tisch, Artikel, Menge und Sonderwunsch. Der Status kann ausschließlich linear von `offen` nach `inZubereitung` und anschließend nach `serviert` wechseln. Die Fachoperation prüft den erwarteten Vorgängerstatus innerhalb einer Transaktion; ein Datenbanktrigger weist übersprungene, rückwärts gerichtete und unbekannte Übergänge auch bei direkten Schreibzugriffen ab.

### Konsequenzen

- Servierte Positionen verschwinden aus der zubereitungsrelevanten Arbeitsliste.
- Preis-Snapshot, Menge, Sonderwunsch, Artikel- und Bestellzuordnung werden durch einen Küchenstatuswechsel nicht verändert.
- Rechnungen, Zahlungen, Rabatte, Stornos, Freigaben, Auditierung, Gruppenfunktionen, Catering, Seed-Daten und Standortberechtigungen werden nicht eingeführt.
- Vollständige Testsuite mit 108 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.

## 2026-07-19 — Kontrolliertes Storno von Bestellpositionen (BV-019)

**Kontext:** Bestellpositionen besitzen bereits die Küchenstatus `offen`, `inZubereitung` und `serviert`. Stornos sind eine kritische Aktion, die Bedienung und Küche nicht selbstständig ausführen dürfen. Ein Storno nach dem Servieren ist fachlich bislang nicht vorgesehen.

### Entscheidung

Die eigene Fähigkeit `bestellpositionStornieren` wird ausschließlich Manager und Inhaber zugeordnet und bei jedem Aufruf der Storno-Server-Action aus der validierten Sitzung geprüft. Die Position darf nur von `offen` oder `inZubereitung` nach `storniert` wechseln. `serviert` → `storniert` wird mangels bestehender fachlicher Festlegung abgelehnt; `storniert` ist ein unveränderlicher Endstatus.

Ein wirksames Storno speichert Status, Zeitpunkt und den aktiven freigebenden Mitarbeiter gemeinsam. Artikel, Bestellung, Menge, Sonderwunsch und Preis-Snapshot bleiben unverändert. Ein Datenbanktrigger erzwingt die Statusfolge, die Rolle des Freigebenden sowie die Unveränderlichkeit der Positionsdaten auch bei direkten Schreibzugriffen. Die bestehende Bestellansicht zeigt stornierte Positionen weiterhin mit der minimalen Stornohistorie, während die Küchenansicht sie nicht als zubereitungsrelevant lädt.

### Konsequenzen

- Manipulierte Server-Action-Aufrufe durch Bedienung oder Küche werden vor der Fachoperation abgelehnt.
- Es entsteht kein allgemeines Auditmodell und kein Antrags- oder Mehrpersonen-Freigabeverfahren.
- Rechnung, Zahlung, Rabatt, Catering, Gruppenfunktionen sowie Seed- und Beispieldaten bleiben unverändert außerhalb dieses Slices.
- Vollständige Testsuite mit 114 Tests, TypeScript-Prüfung und Produktions-Build wurden erfolgreich ausgeführt.
