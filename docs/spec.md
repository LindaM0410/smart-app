# SPEC.md — Bella Vista Restaurant-App

## 1. Kontext und Ziel

Bella Vista ist ein italienisches Restaurant mit zwei Standorten in Berlin: Kreuzberg und Spandau.

Der Betrieb arbeitet aktuell mit Zetteln, Excel-Listen, Telefonnotizen und einzelnen Word-Dokumenten. Dadurch entstehen Fehler bei Reservierungen, Tischplanung, Bestellungen, Abrechnung, Stammgästen und Catering-Aufträgen.

Die App soll eine interne Restaurant-App für Mitarbeitende werden. Gäste nutzen die App nicht selbst.

Das wichtigste Ziel ist eine zuverlässige Reservierungs- und Tischübersicht. Mitarbeitende sollen pro Standort sehen, welche Tische frei, bald reserviert oder belegt sind. Doppelbuchungen und unklare Tischsituationen sollen verhindert werden.

Die erste Version soll den Kernbetrieb stabil abbilden. Sie muss nicht alle möglichen Sonderfälle lösen.

---

## 2. Scope der ersten Version

Die erste Version soll folgende Abläufe unterstützen:

1. Standorte und Tische verwalten
2. Gäste und Stammgäste erfassen
3. Reservierungen anlegen, ändern und stornieren
4. Reservierungen passenden Tischen zuordnen
5. Doppelbuchungen verhindern
6. Tischübersicht pro Standort und Tag anzeigen
7. Walk-in-Gäste anhand freier Zeitfenster platzieren
8. No-Shows erfassen
9. Bestellungen pro Tisch aufnehmen
10. Rechnungen aus Bestellungen erzeugen
11. Bella-Card-Rabatt korrekt anwenden
12. einfache Catering-Aufträge verwalten

Nicht Teil der ersten Version sind:

- öffentliche Online-Reservierung durch Gäste
- Lieferung
- Kassenintegration
- Zahlungsanbieter-Integration
- vollständige Personalplanung
- automatische Marketingfunktionen
- Migration alter Reservierungen und alter Bestellungen

Alte Stammgastdaten und Firmenkundenkontakte können manuell übernommen werden. Alte Zettel mit Reservierungen oder Bestellungen müssen nicht migriert werden.

---

## 3. Rollen und Rechte

### 3.1 Inhaber

Der Inhaber hat vollständigen Zugriff. Er darf Standorte, Tische, Reservierungen, Gäste, Bestellungen, Rechnungen, Rabatte, Stornos, Speisekarte, Mitarbeitende und Catering verwalten.

### 3.2 Manager

Manager dürfen Reservierungen planen, Tische zuweisen, Gruppenreservierungen verwalten, Gäste pflegen, Bestellungen sehen, Stornos und Rabatte freigeben, Speisekarte pflegen und Catering-Aufträge verwalten.

### 3.3 Bedienung

Bedienung darf Gäste erfassen, Reservierungen anlegen, Gäste platzieren, Bestellungen aufnehmen und Rechnungen erzeugen. Bedienung darf Rabatte und Stornos nicht allein endgültig freigeben.

### 3.4 Küche

Die Küche sieht Bestellungen und Bestellpositionen. Sie darf den Status von Bestellpositionen aktualisieren, aber keine Reservierungen, Gäste, Rechnungen oder Rabatte verwalten.

### 3.5 Rechteübersicht

| Aktion | Inhaber | Manager | Bedienung | Küche |
| --- | --- | --- | --- | --- |
| Reservierungen anlegen | ja | ja | ja | nein |
| Tische zuweisen | ja | ja | ja | nein |
| Gruppenreservierungen planen | ja | ja | nein | nein |
| Bestellungen aufnehmen | ja | ja | ja | nein |
| Bestellstatus ändern | ja | ja | nein | ja |
| Stornos freigeben | ja | ja | nein | nein |
| Rabatte freigeben | ja | ja | nein | nein |
| Speisekarte verwalten | ja | ja | nein | nein |
| Catering verwalten | ja | ja | nein | nein |

