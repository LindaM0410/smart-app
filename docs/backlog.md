# Backlog — Bella Vista Restaurant-App

_Stand: 19. Juli 2026_

_Stabile Feature-IDs. IDs werden nicht umnummeriert oder wiederverwendet. Quelle aller initialen Einträge: `docs/spec.md`._

## Statuswerte

| Status | Bedeutung |
| --- | --- |
| `hypo` | Annahme, noch nicht mit Nutzer bestätigt |
| `validated` | fachlich bestätigt, noch nicht implementiert |
| `in-progress` | aktuell in Umsetzung |
| `done` | implementiert und verifiziert |
| `killed` | verworfen; Begründung in `docs/decisions.md` |

Die Anforderungen sind aus der Spezifikation übernommen, aber noch nicht durch Nutzerinterviews oder einen Pilot validiert. Deshalb starten sie als `hypo`.

## Phase 1 — Kern: Reservierung und Tischplanung

Ziel: Der Reservierungsbetrieb soll ohne Zettelchaos funktionieren.

| ID | Feature | Phase | Status | Akzeptanzkern |
| --- | --- | ---: | --- | --- |
| BV-001 | Standorte verwalten | 1 | done | Kreuzberg und Spandau mit Adresse, Kapazität, Terrasse, Grillfähigkeit und Aktivstatus abbilden; Formular rendert mit lokalem, serialisierbarem Initialstatus ohne Runtime-Fehler (verifiziert am 16.07.2026) |
| BV-002 | Tische verwalten | 1 | done | Tische mit Standort, standortweit eindeutiger Nummer, positiver Kapazität, gültigem Bereich, Kombinierbarkeit und Aktivstatus pflegen; Standortbindung und Validierung werden server- und datenbankseitig erzwungen (verifiziert am 17.07.2026) |
| BV-003 | Tischkombinationen konfigurieren | 1 | done | Erlaubte Mengen aus mindestens zwei unterschiedlichen aktiven, kombinierbaren Tischen desselben Standorts anlegen, anzeigen und entfernen; Reihenfolge-Duplikate sowie ungültige Mitgliedstische server- und datenbankseitig abweisen, ohne konkrete Kombinationen vorzugeben (verifiziert am 17.07.2026) |
| BV-004 | Gäste verwalten | 1 | done | Gäste mit Name, optionaler Telefonnummer und Notiz, Stammgaststatus, Bella-Card-Status, nicht negativer ganzzahliger Besuchsanzahl und Aktivstatus pflegen; Validierung wird serverseitig erzwungen (verifiziert am 17.07.2026) |
| BV-005 | Reservierungen erfassen | 1 | done | Reservierung mit aktivem Gast und Standort, gültigem Planungszeitraum, positiver Personenzahl, definiertem Status, Notiz, serverseitig abgeleitetem Gruppenkennzeichen und Erstellerkennung anlegen und bearbeiten; Standarddauer zwei Stunden sowie Validierung und Persistenz automatisiert getestet (verifiziert am 17.07.2026) |
| BV-006 | Tische Reservierungen zuordnen | 1 | done | Einer Reservierung keine, eine oder mehrere aktive Tische desselben Standorts zuordnen; Zuordnungen anlegen, ersetzen und entfernen sowie Standortbindung, Aktivstatus und Eindeutigkeit serverseitig erzwingen (verifiziert am 17.07.2026) |
| BV-007 | Doppelbuchungen verhindern | 1 | done | Aktive Reservierungen (`angefragt`, `bestaetigt`) dürfen für denselben Tisch keine überlappenden halb-offenen Zeitfenster haben; Konflikte werden bei Anlage und Bearbeitung transaktional geprüft und durch SQLite-Trigger auch bei konkurrierenden Schreibzugriffen atomar verhindert (verifiziert am 17.07.2026) |
| BV-008 | Tischuebersicht pro Standort und Tag anzeigen | 1 | done | Aktive Tische eines gewählten Standorts zu Datum und Uhrzeit als frei, innerhalb der nächsten 60 Minuten reserviert oder real belegt anzeigen; offene Belegung hat Vorrang, nicht blockierende Reservierungsstatus und andere Standorte bleiben unberücksichtigt (verifiziert am 17.07.2026) |
| BV-009 | Walk-ins platzieren | 1 | done | Walk-in mit aktivem Gast an einem aktiven, ausreichend großen Tisch desselben aktiven Standorts nur bei freiem zweistündigem halb-offenem Zeitfenster platzieren; bestätigte Walk-in-Reservierung, Tischzuordnung und reale Belegung werden atomar angelegt, Konflikte vollständig zurückgerollt (verifiziert am 17.07.2026) |
| BV-010 | No-Shows erfassen | 1 | done | bestätigte Reservierung frühestens 15 Minuten nach geplantem Beginn manuell als `noShow` markieren; serverseitig geprüfte Statusänderung gibt die Tischplanung frei, beendet aber keine reale Belegung (verifiziert am 17.07.2026) |
| BV-011 | Warnung vor Folgereservierung | 1 | done | Für real belegte Tische innerhalb der nächsten 20 Minuten vor einer blockierenden Folgereservierung desselben Tisches warnen; nicht blockierende Status und andere Standorte bleiben unberücksichtigt, nach Tischfreigabe verschwindet die Warnung (verifiziert am 17.07.2026) |
| BV-012 | Gruppenreservierungen planen | 1 | hypo | Reservierungen ab 8 Personen als Gruppe behandeln und nur Inhaber/Manager Gruppenplanung erlauben |
| BV-013 | Rollen und Berechtigungen erzwingen | 1 | done | Inhaber und Manager dürfen Stammdaten und operative Abläufe, Bedienung nur operative Abläufe nutzen; Küche erhält bis zu einer passenden Küchenansicht nur die eingeschränkte Startseite. Seiten, direkte Pfade und Server Actions prüfen zentrale Fähigkeiten aus der validierten Sitzung; Akteurskennungen für Reservierungen und Bestellungen stammen ausschließlich aus der Sitzung (mit 98 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 18.07.2026) |
| BV-025 | Audit kritischer Aktionen | 1 | hypo | Freigaben, Rabatte, Stornos und sensible Änderungen mit Akteur, Zeitpunkt und Änderung nachvollziehbar protokollieren |
| BV-026 | Mitarbeiter verwalten | 1 | done | Mitarbeiter mit Name, eindeutigem Benutzernamen, einer der vier definierten Rollen, aktivem Hauptstandort und Aktivstatus pflegen; Validierung, Standortbindung und Rollenmenge werden server- bzw. datenbankseitig erzwungen (verifiziert am 17.07.2026) |
| BV-027 | Interne Anmeldung bereitstellen | 1 | done | Vorhandene aktive Mitarbeitende können sich mit gesetztem Passwort anmelden und abmelden; eine serverseitig validierte, widerrufbare Sitzung liefert eindeutig Mitarbeiter, Rolle und Hauptstandort, wird bei Deaktivierung unwirksam und widersteht falschen Zugangsdaten sowie manipulierten Sitzungen, ohne Rollen- oder Standortrechte einzuführen; ein expliziter, idempotenter lokaler Bootstrap richtet vier anmeldbare Demo-Rollen ohne weitere Fachdaten ein (verifiziert am 18.07.2026) |
| BV-028 | Reale Tischbelegung führen | 1 | done | Zugeordnete aktive Tische für Reservierungen ausdrücklich platzieren und freigeben; pro Tisch höchstens eine offene, historisierte Belegung, die unabhängig von Planungsende und Reservierungsstatus ausschließlich durch Freigabe endet (verifiziert am 17.07.2026) |
| BV-029 | Standortfilter für operative Übersichten | 1 | done | Reservierungen, reale Belegungen und Walk-in-Erfassung auf einen gewählten aktiven Standort begrenzen; angezeigte und auswählbare operative Daten anderer Standorte serverseitig ausschließen und die Auswahl nach Aktionen erhalten (verifiziert am 17.07.2026) |
| BV-030 | Reservierungsstatus verwalten | 1 | hypo | Statusfolge und Blockierwirkung von `angefragt`, `bestaetigt`, `storniert`, `noShow`, `abgeschlossen` korrekt anwenden |
| BV-031 | Standortbindung prüfen | 1 | hypo | Reservierungen, Tische und Mitarbeitendenkontext müssen bei schreibenden Operationen konsistent zum Standort passen |

