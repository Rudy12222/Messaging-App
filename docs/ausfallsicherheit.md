# Ausfallsicherheit und Bedeutung der Systemteile

## Client
- **Aufgabe:** Oberfläche für Benutzername, Raum, Nachrichten und aktive Benutzer.
- **Ausfall:** Benutzer können nicht chatten, obwohl Backend und Datenbank noch laufen.
- **Verbesserung:** Statische Dateien über zweiten Webserver oder CDN spiegeln.

## Backend
- **Aufgabe:** Verbindet Client und Datenbank, verteilt Nachrichten in Echtzeit.
- **Ausfall:** Keine Echtzeit-Nachrichten mehr, keine neuen Nachrichten speicherbar.
- **Verbesserung:** Mehrere Backend-Instanzen hinter einem Load Balancer und Healthchecks.

## Datenbank
- **Aufgabe:** Speichert Benutzer und Nachrichten dauerhaft.
- **Ausfall:** Alte Daten nicht mehr lesbar, neue Daten können nicht gespeichert werden.
- **Verbesserung:** Replikation, Backups und Monitoring.

## Docker / Compose
- **Aufgabe:** Startet alle Teile in einer klaren und wiederholbaren Umgebung.
- **Ausfall:** Die App kann auf einem fremden System nicht einfach gestartet werden.
- **Verbesserung:** Versionsfixierung, `.env`-Dateien und klare Startanleitung.

## Konkrete nächste Schritte
- Healthchecks für alle Services aktiv lassen
- tägliches DB-Backup einplanen
- Logging zentral sammeln (z. B. Loki/ELK später)