---

## 4. Entitäten

### 4.1 Standort

Ein Standort beschreibt ein Restaurant von Bella Vista.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| name | string | Kreuzberg oder Spandau |
| adresse | string | Adresse des Standorts |
| sitzplaetze | number | ungefähre Gesamtkapazität |
| hatTerrasse | boolean | ob Außenplätze vorhanden sind |
| hatGrill | boolean | ob Grillgerichte möglich sind |
| aktiv | boolean | ob Standort genutzt wird |

Fachliche Hinweise:

- Kreuzberg hat ca. 80 Plätze, Innenbereich und Terrasse.
- Spandau hat ca. 50 Plätze, keine richtige Terrasse und keinen Grill.

---

### 4.2 Tisch

Ein Tisch gehört zu genau einem Standort.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| standortId | string | Referenz auf Standort |
| nummer | string | sichtbare Tischnummer |
| kapazitaet | number | normale Sitzplatzanzahl |
| bereich | enum | innen, außen, fenster, bar |
| kombinierbar | boolean | ob Tisch mit anderen kombiniert werden kann |
| aktiv | boolean | ob Tisch nutzbar ist |

Hinweis:

Tischkombinationen werden als erlaubte Kombinationen von mehreren Tischen innerhalb eines Standorts verstanden. Sie müssen nicht als eigene Hauptentität umgesetzt werden, solange die App speichern kann, welche Tische kombiniert werden dürfen.

---

### 4.3 Gast

Ein Gast ist eine Person, die reserviert, spontan kommt oder als Stammgast erkannt wird.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| name | string | Name des Gasts |
| telefon | string | Telefonnummer |
| notiz | string | optionale Hinweise, z. B. Allergie oder Fensterplatz |
| istStammgast | boolean | ob Gast als Stammgast markiert ist |
| hatBellaCard | boolean | ob Gast eine aktive Bella-Card hat |
| besuchsanzahl | number | bekannte oder geschätzte Anzahl Besuche |
| aktiv | boolean | ob Datensatz genutzt wird |

---

### 4.4 Mitarbeiter

Ein Mitarbeiter nutzt die App intern.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| name | string | Name |
| benutzername | string | Login-Name für die App |
| rolle | enum | inhaber, manager, bedienung, kueche |
| hauptstandortId | string | üblicher Standort |
| aktiv | boolean | ob Mitarbeiter aktiv ist |

---

### 4.5 Reservierung

Eine Reservierung blockiert geplante Tischkapazität für einen Zeitraum.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| gastId | string | Referenz auf Gast |
| standortId | string | Referenz auf Standort |
| tischIds | list<string> | zugeordnete Tische |
| beginn | datetime | Startzeit |
| ende | datetime | geplantes Ende |
| personenanzahl | number | Anzahl Personen |
| status | enum | angefragt, bestaetigt, storniert, noShow, abgeschlossen |
| notiz | string | Sonderwünsche oder Hinweise |
| istGruppe | boolean | ob Gruppenreservierung |
| erstelltVonMitarbeiterId | string | wer die Reservierung angelegt hat |

Hinweis:

Die Reservierung beschreibt die Planung. Die reale Belegung eines Tisches kann davon abweichen, weil Gäste nicht automatisch nach zwei Stunden gehen.

Die Zuordnung von Reservierungen zu Tischen kann technisch als eigene Verbindungstabelle `ReservierungTisch` umgesetzt werden, da eine Reservierung mehrere Tische nutzen kann und ein Tisch über die Zeit in vielen Reservierungen vorkommt.

---

### 4.6 Bestellung

Eine Bestellung gehört normalerweise zu einem Tisch.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| standortId | string | Referenz auf Standort |
| tischId | string | Referenz auf Tisch |
| reservierungId | string/null | optionale Referenz auf Reservierung |
| aufgenommenVonMitarbeiterId | string | Bedienung |
| positionen | list<object> | Artikel, Menge, Preis, Sonderwunsch, Status |
| status | enum | offen, inBearbeitung, abgeschlossen, bezahlt, storniert |
| erstelltAm | datetime | Zeitpunkt der Erstellung |

