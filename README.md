# Bella Vista Restaurant-App

Interne Anwendung für Reservierungen, Tischplanung, Bestellungen, Rechnungen, Stammgäste und Catering an den Standorten Kreuzberg und Spandau.

## Dokumentation

- [`docs/spec.md`](docs/spec.md) — fachliche Ausgangsspezifikation
- [`docs/architecture.md`](docs/architecture.md) — Systemgrenzen und Architekturleitplanken
- [`docs/backlog.md`](docs/backlog.md) — Features mit stabilen IDs und Status
- [`docs/decisions.md`](docs/decisions.md) — Entscheidungslog
- [`docs/modus-operandi.md`](docs/modus-operandi.md) — Arbeits- und Dokumentationsprozess
- [`AGENTS.md`](AGENTS.md) — kompaktes Briefing für Coding-Agenten

## Lokale Entwicklung

Voraussetzung ist Node.js 22 oder neuer.

```bash
npm install
cp .env.example .env
npm run dev
```

Die Datenbankverbindung wird in `.env` über `DATABASE_URL` konfiguriert. `npm run dev` spielt vor dem Serverstart ausstehende eingecheckte Prisma-Migrationen ein. Das technische Grundgerüst verwendet Prisma mit SQLite; Details stehen in [`docs/architecture.md`](docs/architecture.md).

Für einen bereits angelegten Mitarbeiter wird lokal ein Passwort gesetzt oder zurückgesetzt, ohne Beispieldaten anzulegen:

```bash
read -s BELLA_VISTA_NEUES_PASSWORT
export BELLA_VISTA_NEUES_PASSWORT
npm run passwort-setzen -- <benutzername>
unset BELLA_VISTA_NEUES_PASSWORT
```

Das Passwort wird nicht ausgegeben und muss mindestens zwölf Zeichen lang sein. Beim Zurücksetzen werden bestehende Sitzungen des Mitarbeiters beendet.

### Lokale Demo-Zugänge

Für manuelle Tests von BV-027 können ausschließlich in der lokalen Entwicklung vier aktive Demo-Zugänge samt minimal nötigem Standort Kreuzberg eingerichtet werden:

```bash
npm run demo-zugaenge
```

Das Kommando ist idempotent und aktualisiert vorhandene Mitarbeitende mit denselben Benutzernamen. Alle vier Zugänge verwenden lokal das Passwort `BellaVista2026!`: `chef.inhaber` (Inhaber), `lorenzo.manager` (Manager), `bedienung.demo` (Bedienung) und `kueche.demo` (Küche). Die Passwörter werden mit der bestehenden `scrypt`-Logik gehasht gespeichert. Der Bootstrap legt keine Reservierungen, Tische, Gäste, Bestellungen, Artikel oder Rechnungen an, ist nicht für Produktion bestimmt und stellt keine produktive Kontenbereitstellung oder Sicherheitslösung dar.

`docs/spec.md` übernimmt in diesem Solo-Projekt die Rolle des PRD. Meeting-, Mission-, INBOX- und Results-Artefakte werden nicht geführt.