## Technisches Grundgerüst

| ID | Feature | Phase | Status | Akzeptanzkern |
| --- | --- | ---: | --- | --- |
| BV-040 | Next.js- und Datenbankgrundgerüst | 0 | done | Anwendung startet lokal mit Next.js/TypeScript; Prisma erzeugt einen SQLite-Client aus dem Schema; TypeScript-Prüfung und Produktions-Build laufen erfolgreich (verifiziert am 15.07.2026) |

## Phase 2 — Bestellung und Abrechnung

Ziel: Bestellungen und Rechnungen sollen weniger Fehler verursachen.

| ID | Feature | Phase | Status | Akzeptanzkern |
| --- | --- | ---: | --- | --- |
| BV-014 | Bestellungen pro Tisch aufnehmen | 2 | done | Leere Bestellungen an einem aktiven Tisch mit aktivem, standortgleichem Mitarbeiter eröffnen und pflegen, optional einer standortgleichen Reservierung zuordnen und ausschließlich mit Status `offen` führen; Standortregeln werden server- und datenbankseitig atomar erzwungen (verifiziert am 18.07.2026) |
| BV-015 | Bestellpositionen verwalten | 2 | done | Zu offenen Bestellungen Positionen mit aktivem Artikel aus dem gültigen Standortangebot, positiver ganzzahliger Menge und optionalem Sonderwunsch anlegen und bearbeiten; Preis ausschließlich serverseitig als unveränderlichen Cent-Snapshot übernehmen und neue Positionen ausschließlich mit Status `offen` führen; Rollen- und Standortregeln werden server- und datenbankseitig erzwungen (mit 103 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 19.07.2026) |
| BV-016 | Küchenansicht bereitstellen | 2 | done | Küche, Manager und Inhaber sehen unter `/kueche` ausschließlich zubereitungsrelevante Positionen mit Tisch, Standort, Artikel, Menge und Sonderwunsch und dürfen serverseitig nur `offen` → `inZubereitung` → `serviert` ausführen; Bedienung bleibt ausgeschlossen (mit 108 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 19.07.2026) |
| BV-017 | Rechnungen erzeugen | 2 | done | Pro Bestellung höchstens eine Rechnung mit initialem Status `offen` und serverseitig über BV-033 berechnetem Bruttobetrag-Snapshot in Cent erzeugen; mindestens eine nicht stornierte Position voraussetzen; Inhaber, Manager und Bedienung zulassen, Küche sperren; Rechnung in der Bestellansicht anzeigen (mit 125 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 19.07.2026) |
| BV-018 | Bella-Card-Rabatt anwenden | 2 | hypo | 15 % Rabatt nur fuer zahlenden Gast mit aktiver Bella-Card und Freigabe durch Inhaber/Manager anwenden |
| BV-019 | Storno-Freigabe erzwingen | 2 | done | Manager und Inhaber dürfen offene oder in Zubereitung befindliche Bestellpositionen serverseitig geprüft stornieren; Bedienung und Küche bleiben ausgeschlossen. Stornierte Positionen sind mit Freigabeakteur und Zeitpunkt historisiert, unveränderlich, in der Bestellung sichtbar und aus der Küchenarbeit ausgeschlossen; `serviert` bleibt mangels fachlicher Freigabe nicht stornierbar (mit 114 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 19.07.2026) |
| BV-032 | Bestellstatus verwalten | 2 | hypo | Bestellungen können `offen`, `inBearbeitung`, `abgeschlossen`, `bezahlt` oder `storniert` sein |
| BV-033 | Rechnungsbetrag korrekt berechnen | 2 | done | Berechenbaren Bruttobetrag aus Menge und unveränderlichem Cent-Preis-Snapshot aller nicht stornierten Positionen ohne Fließkommaarithmetik ermitteln; leere Bestellungen ergeben 0 Cent, unsichere Ganzzahloperationen werden abgewiesen (mit 120 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 19.07.2026) |
| BV-034 | Zahlungsstatus erfassen | 2 | hypo | Rechnungen mit Status `offen`, `bezahlt` oder `storniert` und Zahlungsart `bar` oder `karte` führen |
| BV-035 | Bestellung und Rechnung standortkonsistent halten | 2 | hypo | Bestellung, Tisch, Reservierung, Artikelverfügbarkeit und Mitarbeitender gehören zum gleichen Standortkontext |