Bestellpositionen enthalten mindestens:

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| artikelId | string | Referenz auf Artikel |
| menge | number | Anzahl |
| einzelpreis | decimal | Preis zum Zeitpunkt der Bestellung |
| sonderwunsch | string | optionale Notiz |
| status | enum | offen, inZubereitung, serviert, storniert |

---

### 4.7 Artikel

Ein Artikel ist ein Speisekartenartikel.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| name | string | Name des Artikels |
| kategorie | string | z. B. Pasta, Getränk, Dessert |
| preis | decimal | Preis |
| benoetigtGrill | boolean | ob Grill erforderlich ist |
| verfuegbarInStandortIds | list<string> | Standorte, an denen der Artikel bestellbar ist |
| aktiv | boolean | ob Artikel grundsätzlich verfügbar ist |

---

### 4.8 Rechnung

Eine Rechnung entsteht aus einer Bestellung.

Die Rechnung ist ein unterstützendes Objekt, weil sie aus Bestellung, Zahler und Rabattregeln abgeleitet wird. Sie wird trotzdem als eigene Entität beschrieben, damit Abrechnung, Zahlungsstatus und Rabattfreigabe eindeutig modelliert sind.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| bestellungId | string | Referenz auf Bestellung |
| zahlerGastId | string/null | Gast, der zahlt |
| bruttoSumme | decimal | Summe vor Rabatt |
| rabattProzent | number | Rabatt in Prozent |
| endbetrag | decimal | finaler Betrag |
| zahlungsart | enum | bar, karte |
| status | enum | offen, bezahlt, storniert |
| freigegebenVonMitarbeiterId | string/null | wer Rabatt freigegeben hat |

---

### 4.9 CateringAuftrag

Ein Catering-Auftrag beschreibt einen externen Auftrag für eine Firma.

| Attribut | Datentyp | Beschreibung |
| --- | --- | --- |
| id | string | eindeutige ID |
| firmenname | string | Name der Firma |
| ansprechperson | string | Kontaktperson |
| telefon | string | Telefonnummer |
| email | string | E-Mail |
| lieferadresse | string | Adresse des Events |
| datum | date | Eventdatum |
| uhrzeit | time | Eventuhrzeit |
| personenanzahl | number | Anzahl Personen |
| menueBeschreibung | string | gewähltes Menü |
| preisGesamt | decimal | Gesamtpreis |
| status | enum | angefragt, bestaetigt, geliefert, bezahlt |

---

## 5. Beziehungen

| Beziehung | Typ | Beschreibung |
| --- | --- | --- |
| Standort → Tisch | 1:n | Ein Standort hat viele Tische |
| Standort → Reservierung | 1:n | Eine Reservierung gehört zu einem Standort |
| Gast → Reservierung | 1:n | Ein Gast kann mehrere Reservierungen haben |
| Reservierung ↔ Tisch | n:m | Eine Reservierung kann mehrere Tische nutzen; ein Tisch kann über die Zeit in vielen Reservierungen vorkommen |
| Standort ↔ Artikel | n:m | Ein Artikel kann je nach Standort verfügbar sein |
| Tisch → Bestellung | 1:n | Ein Tisch kann über die Zeit mehrere Bestellungen haben |
| Bestellung → Artikel | n:m | Eine Bestellung enthält mehrere Artikel; ein Artikel kann in vielen Bestellungen vorkommen |
| Bestellung → Rechnung | 1:n | Eine Bestellung kann eine oder mehrere Rechnungen haben |
| Mitarbeiter → Reservierung/Bestellung | 1:n | Ein Mitarbeiter kann viele Reservierungen oder Bestellungen anlegen |

---

## 6. Geschäftsregeln

### BR1 — Reservierungsdauer und Belegung

Eine Reservierung blockiert einen Tisch standardmäßig für zwei Stunden. Die reale Belegung endet aber erst, wenn ein Mitarbeiter den Tisch freigibt. Wenn ein Tisch noch belegt ist und bald eine Folgereservierung beginnt, soll die App warnen.

