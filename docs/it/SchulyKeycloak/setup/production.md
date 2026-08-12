# Configurazione per la produzione

In produzione, esegui l'immagine pubblicata
`ghcr.io/schulydev/schulykeycloak:latest` (oppure un tag `:<semver>` fissato -
vedi [Release](release.md)). L'immagine è un build Keycloak **ottimizzato**
(`kc.sh build` viene eseguito al momento del build dell'immagine), quindi
l'entrypoint a runtime parte con `start --optimized --import-realm` per un avvio
rapido. È precostruita per Postgres (`KC_DB=postgres`), con health check e
metriche attivi.

> Stai distribuendo l'intero stack (Postgres + reverse proxy + TLS) da zero?
> Segui invece [Self-hosting dello stack completo](self-hosting.md) - lì trovi un
> docker-compose completo e una guida per il primo admin.

## Esecuzione

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

Le variabili essenziali sono la connessione al database (`KC_DB_*`), l'hostname
pubblico (`KC_HOSTNAME`), le impostazioni proxy quando sei dietro un proxy che
termina il TLS (`KC_PROXY_HEADERS`, `KC_HTTP_ENABLED`) e un admin di bootstrap per
il primo avvio (`KC_BOOTSTRAP_ADMIN_*`). L'elenco completo - ogni variabile, ogni
porta e ogni valore predefinito integrato - si trova nel
[riferimento di configurazione](../configuration.md).

> **Sicurezza:** l'admin di bootstrap è temporaneo - crea un admin vero e rimuovi
> le variabili `KC_BOOTSTRAP_ADMIN_*` dopo il primo avvio. Non committare mai
> segreti e non metterli in `realms/schuly-realm.json`, termina il TLS sul proxy,
> e non esporre mai pubblicamente la porta di management `9000`.
