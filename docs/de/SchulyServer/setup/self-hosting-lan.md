# Ohne Domain betreiben

Betreibe Schuly in deinem lokalen Netzwerk, um es zu testen, zum Beispiel mit einem Telefon im selben
WLAN. Ohne Domain gibt es kein Zertifikat, der Datenverkehr läuft also über unverschlüsseltes HTTP.
Nutze dieses Setup nur zum Testen.

Folge [Schuly selbst hosten](self-hosting.md) mit den Änderungen unten. Die Beispiele verwenden
`192.168.1.42` als Adresse deines Computers.

## 1. Adresse festlegen

Überspringe den DNS-Schritt. Setze in `.env`:

```sh
API_HOST=192.168.1.42
```

## 2. Unverschlüsseltes HTTP bereitstellen

Ersetze den Inhalt von `Caddyfile`:

```
http://{$API_HOST}:8080 {
	reverse_proxy backend:8080
}
```

Ersetze in `compose.staging.yml` die `ports` des Dienstes `caddy`:

```yaml
    ports:
      - "8080:8080"
```

## 3. Mail-Links korrigieren

Setze in `config/backend.env`:

```
Email__Smtp__PasswordResetLinkTemplate=http://${API_HOST}:8080/reset-password?token={token}
Email__Smtp__EmailVerificationLinkTemplate=http://${API_HOST}:8080/verify-email?token={token}
```

## 4. Starten und prüfen

```sh
docker compose -f compose.staging.yml up -d
curl http://192.168.1.42:8080/api/app/school-systems
```

Gib in der App `http://192.168.1.42:8080` als **Backend URL** ein.

## Fehlerbehebung

**Das Telefon erreicht den Server nicht.** Unter Windows blockiert ihn vielleicht die Firewall.
Erlaube Docker Desktop in privaten Netzwerken oder füge eine eingehende Regel für Port 8080 hinzu.

**Eine `nip.io`- oder `sslip.io`-Adresse löst nicht auf.** Viele Heimrouter blockieren öffentliche
Namen, die auf private Adressen zeigen. Nutze stattdessen die IP-Adresse.

**Die Adresse funktioniert nicht mehr.** Dein Router hat vielleicht eine neue IP-Adresse vergeben.
Aktualisiere `API_HOST` und starte neu, oder reserviere die Adresse in deinem Router.
