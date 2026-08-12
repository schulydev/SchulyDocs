# Produktivbetrieb

Führe in Produktion das veröffentlichte Image `ghcr.io/schulydev/schulykeycloak:latest`
aus (oder einen fest gepinnten `:<semver>`-Tag - siehe [Release](release.md)). Das
Image ist ein **optimierter** Keycloak-Build (`kc.sh build` läuft zur
Image-Build-Zeit), der Runtime-Entrypoint startet also mit
`start --optimized --import-realm` für einen schnellen Start. Es ist für Postgres
vorgebaut (`KC_DB=postgres`), mit aktivierten Health- und Metrics-Endpunkten.

> Willst du den gesamten Stack (Postgres + Reverse Proxy + TLS) von Grund auf
> aufsetzen? Folge stattdessen [Den gesamten Stack selbst hosten](self-hosting.md) -
> dort findest du ein vollständiges docker-compose-Setup und eine Anleitung für den
> ersten Admin.

## Ausführen

```sh
docker run -p 8080:8080 \
  -e KC_DB_URL=jdbc:postgresql://db:5432/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=... \
  -e KC_HOSTNAME=https://auth.schuly.dev \
  -e KC_PROXY_HEADERS=xforwarded \
  -e KC_HTTP_ENABLED=true \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=... \
  ghcr.io/schulydev/schulykeycloak:latest
```

Die wesentlichen Variablen sind die Datenbankverbindung (`KC_DB_*`), der öffentliche
Hostname (`KC_HOSTNAME`), die Proxy-Einstellungen hinter einem TLS-terminierenden
Proxy (`KC_PROXY_HEADERS`, `KC_HTTP_ENABLED`) und ein Bootstrap-Admin für den ersten
Start (`KC_BOOTSTRAP_ADMIN_*`). Die vollständige Liste - jede Variable, jeder Port
und jeder eingebackene Default - steht in der
[Konfigurationsreferenz](../configuration.md).

> **Sicherheit:** Der Bootstrap-Admin ist nur temporär - lege nach dem ersten Start
> einen echten Admin an und entferne die `KC_BOOTSTRAP_ADMIN_*`-Variablen. Committe
> niemals Secrets und platziere sie nicht in `realms/schuly-realm.json`, terminiere
> TLS am Proxy, und exponiere den Management-Port `9000` nicht öffentlich.
