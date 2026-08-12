# Riferimento di configurazione

Tutto ciò che puoi configurare sull'immagine Schuly Keycloak, in un unico posto.
L'immagine è un build Keycloak 26.6 **ottimizzato**: il vendor del database,
l'health check e le metriche sono già fissati al momento del build - a runtime
fornisci soprattutto la connessione al database, l'hostname pubblico e un admin
di bootstrap.

## Porte

| Porta | Scopo | Esporre pubblicamente? |
|---|---|---|
| `8080` | HTTP - pagine di login, endpoint OIDC/SAML, console di amministrazione, API REST di amministrazione. | Sì, tramite il tuo reverse proxy (che termina il TLS). |
| `9000` | Management - `/health`, `/health/ready`, `/health/live`, `/metrics`. | **No.** Tienila interna; non esporla mai a Internet tramite proxy. |

## Variabili d'ambiente a runtime

Impostale sul container (es. `environment:` in Compose, o `-e` con `docker run`).

| Variabile | Richiesta | Scopo |
|---|---|---|
| `KC_DB_URL` | Sì | URL JDBC del database Postgres, es. `jdbc:postgresql://db:5432/keycloak`. |
| `KC_DB_USERNAME` | Sì | Utente del database. |
| `KC_DB_PASSWORD` | Sì | Password del database. |
| `KC_HOSTNAME` | Sì (prod) | URL pubblico su cui viene servito Keycloak, es. `https://auth.schuly.dev`. Keycloak costruisce da qui tutti gli URL di issuer/redirect. |
| `KC_PROXY_HEADERS` | Sì (dietro un proxy) | Da impostare a `xforwarded` quando un reverse proxy termina il TLS e inoltra gli header `X-Forwarded-*` (usa `forwarded` se invia l'header `Forwarded` dell'RFC 7239). |
| `KC_HTTP_ENABLED` | Sì (dietro un proxy) | `true` perché il backend serva HTTP semplice sulla `8080` mentre il proxy gestisce l'HTTPS. |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | solo al primo avvio | Nome utente temporaneo dell'admin di bootstrap. Usalo una volta per creare un admin vero, poi rimuovilo. |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | solo al primo avvio | Password temporanea dell'admin di bootstrap. |
| `KC_HTTP_PORT` | - | Sostituisce la porta HTTP (predefinita `8080`). |
| `KC_LOG_LEVEL` | - | Livello di log radice (es. `info`, `debug`). |

> Non impostare `KC_DB` - l'immagine è costruita per Postgres. Cambiare vendor
> richiederebbe di ricostruire l'immagine ottimizzata.

## SMTP (email del realm)

Il server di posta del realm `schuly` viene compilato a partire dalle variabili
d'ambiente del container all'avvio - il realm contiene dei segnaposto
`${env.SMTP_*}` che `scripts/resolve-realm-env.sh` risolve prima che l'import venga
eseguito. Se li lasci non impostati, il realm viene importato senza un server di
posta funzionante, il che va bene finché non hai bisogno di email verificate o del
reset password self-service.

| Variabile | Richiesta | Scopo |
|---|---|---|
| `SMTP_HOST` | per la posta | Hostname del server di posta. |
| `SMTP_PORT` | per la posta | Porta del server di posta, es. `587`. |
| `SMTP_FROM` | - | Indirizzo del mittente. Predefinito `noreply@localhost`; imposta un indirizzo reale prima di abilitare la posta. |
| `SMTP_USER` | per la posta | Nome utente SMTP (il realm invia `auth: true`). |
| `SMTP_PASSWORD` | per la posta | Password SMTP. |
| `SMTP_SSL` | - | `true` per TLS implicito. |
| `SMTP_STARTTLS` | - | `true` per STARTTLS. |

> Queste variabili si applicano solo al **primo** avvio, quando il realm viene
> importato. Modificarle in seguito non ha alcun effetto su un realm esistente -
> modifica invece le impostazioni email nella console di amministrazione
> (**Impostazioni realm → Email**).

## Impostazioni fissate al momento del build

Sono fissate al momento del build dell'immagine (`kc.sh build`) e in genere non
vengono cambiate a runtime:

| Impostazione | Valore | Dove |
|---|---|---|
| Vendor del database | `KC_DB=postgres` | `Dockerfile` (stage builder) |
| Endpoint health | `KC_HEALTH_ENABLED=true` | `Dockerfile` (stage builder) |
| Endpoint metriche | `KC_METRICS_ENABLED=true` | `Dockerfile` (stage builder) |
| Comando di avvio | `start --optimized --import-realm` | `Dockerfile` (`CMD`) |
| Percorso della blacklist password | `JAVA_OPTS_APPEND=-Dkeycloak.password.blacklists.path=…` | `Dockerfile` (`ENV`) |

## Comportamento fissato

- **Import del realm** - il realm `schuly` viene importato al **primo** avvio. Agli
  avvii successivi, un realm esistente resta invariato. Vedi
  [Gestione del realm](realm-management.md).
- **Blacklist delle password compromesse** - la lista rockyou si trova in
  `/opt/keycloak/password-blacklists/rockyou.txt`; la password policy del realm usa
  `passwordBlacklist(rockyou.txt)`.
- **Tema di login** - il tema Keycloakify `schuly` è installato come provider jar
  ed è selezionato dal realm (`loginTheme: "schuly"`). Vedi
  [Sviluppo del tema](theme-development.md).

## Volumi

In produzione (Postgres) tutto lo stato vive nel database, quindi **non serve
alcun volume**. I file di import del realm sono integrati nell'immagine in
`/opt/keycloak/data/import`.

Lo sviluppo locale è diverso: usa un database H2 incorporato, persistito nel
volume denominato `keycloak-data-dev` - vedi
[Ambiente di sviluppo](setup/development.md).