## Phase 3 — Erweiterung

Ziel: Der Betrieb soll über Reservierung und Bestellung hinaus strukturierter werden.

| ID | Feature | Phase | Status | Akzeptanzkern |
| --- | --- | ---: | --- | --- |
| BV-020 | Speisekarte verwalten | 3 | done | Artikel mit Name, Kategorie, centgenauem Preis im deutschen Euroformat, Grillbedarf, Aktivstatus und Standortfreigaben anlegen, bearbeiten und deaktivieren; BV-021-Regeln werden server- und datenbankseitig bewahrt (Euro-und-Cent-Eingabe mit 80 Tests, TypeScript-Prüfung und Produktions-Build verifiziert am 18.07.2026) |
| BV-021 | Standortabhängiges Artikelangebot steuern | 3 | done | Aktive Artikel werden mit ganzzahligen Centpreisen ausdrücklich aktiven Standorten zugeordnet und pro Standort gelesen; Grillartikel können server- und datenbankseitig nur Standorten mit Grill zugeordnet werden, bestehende Angebote bleiben bei Änderungen gültig (verifiziert am 17.07.2026) |
| BV-022 | Firmenkundenkontakte verwalten | 3 | hypo | Firma, Ansprechperson und Kontaktdaten fuer Catering wiederfinden und pflegen |
| BV-023 | Catering-Aufträge verwalten | 3 | hypo | Auftrag mit Firma, Kontakt, Lieferadresse, Datum, Uhrzeit, Personenzahl, Menü, Preis und Status speichern |
| BV-024 | Catering-Statusfolge erzwingen | 3 | hypo | Catering-Aufträge durchlaufen `angefragt` → `bestaetigt` → `geliefert` → `bezahlt` |
| BV-036 | Gruppenmenü verwalten | 3 | hypo | fuer Gruppenreservierungen kann ein vorgesehenes Gruppenmenü geplant und dokumentiert werden |
| BV-037 | Einfache No-Show-Auswertung | 3 | hypo | No-Shows lassen sich einfach nach Zeitraum und Standort auswerten |
| BV-038 | Einfache Stammgast-Auswertung | 3 | hypo | Stammgäste und Bella-Card-Gäste lassen sich einfach finden und auswerten |
| BV-039 | Einfache Catering-Auswertung | 3 | hypo | Catering-Aufträge lassen sich nach Zeitraum, Status und Firma auswerten |

