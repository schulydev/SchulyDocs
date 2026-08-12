# Documentazione SchulyKeycloak

L'immagine [Keycloak](https://www.keycloak.org/) di Schuly - il provider di
identità usato in produzione per Schuly. Il container integra un tema di login
[Keycloakify](https://keycloakify.dev) (come provider jar), una blacklist di
password compromesse (rockyou) e il realm `schuly`, ed è distribuito come build
Keycloak *ottimizzata* per un avvio rapido in produzione. Le release pubblicano
un'immagine multi-architettura su `ghcr.io/schulydev/schulykeycloak`.

## Indice della documentazione

**Per iniziare**
- [Ambiente di sviluppo](setup/development.md) - eseguire l'immagine in locale con Docker Compose.
- [Self-hosting dello stack completo](setup/self-hosting.md) - distribuire Keycloak + Postgres + un proxy TLS in produzione.

**Guide**
- [Configurazione per la produzione](setup/production.md) - eseguire l'immagine ottimizzata con un database Postgres.
- [Gestione del realm](realm-management.md) - modificare e salvare il realm `schuly` (inclusa la 2FA).
- [Sviluppo del tema](theme-development.md) - lavorare sul tema di login Keycloakify.
- [Modalità account vs. privacy](account-vs-privacy-mode.md) - come gli utenti scelgono di accedere.
- [Release](setup/release.md) - creare una release e pubblicare le immagini.
- [Contribuire](contributing.md) - il flusso issue → branch → PR.

**Riferimento e background**
- [Riferimento di configurazione](configuration.md) - ogni porta, variabile d'ambiente e valore predefinito.
- [Architettura](architecture.md) - come si compongono tema, realm e immagine di base, e il flusso di login.
- [Risoluzione dei problemi](troubleshooting.md) - sintomi, cause e soluzioni.

## Struttura del repository

Rilevante solo se stai modificando l'immagine stessa.

| Percorso | Scopo |
|---|---|
| `Dockerfile` | Build multi-stadio: theme jar → blacklist rockyou → Keycloak 26.6 ottimizzato → immagine di runtime. |
| `keycloakify/` | Il tema di login personalizzato Schuly (Keycloakify 11, React + Tailwind + shadcn). Compilato in un provider jar al momento del build dell'immagine. |
| `realms/schuly-realm.json` | Il realm `schuly` (ruoli, gruppi, client scope, flusso browser 2FA). Importato al primo avvio. |
| `compose.dev.yml` | Sviluppo locale: `start-dev --import-realm`, admin/admin su `:8080`. |
| `scripts/keycloak-export.{sh,ps1,bat}` | Riporta le modifiche al realm dal container in esecuzione a `realms/`. |
| `.github/workflows/docker-publish-release.yaml` | Compila e pubblica l'immagine multi-architettura a ogni release GitHub. |
| `application.properties` | Fonte di verità unica per la versione; la CI la sincronizza con il tag di release. |
