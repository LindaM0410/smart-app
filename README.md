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

`docs/spec.md` übernimmt in diesem Solo-Projekt die Rolle des PRD. Meeting-, Mission-, INBOX- und Results-Artefakte werden nicht geführt.
