# AGENTS.md — Bella Vista Restaurant-App

## Projekt

Interne Restaurant-App für die Bella-Vista-Standorte Kreuzberg und Spandau. Priorität haben zuverlässige Reservierungen, Tischverfügbarkeit und die Vermeidung von Doppelbuchungen.

## Verbindliche Quellen

- Fachliche Ausgangsspezifikation: `docs/spec.md`
- Produktziele und Scope: `docs/prd.md`
- Systemgrenzen, Domänenmodell und technische Leitplanken: `docs/architecture.md`
- Umsetzungsstatus und stabile Feature-IDs: `docs/backlog.md`
- Getroffene Entscheidungen: `docs/decisions.md`
- Arbeitsweise und Dokumentenpflege: `docs/modus-operandi.md`

Bei Widersprüchen gilt: Neuere explizite Einträge in `docs/decisions.md` schlagen ältere Annahmen. Ungeklärte Widersprüche nicht stillschweigend entscheiden, sondern als offene Frage dokumentieren.

## Arbeitsregeln

1. Vor Änderungen die betroffenen Anforderungen und Business Rules in `docs/spec.md` lesen.
2. Für Features eine vorhandene `BV-NNN`-ID verwenden; neue IDs fortlaufend in `docs/backlog.md` ergänzen und nie wiederverwenden.
3. Vor der Implementierung prüfbare Akzeptanzkriterien formulieren.
4. Nur den angeforderten Scope ändern; keine spekulativen Features oder Architektur-Abstraktionen ergänzen.
5. Fachregeln serverseitig bzw. in der maßgeblichen Domänenschicht erzwingen, nicht nur in der UI.
6. Änderungen mit passenden automatisierten Tests verifizieren. Doppelbuchung, Berechtigungen, Rabatte, Stornos und Rechnungsbeträge sind besonders kritisch.
7. Neue Architektur- oder Produktentscheidungen chronologisch in `docs/decisions.md` festhalten.
8. Nach Go-live eines nutzerwirksamen Features ein Ergebnis unter `docs/results/BV-NNN.md` dokumentieren.

## Fachliche Leitplanken

- UI-Texte und fachliche Dokumentation sind deutsch.
- Geldbeträge niemals als Fließkommazahl modellieren.
- Zeiträume werden als halb-offene Intervalle `[Beginn, Ende)` behandelt, damit direkt aufeinanderfolgende Reservierungen möglich sind.
- Eine Reservierung blockiert standardmäßig zwei Stunden; das ist eine Planungsregel, kein automatisches Ende der realen Belegung.
- Ein Tisch darf sich nicht in zeitlich überlappenden aktiven Reservierungen befinden.
- Standortzugehörigkeit muss über alle Beziehungen konsistent bleiben.
- Bella-Card-Rabatt beträgt 15 % und setzt einen berechtigten Zahler sowie Freigabe durch Inhaber oder Manager voraus.
- Stornierte Bestellpositionen dürfen nicht berechnet werden.
- Grillartikel sind in Spandau nicht verfügbar.

## Noch nicht festgelegt

Tech-Stack, Deployment, Authentifizierungsverfahren, Öffnungszeiten, konkrete Tischkombinationen und Datenschutz-/Aufbewahrungsfristen sind offen. Keine dieser Entscheidungen ohne Dokumentation als Projektstandard etablieren.