### BR2 — Doppelbuchung

Ein Tisch darf nicht gleichzeitig in zwei aktiven, zeitlich überlappenden Reservierungen verwendet werden.

Aktiv blockierend sind:

- angefragt
- bestaetigt

Nicht blockierend sind:

- storniert
- noShow
- abgeschlossen

### BR3 — Standortbindung

Reservierungen, Tische, Bestellungen und Artikelverfügbarkeit müssen zum gleichen Standort passen. Eine Reservierung in Kreuzberg darf nur Tischen aus Kreuzberg zugeordnet werden.

### BR4 — Gruppenreservierung

Ab 8 Personen gilt eine Reservierung als Gruppenreservierung. Für Gruppen ist ein Gruppenmenü vorgesehen. Gruppenreservierungen und Tischkombinationen dürfen nur durch Inhaber oder Manager geplant werden.

### BR5 — Bella-Card-Rabatt

Der Bella-Card-Rabatt beträgt 15 Prozent. Er gilt nur, wenn der zahlende Gast eine aktive Bella-Card hat. Der Rabatt darf nicht allein durch die Bedienung vergeben werden, sondern muss durch Inhaber oder Manager bestätigt werden.

### BR6 — Stornos und Rechnung

Stornierte Bestellpositionen dürfen nicht in die Rechnungssumme einfließen. Stornos müssen durch Inhaber oder Manager freigegeben und nachvollziehbar gespeichert werden.

### BR7 — Standortabhängige Speisekarte

Artikel, die einen Grill benötigen, dürfen in Spandau nicht bestellbar sein.

### BR8 — Cateringstatus

Catering-Aufträge durchlaufen die Statusfolge:

angefragt → bestaetigt → geliefert → bezahlt

---

## 7. Widersprüche und Auflösungen

### W1 — Zwei-Stunden-Planung vs. reale Belegung

Aussage:

Für die Planung wird ein Tisch nach zwei Stunden wieder frei. In der Realität werden Gäste aber nicht automatisch rausgeworfen.

Auflösung:

Die App unterscheidet zwischen geplantem Reservierungszeitfenster und realem Tischstatus. Die Reservierung endet geplant nach zwei Stunden. Die reale Belegung bleibt bestehen, bis ein Mitarbeiter den Tisch freigibt. Bei drohender Folgereservierung soll die App warnen.

---

### W2 — Bestellung pro Tisch vs. Bella-Card pro Gast

Aussage:

Bestellungen laufen normalerweise über den Tisch. Der Bella-Card-Rabatt gehört aber zu einem bestimmten Stammgast.

Auflösung:

Die Bestellung bleibt tischbezogen. Bei der Rechnung kann ein zahlender Gast ausgewählt werden. Wenn dieser Gast eine aktive Bella-Card hat und Inhaber oder Manager den Rabatt bestätigen, wird 15 Prozent Rabatt angewendet.

---

### W3 — Gemeinsame App vs. unterschiedliche Standorte

Aussage:

Der Inhaber möchte beide Standorte in einer App sehen. Gleichzeitig unterscheiden sich Kreuzberg und Spandau bei Kapazität, Terrasse, Laufkundschaft und Speisekarte.

Auflösung:

Die App verwaltet beide Standorte in einem System. Alle operativen Daten sind aber standortgebunden. Übersichten können pro Standort gefiltert werden. Standortregeln, z. B. keine Grillartikel in Spandau, werden in der App berücksichtigt.

---

## 8. Tischübersicht

Die App soll pro Standort und Tag eine einfache Tischübersicht anzeigen.

| Farbe | Bedeutung |
| --- | --- |
| grün | Tisch ist frei |
| gelb | Tisch ist frei, aber innerhalb der nächsten 60 Minuten reserviert |
| rot | Tisch ist aktuell belegt |

Die Übersicht soll helfen bei:

- Reservierungen
- Walk-ins
- Erkennen freier Zeitfenster
- Verhindern von Doppelbuchungen
- Warnung vor Folgereservierungen

