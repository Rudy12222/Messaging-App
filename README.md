# Nachrichten App

Einfache Chat-App für Modul 321.

## Architektur
- **Client:** HTML, CSS und JavaScript
- **Backend:** Node.js, Express und Socket.IO
- **Datenbank:** PostgreSQL
- **Container:** Docker Compose mit 3 Services

## Funktionen
- Benutzername eingeben und ändern
- Chatraum beitreten
- Nachrichten lesen und schreiben
- Aktive Benutzer im Raum sehen
- Neue Nachrichten in Echtzeit sehen
- Nachrichten bleiben durch die Datenbank nach Neustarts erhalten

## Start mit Docker
```bash
docker compose up --build
```

Danach:
- Client: http://localhost:8081
- Backend Healthcheck: http://localhost:3000/health

## Lokale Entwicklung ohne Docker
```bash
cd server
npm install
npm start
```

## Wichtige Dateien
- `client/` ? Oberfläche
- `server/` ? API und Socket Server
- `docs/blackbox-testprotokoll.md` ? Testprotokoll
- `docs/ausfallsicherheit.md` ? Ausfallanalyse


## Schnellstart (lokal)
1. Datenbank starten:
   ```bash
   npm run db:up
   ```
2. Im Ordner `server` einmal installieren:
   ```bash
   npm install
   ```
3. Optional: `server/.env.local.example` nach `.env` kopieren.
4. Backend starten:
   ```bash
   npm start --prefix server
   ```

Wenn Port 8080 bei dir besetzt ist, ist das normal. Der Client laeuft hier auf **8081**.