## Nicht Teil der ersten Version

Diese Punkte sind explizit außerhalb des MVP-Scopes und erhalten deshalb keine Feature-ID fuer die erste Version:

| Thema | Status | Begründung |
| --- | --- | --- |
| Öffentliche Online-Reservierung durch Gäste | out-of-scope | Gäste nutzen die App nicht selbst |
| Lieferung | out-of-scope | nicht Teil des ersten Restaurant-Kernbetriebs |
| Kassenintegration | out-of-scope | Integration nach MVP klären |
| Zahlungsanbieter-Integration | out-of-scope | Rechnung und Zahlungsstatus reichen fuer V1 |
| Vollständige Personalplanung | out-of-scope | Rollen und Mitarbeitende ja, Dienstplanung nein |
| Automatische Marketingfunktionen | out-of-scope | nicht Ziel der ersten Version |
| Migration alter Reservierungen und Bestellungen | out-of-scope | alte Zettel und Bestellungen müssen nicht migriert werden |
| Automatische Teilrechnung | out-of-scope | Teilrechnungen sind noch offene Frage |
| Komplexe Auswertungen | out-of-scope | nur einfache Auswertungen in Phase 3 |

Alte Stammgastdaten und Firmenkundenkontakte können manuell übernommen werden.

## Offene Fragen aus der Spezifikation

Diese offenen Punkte blockieren keine Feature-ID, müssen aber vor der jeweiligen Umsetzung geklärt oder als Entscheidung dokumentiert werden:

| Frage | Betrifft |
| --- | --- |
| Welche genauen Öffnungszeiten gelten je Standort? | BV-008, BV-009, BV-011 |
| Welche konkreten Tischkombinationen sind in Kreuzberg erlaubt? | BV-003, BV-006, BV-012 |
| Welche konkreten Tischkombinationen sind in Spandau erlaubt? | BV-003, BV-006, BV-012 |
| Soll es Teilrechnungen in der ersten Version geben? | BV-017, BV-034 |
| Wie werden Benutzerkonten für Mitarbeitende angelegt? | BV-027 |
| Welche Geräte werden im Restaurant genutzt? | alle Bedienoberflächen |
| Muss die App offline funktionieren? | Architekturentscheidung vor Implementierung |
| Welche Gastdaten dürfen wie lange gespeichert werden? | BV-004, BV-025 |

## Pflege

- Neue Features erhalten die nächste freie `BV-NNN`-ID.
- Featurebeginn: Status auf `in-progress`, Branch oder Plan referenzieren.
- Fertigstellung: Status erst nach Tests auf `done`, Commit referenzieren.
- Verworfen: Status `killed`, Begründung in `docs/decisions.md`; Zeile bleibt bestehen.
- Produktänderungen werden zuerst in `docs/spec.md` dokumentiert und anschließend hier synchronisiert.