---

## 9. Phasen

### Phase 1 — Reservierung und Tischplanung

Phase 1 enthält den wichtigsten Kern:

- Standorte
- Tische
- Gäste
- Reservierungen
- Tischzuordnung
- Doppelbuchungsschutz
- Tischübersicht
- Walk-ins
- No-Shows
- Rollenrechte für Reservierung und Tischplanung

Ziel:

Der Reservierungsbetrieb soll ohne Zettelchaos funktionieren.

### Phase 2 — Bestellung und Abrechnung

Phase 2 erweitert die App um:

- Bestellungen pro Tisch
- Bestellpositionen
- Küchenstatus
- Stornos
- Rechnung
- Bella-Card-Rabatt

Ziel:

Bestellungen und Rechnungen sollen weniger Fehler verursachen.

### Phase 3 — Erweiterung

Phase 3 enthält:

- Speisekarte verwalten
- standortabhängige Artikel
- Gruppenmenü
- Catering-Aufträge
- einfache Auswertungen zu No-Shows, Stammgästen und Catering

Ziel:

Der Betrieb soll über Reservierung und Bestellung hinaus strukturierter werden.

---

## 10. Akzeptanzkriterien

### AK1 — Reservierung anlegen

Ein Mitarbeiter mit passender Rolle kann eine Reservierung mit Gast, Telefonnummer, Standort, Beginn, Personenanzahl, Status und Notiz anlegen.

### AK2 — Doppelbuchung verhindern

Wenn ein Tisch für 19:00–21:00 aktiv reserviert ist, darf keine weitere aktive Reservierung für denselben Tisch in einem überlappenden Zeitfenster gespeichert werden.

### AK3 — Tischübersicht anzeigen

Ein Mitarbeiter kann für einen Standort und einen Tag sehen, welche Tische frei, bald reserviert oder belegt sind.

### AK4 — Walk-in platzieren

Ein Walk-in darf nur platziert werden, wenn der Tisch bis zur nächsten Reservierung ausreichend frei ist.

### AK5 — No-Show markieren

Eine bestätigte Reservierung darf nach 15 bis 20 Minuten Verspätung als noShow markiert werden. Danach blockiert sie keinen Tisch mehr.

### AK6 — Bestellung aufnehmen

Bedienung kann für einen Tisch eine Bestellung mit mehreren Positionen aufnehmen.

### AK7 — Rechnung berechnen

Eine Rechnung berechnet den Betrag aus allen nicht stornierten Bestellpositionen.

### AK8 — Bella-Card-Rabatt anwenden

Wenn der Zahler eine aktive Bella-Card hat und Inhaber oder Manager die Freigabe erteilen, wird 15 Prozent Rabatt angewendet.

### AK9 — Spandau-Grillregel

Ein Artikel mit `benoetigtGrill = true` darf in Spandau nicht bestellbar sein.

### AK10 — Cateringauftrag verwalten

Ein Catering-Auftrag kann mit Firma, Ansprechperson, Lieferadresse, Datum, Personenzahl, Menü, Preis und Status gespeichert werden.

---

## 11. Offene Fragen

Diese Punkte sind noch nicht vollständig geklärt:

1. Welche genauen Öffnungszeiten gelten je Standort?
2. Welche konkreten Tischkombinationen sind in Kreuzberg erlaubt?
3. Welche konkreten Tischkombinationen sind in Spandau erlaubt?
4. Soll es Teilrechnungen in der ersten Version geben?
5. Wie werden Benutzerkonten für Mitarbeitende angelegt?
6. Welche Geräte werden im Restaurant genutzt?
7. Muss die App offline funktionieren?
8. Welche Gastdaten dürfen wie lange gespeichert werden?

Bis diese Fragen geklärt sind, gilt:

- keine öffentliche Online-Reservierung bauen
- keine Kassenintegration bauen
- keine Lieferfunktion bauen
- keine automatische Teilrechnung bauen
- keine komplexe Auswertung bauen
- keine nicht bestätigten Geschäftsregeln erfinden