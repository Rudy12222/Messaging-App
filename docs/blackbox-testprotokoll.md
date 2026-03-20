# Blackbox Testprotokoll

## Testumgebung

- Client im Browser über `http://localhost:8080`
- Backend über Docker Compose gestartet
- Datenbank PostgreSQL im Container
- Testdatum: 2026-03-15

## Testfülle

### 1. Benutzername setzen

- **Schritt:** Name eingeben und auf `Name speichern` klicken.
- **Erwartet:** Name wird gespeichert.
- **Ergebnis:** Erfolgreich.

### 2. Chatraum beitreten

- **Schritt:** Raumname eingeben und auf `Raum beitreten` klicken.
- **Erwartet:** Raum wird geöffnet und bisherige Nachrichten werden geladen.
- **Ergebnis:** Erfolgreich.

### 3. Nachricht senden

- **Schritt:** Nachricht schreiben und absenden.
- **Erwartet:** Nachricht erscheint direkt im Chatfenster.
- **Ergebnis:** Erfolgreich.

### 4. Echtzeit mit zweitem Client

- **Schritt:** App in zweitem Browserfenster öffnen und in denselben Raum gehen.
- **Erwartet:** Neue Nachrichten erscheinen ohne Neuladen in beiden Fenstern.
- **Ergebnis:** Erfolgreich.

### 5. Aktive Benutzer anzeigen

- **Schritt:** Zwei Benutzer betreten denselben Raum.
- **Erwartet:** Beide Benutzer werden in der Liste angezeigt.
- **Ergebnis:** Erfolgreich.

### 6. Persistenz nach Neustart

- **Schritt:** Container stoppen und wieder starten.
- **Erwartet:** Alte Nachrichten sind noch vorhanden.
- **Ergebnis:** Erfolgreich, weil PostgreSQL-Volume verwendet wird.

## Kurzfazit

Alle Kernfunktionen wurden erfolgreich getestet. Offener Punkt: Fremdsystem-Test sollte vor Abgabe nochmal gemacht werden.
