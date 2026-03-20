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

